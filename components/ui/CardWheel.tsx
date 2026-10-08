'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

/** Angle between neighbouring cards. At the radius below, neighbours just
 *  clear each other, so every card on show reads whole. */
const STEP = (28 * Math.PI) / 180;
/** Hub to card centre, in card heights. */
const RADIUS = 1.75;
/** The front card's top edge, in card heights below the stage's top: room
 *  for its label chip. The hub then sits FRONT_TOP + 0.5 + RADIUS = 2.35
 *  card heights down, which wheel.css builds the dial around. */
const FRONT_TOP = 0.1;

/** Cards fade out on their way round past the five on show (radians from
 *  the top, about 66° to 86°); left in, the next pair lie almost flat along
 *  the bottom and read as stray streaks. Ten cards 28° apart wrap from one
 *  end of the wheel to the other at 140°, well past the fade. */
const FADE_FROM = 1.15;
const FADE_TO = 1.5;

const FRONT_ZOOM = 0.04;
const SIDE_SHRINK = 0.04;
/** A hovered side card rises along its spoke, in card heights. */
const HOVER_LIFT = 0.05;

/** A spring with a little overshoot, so the wheel clicks into place. */
const SPRING = 70;
const DAMPING = 12;

/** Idle, the wheel turns to the next card every few seconds. */
const AUTO_EVERY = 3.2;
/** How far, in cards, the wheel turns in as the slide scrolls into view. */
const SPIN_IN = 2.5;

/** Pixels of sideways travel before a press becomes a drag. */
const DRAG_START = 6;
/** Seconds of a flick's speed carried into where the wheel settles. */
const FLICK = 0.2;
const MAX_FLICK = 3;

type Props = {
  /** The words in the dial at the wheel's hub. */
  title: string;
  /** What one card is, for the turn buttons: "Next skill". */
  itemName: string;
  /** Server-rendered cards, so their images keep the AVIF pipeline. */
  children: ReactNode;
};

/** Photo cards on a wide wheel whose hub sits below the slide: five on show,
 *  the front one upright, the rest turning away round the rim. The words at
 *  the hub become a window onto whichever card is at the front. */
export function CardWheel({ title, itemName, children }: Props) {
  const items = Children.toArray(children);
  const count = items.length;
  const { reducedMotion } = useExperience();
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const ringRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const windowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track || count === 0) return;

    const cycle = count * STEP;
    const wrap = (angle: number) => angle - cycle * Math.round(angle / cycle);
    const snap = (angle: number) => STEP * Math.round(angle / STEP);
    const frontOf = (angle: number) => (((Math.round(angle / STEP) % count) + count) % count);

    // Re-read whenever they could have changed, so the wheel never turns on a
    // stale size: the track is full bleed, the cards are sized off the viewport.
    let width = 0;
    let cardW = 0;
    let cardH = 0;
    const measure = (trackWidth = track.getBoundingClientRect().width) => {
      width = trackWidth;
      const first = cardRefs.current[0];
      cardW = first?.offsetWidth ?? 0;
      cardH = first?.offsetHeight ?? 0;
    };

    let wheel = 0;
    let target = 0;
    let velocity = 0;
    let autoplay = !reducedMotion;
    let autoClock = 0;
    let hovering = false;
    let hovered: number | null = null;
    let focused = false;
    const lifts = Array.from({ length: count }, () => 0);

    // The letterform window: an ink outline under two photo layers. The new
    // photo fades in on top while the old one waits underneath (see
    // wheel.css), so changing cards never flashes the bare words between.
    let front = 0;
    let shown: number | null = null;
    const awaiting = new WeakSet<HTMLImageElement>();
    const showWindow = (index: number | null) => {
      if (index === shown) return;
      const layers = windowRefs.current;
      const outline = outlineRef.current;
      if (index === null) {
        layers.forEach((layer) => layer?.classList.remove('is-shown', 'is-front'));
        outline?.classList.remove('is-shown');
        shown = null;
        return;
      }
      // The card's own image, already decoded at the size the browser chose.
      // Not loaded yet: try again once it is (the frame loop would anyway;
      // reduced motion has no loop to).
      const image = cardRefs.current[index]?.querySelector('img');
      const src = image?.complete ? image.currentSrc : '';
      const next = layers[1 - front];
      if (!src || !next) {
        if (image && !awaiting.has(image)) {
          awaiting.add(image);
          image.addEventListener('load', () => redraw(), { once: true });
        }
        return;
      }
      next.style.backgroundImage = `url("${src}")`;
      next.classList.add('is-shown', 'is-front');
      layers[front]?.classList.remove('is-shown', 'is-front');
      outline?.classList.add('is-shown');
      front = 1 - front;
      shown = index;
    };

    const render = (progress: number, dt: number, instant: boolean) => {
      // Turned and drawn in as the slide scrolls into view.
      const eased = 1 - (1 - progress) ** 3;
      const spin = (1 - eased) * SPIN_IN * STEP;
      const reachBase = RADIUS * cardH * (0.8 + 0.2 * eased);
      const hubX = width / 2;
      const hubY = (FRONT_TOP + 0.5 + RADIUS) * cardH;
      const k = instant ? 1 : 1 - Math.exp(-dt * 12);
      const atFront = frontOf(wheel);
      const shownFor = Math.min(progress * 1.6, 1);

      for (let i = 0; i < count; i++) {
        const node = cardRefs.current[i];
        if (!node) continue;

        const angle = wrap(i * STEP - wheel) + spin;
        const away = Math.abs(angle) / STEP;
        const lift = hovered === i && i !== atFront ? HOVER_LIFT * cardH : 0;
        lifts[i] += (lift - lifts[i]) * k;

        const reach = reachBase + lifts[i];
        const x = hubX + reach * Math.sin(angle);
        const y = hubY - reach * Math.cos(angle);
        const scale =
          1 + FRONT_ZOOM * Math.max(0, 1 - away) - SIDE_SHRINK * Math.min(away, 2);
        const fade = Math.min(Math.max((FADE_TO - Math.abs(angle)) / (FADE_TO - FADE_FROM), 0), 1);

        node.style.transform =
          `translate(${x - cardW / 2}px, ${y - cardH / 2}px) ` +
          `rotate(${angle}rad) scale(${scale})`;
        node.style.opacity = String(fade * shownFor);
        // Out of sight round the bottom: no hit-testing over the bio below.
        node.style.visibility = fade === 0 ? 'hidden' : '';
        node.style.zIndex = String(Math.round(100 - Math.abs(angle) * 30));
      }

      // The dashed ring turns with the cards.
      const ring = ringRef.current;
      if (ring) ring.style.transform = `rotate(${spin - wheel}rad)`;
    };

    // Reduced motion has no frame loop, so it redraws on input instead.
    let redraw = () => {};

    const announce = (index: number) => {
      const label = cardRefs.current[index]?.querySelector('figcaption')?.textContent ?? '';
      if (liveRef.current) liveRef.current.textContent = `${label}, ${index + 1} of ${count}`;
    };

    // Any deliberate turn hands the wheel over for good: it stops turning by
    // itself, which is also the pause control moving content needs.
    const takeOver = () => {
      autoplay = false;
    };

    const turnTo = (index: number) => {
      takeOver();
      target += wrap(index * STEP - target);
      announce(index);
      redraw();
    };

    const turnBy = (steps: number) => {
      takeOver();
      target = snap(target) + steps * STEP;
      announce(frontOf(target));
      redraw();
    };

    const cardFrom = (node: EventTarget | null) => {
      const card = node instanceof Element ? node.closest<HTMLElement>('[data-card]') : null;
      return card ? Number(card.dataset.card) : null;
    };

    type Drag = {
      id: number;
      x: number;
      y: number;
      from: number;
      moving: boolean;
      time: number;
      speed: number;
      card: number | null;
    };
    let drag: Drag | null = null;

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || drag) return;
      if (event.target instanceof Element && event.target.closest('button')) return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        from: wheel,
        moving: false,
        time: event.timeStamp,
        speed: 0,
        card: cardFrom(event.target),
      };
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !drag) {
        hovering = true;
        const over = cardFrom(event.target);
        if (over !== hovered) {
          hovered = over;
          redraw();
        }
        return;
      }
      if (!drag || event.pointerId !== drag.id) return;

      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moving) {
        // Sideways turns the wheel; up and down is left to scrolling.
        if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(dy)) return;
        drag.moving = true;
        hovered = null;
        takeOver();
        stage.setPointerCapture(event.pointerId);
        stage.classList.add('is-dragging');
      }

      // The card under the pointer keeps pace with it along the rim.
      const next = drag.from - dx / (RADIUS * cardH || 1);
      const seconds = Math.max((event.timeStamp - drag.time) / 1000, 1 / 240);
      drag.speed = drag.speed * 0.5 + ((next - wheel) / seconds) * 0.5;
      drag.time = event.timeStamp;
      wheel = next;
      target = next;
      velocity = 0;
      redraw();
    };

    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const ended = drag;
      drag = null;
      stage.classList.remove('is-dragging');

      if (ended.moving) {
        // A flick carries on a little; a drag that stopped before letting go
        // settles where it is.
        const speed = event.timeStamp - ended.time > 80 ? 0 : ended.speed;
        const base = snap(wheel);
        const flung = snap(wheel + speed * FLICK);
        target = Math.min(Math.max(flung, base - MAX_FLICK * STEP), base + MAX_FLICK * STEP);
        velocity = speed;
        announce(frontOf(target));
        redraw();
      } else if (event.type === 'pointerup' && ended.card !== null) {
        // A tap or click brings that card round to the front.
        turnTo(ended.card);
      }
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovering = false;
      hovered = null;
      redraw();
    };

    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!stage.contains(event.relatedTarget as Node | null)) focused = false;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        turnBy(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        turnBy(1);
      }
    };

    const onPrev = () => turnBy(-1);
    const onNext = () => turnBy(1);
    // Dragging a card must turn the wheel, not pick up its image.
    const onNativeDrag = (event: DragEvent) => event.preventDefault();

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('focusin', onFocusIn);
    stage.addEventListener('focusout', onFocusOut);
    stage.addEventListener('keydown', onKey);
    stage.addEventListener('dragstart', onNativeDrag);
    prevRef.current?.addEventListener('click', onPrev);
    nextRef.current?.addEventListener('click', onNext);

    const detach = () => {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('focusin', onFocusIn);
      stage.removeEventListener('focusout', onFocusOut);
      stage.removeEventListener('keydown', onKey);
      stage.removeEventListener('dragstart', onNativeDrag);
      prevRef.current?.removeEventListener('click', onPrev);
      nextRef.current?.removeEventListener('click', onNext);
    };

    measure();

    if (reducedMotion) {
      // Still: no spin in, no turning by itself, and every turn snaps.
      redraw = () => {
        wheel = target;
        velocity = 0;
        render(1, 0, true);
        showWindow(frontOf(wheel));
      };
      const resize = new ResizeObserver(() => {
        measure();
        redraw();
      });
      resize.observe(track, { box: 'border-box' });
      const first = cardRefs.current[0];
      if (first) resize.observe(first);
      redraw();
      return () => {
        resize.disconnect();
        detach();
      };
    }

    let onScreen = false;
    const visibility = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: '20% 0px' },
    );
    visibility.observe(stage);

    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (onScreen) {
        // Read before any write this frame, so it never forces a reflow.
        const rect = track.getBoundingClientRect();
        measure(rect.width);
        const viewport = window.innerHeight;
        // Scrubbed by scroll position, so scrolling back turns it out again.
        const progress = Math.min(Math.max((viewport - rect.top) / (viewport * 0.75), 0), 1);

        if (autoplay && !hovering && !focused && !drag && progress >= 1) {
          autoClock += dt;
          if (autoClock >= AUTO_EVERY) {
            autoClock = 0;
            target = snap(target) + STEP;
          }
        } else {
          autoClock = 0;
        }

        if (!drag) {
          velocity += (SPRING * (target - wheel) - DAMPING * velocity) * dt;
          wheel += velocity * dt;
        }

        render(progress, dt, false);
        showWindow(progress >= 0.98 ? frontOf(wheel) : null);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      detach();
    };
  }, [count, reducedMotion]);

  return (
    <div className="wheel" ref={stageRef}>
      <div className="wheel-dial">
        <div className="wheel-ring-frame" aria-hidden="true">
          <div className="wheel-ring" ref={ringRef} />
        </div>
        <span className="wheel-pointer" aria-hidden="true" />

        <div className="wheel-words">
          <h2 className="wheel-word">{title}</h2>
          <div ref={outlineRef} className="wheel-word wheel-outline" aria-hidden="true">
            {title}
          </div>
          {[0, 1].map((layer) => (
            <div
              key={layer}
              className="wheel-word wheel-window"
              aria-hidden="true"
              ref={(node) => {
                windowRefs.current[layer] = node;
              }}
            >
              {title}
            </div>
          ))}
        </div>

        <button
          ref={prevRef}
          type="button"
          className="wheel-turn wheel-turn--prev"
          aria-label={`Previous ${itemName}`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          ref={nextRef}
          type="button"
          className="wheel-turn wheel-turn--next"
          aria-label={`Next ${itemName}`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <ul className="wheel-cards" ref={trackRef}>
        {items.map((child, i) => (
          <li
            key={i}
            className="wheel-card"
            data-card={i}
            ref={(node) => {
              cardRefs.current[i] = node;
            }}
          >
            {child}
          </li>
        ))}
      </ul>

      {/* Names the front card after a deliberate turn, not on every idle one. */}
      <p ref={liveRef} className="visually-hidden" aria-live="polite" />
    </div>
  );
}
