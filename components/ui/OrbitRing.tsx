'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

/** About one turn every 40 s. */
const SPIN = 0.16;
const SCROLL_BOOST = 0.0016;
const MAX_BOOST = 0.6;

/** The orbit is seen from slightly above and leans to one side, so it reads
 *  as a ring in space rather than a flat slider. */
const VIEW_TILT = -0.07;
const LEAN = 0.09;

type Props = {
  /** The big words the cards orbit, one per line. */
  lines: string[];
  /** Which way the orbit leans; neighbouring rings can mirror each other. */
  lean?: 1 | -1;
  /** Server-rendered cards, so their images keep the AVIF pipeline. */
  children: ReactNode;
};

export function OrbitRing({ lines, lean = 1, children }: Props) {
  const items = Children.toArray(children);
  const count = items.length;
  const { reducedMotion } = useExperience();
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || count === 0) return;

    const step = (Math.PI * 2) / count;
    const lean3d = LEAN * lean;

    // Cached on resize so the frame loop never measures the ring's size.
    let radius = 0;
    let perspective = 0;
    // Where the eye sits in the orbit's own frame, for the edge-on test below.
    let eyeX = 0;
    let eyeZ = 0;

    const measure = () => {
      const width = ring.clientWidth;
      radius = Math.min(width * (width < 640 ? 0.5 : 0.42), 560);
      perspective = radius * 3.4;
      eyeX = perspective * Math.sin(lean3d) * Math.sin(VIEW_TILT);
      eyeZ = perspective * Math.cos(VIEW_TILT);
    };

    const place = (angle: number, progress: number) => {
      // Swoops in on a spiral as the section scrolls in: from nearer the
      // centre, turned further round, and fading up.
      const eased = 1 - (1 - progress) ** 3;
      const r = radius * (0.45 + 0.55 * eased);
      const spiral = (1 - eased) * 1.6;

      for (let i = 0; i < count; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const theta = angle + i * step + spiral;
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);

        // Seen in perspective, a card turns edge-on a little before the side
        // of the ring, and past that the eye would meet its back. Turning it
        // round there keeps every image reading the right way, and the swap
        // happens while the card is a sliver, so it never shows.
        const facing = eyeX * sin + eyeZ * cos - r;
        const flip = facing < 0 ? 180 : 0;

        card.style.transform =
          `perspective(${perspective}px) rotateX(${VIEW_TILT}rad) rotateZ(${lean3d}rad) ` +
          `rotateY(${theta}rad) translateZ(${r}px) rotateY(${flip}deg)`;

        // Depth decides stacking, not preserve-3d sorting, which flickers
        // where a large text plane meets rotating cards. The words sit on the
        // plane through the ring's centre, so the near half passes in front.
        const depth = cos * Math.cos(VIEW_TILT) + sin * Math.sin(lean3d) * Math.sin(VIEW_TILT);
        card.style.zIndex = String(
          depth > 0 ? 30 + Math.round(depth * 20) : Math.round((depth + 1) * 12),
        );
        card.style.opacity = String(Math.min(progress * 1.8, 1));
      }
    };

    measure();

    if (reducedMotion) {
      // A still arrangement, fully entered, turned so no card sits edge-on.
      place(step / 2, 1);
      const observer = new ResizeObserver(() => {
        measure();
        place(step / 2, 1);
      });
      observer.observe(ring);
      return () => observer.disconnect();
    }

    let angle = 0;
    let speed = SPIN;
    let boost = 0;
    let hold = false;
    let lastScroll = window.scrollY;
    let last = performance.now();
    let frame = 0;
    let onScreen = false;

    const resize = new ResizeObserver(measure);
    resize.observe(ring);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: '20% 0px' },
    );
    visibility.observe(ring);

    // Hover or keyboard focus slows the ring to a stop, so a card can be hit.
    const stop = () => {
      hold = true;
    };
    const go = () => {
      hold = false;
    };
    ring.addEventListener('pointerenter', stop);
    ring.addEventListener('pointerleave', go);
    ring.addEventListener('focusin', stop);
    ring.addEventListener('focusout', go);

    const onScroll = () => {
      const y = window.scrollY;
      boost = Math.min(boost + Math.abs(y - lastScroll) * SCROLL_BOOST, MAX_BOOST);
      lastScroll = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (onScreen) {
        // Read before any write this frame, so it never forces a reflow.
        const top = ring.getBoundingClientRect().top;
        const viewport = window.innerHeight;
        // Scrubbed by scroll position, so scrolling back reverses the entrance.
        const progress = Math.min(Math.max((viewport - top) / (viewport * 0.7), 0), 1);

        const target = hold ? 0 : SPIN + boost;
        speed += (target - speed) * Math.min(dt * 3.5, 1);
        boost *= 1 - Math.min(dt * 2.2, 1);
        angle += speed * dt;

        place(angle, progress);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', onScroll);
      ring.removeEventListener('pointerenter', stop);
      ring.removeEventListener('pointerleave', go);
      ring.removeEventListener('focusin', stop);
      ring.removeEventListener('focusout', go);
    };
  }, [count, lean, reducedMotion]);

  return (
    <div className="orbit" ref={ringRef}>
      <h2 className="orbit-word">
        {lines.map((line, i) => (
          <span key={line}>
            {line}
            {/* Keeps "about me" one phrase for screen readers across the break. */}
            {i < lines.length - 1 ? ' ' : null}
          </span>
        ))}
      </h2>

      <ul className="orbit-track">
        {items.map((child, i) => (
          <li
            key={i}
            className="orbit-card"
            ref={(node) => {
              cardRefs.current[i] = node;
            }}
          >
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
