'use client';

import { useEffect, useRef } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

const SPRITE = 64;
/** Seconds a freshly shed petal takes to fade in, so none pop into view. */
const FADE_IN = 0.7;
/** Seconds of wind simulated before the first frame, so the field opens
 *  mid-flow instead of as an even scatter. */
const WARM_UP = 12;

/** The three blossom shades from the reference, each a gradient from a pale
 *  top to a deeper base so a petal reads round as it turns. */
const SHADES = [
  { from: '#f6cedd', to: '#e7a6c2' },
  { from: '#eeb6cf', to: '#da8dae' },
  { from: '#e6a6c3', to: '#cd7fa1' },
] as const;

const OUTLINE = '#2b2026';

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** 0 (far, small, slow) to 1 (near, large, fast): drives parallax. */
  depth: number;
  rot: number;
  spin: number;
  sway: number;
  swaySpeed: number;
  swayAmp: number;
  flip: number;
  flipSpeed: number;
  shade: number;
  /** Seconds since it was shed, for the fade in. */
  age: number;
};

/** Pre-renders one petal per shade: a teardrop with a thin dark outline and a
 *  small notch at the wide end, matching the blossoms on the tree. Drawn once,
 *  then stamped for every instance. */
function makeSprite(shade: (typeof SHADES)[number]) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE;
  canvas.height = SPRITE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const S = SPRITE;
  ctx.translate(S / 2, S / 2);

  const w = S * 0.3; // half-width at the lobes
  const top = -S * 0.46; // pointed tip
  const bot = S * 0.42; // the two lobes
  const notch = S * 0.24; // centre dips up from the lobes

  const petal = () => {
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.bezierCurveTo(w * 1.2, top * 0.5, w * 1.1, bot * 0.55, w * 0.8, bot);
    ctx.quadraticCurveTo(w * 0.36, bot, 0, notch);
    ctx.quadraticCurveTo(-w * 0.36, bot, -w * 0.8, bot);
    ctx.bezierCurveTo(-w * 1.1, bot * 0.55, -w * 1.2, top * 0.5, 0, top);
    ctx.closePath();
  };

  const fill = ctx.createLinearGradient(0, top, 0, bot);
  fill.addColorStop(0, shade.from);
  fill.addColorStop(1, shade.to);

  petal();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = S * 0.03;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // A faint vein so the petal keeps its shape when it tips edge-on.
  ctx.strokeStyle = 'rgba(43,32,38,0.3)';
  ctx.lineWidth = S * 0.02;
  ctx.beginPath();
  ctx.moveTo(0, top * 0.62);
  ctx.lineTo(0, notch * 0.55);
  ctx.stroke();

  return canvas;
}

type Props = {
  /** Selector for the element the petals blow off, looked up beside the
   *  canvas. Without one they come in from the upper right. */
  source?: string;
};

/** Petals shed from the sakura tree drift down and left toward the quote,
 *  carried by a gentle breeze with occasional gusts. Pauses when the section
 *  leaves the viewport; renders a still frame of the same drift when the
 *  visitor prefers reduced motion. */
export function PetalField({ source }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useExperience();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const sprites = SHADES.map(makeSprite);
    const tree = source ? canvas.parentElement?.querySelector(source) : null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    // Scales the sideways wind by the box's shape: a full breeze in landscape,
    // a steeper fall in portrait so petals cross the quote before the edge.
    let drift = 1;
    let petals: Petal[] = [];
    // Where petals are shed: the canopy, in canvas pixels.
    const crown = { x: 0, y: 0, w: 0, h: 0 };

    // Wind: a steady leftward breeze plus smoothed gusts that fire every few
    // seconds, pushing petals toward the quote and tumbling them a little more.
    let clock = 0;
    let gust = 0;
    let gustTarget = 0;
    let gustEnd = 0;
    let nextGust = 2 + Math.random() * 3;

    const seed = (p: Petal, fresh: boolean) => {
      if (!fresh) {
        // The opening scatter, already mid-flight.
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        p.age = FADE_IN;
      } else if (Math.random() < 0.6) {
        // Shed from the canopy, fading in over it.
        p.x = crown.x + Math.random() * crown.w;
        p.y = crown.y + Math.random() * crown.h;
        p.age = 0;
      } else {
        // Blown in over the top edge, above the tree.
        p.x = crown.x + Math.random() * (width + SPRITE - crown.x);
        p.y = -SPRITE;
        p.age = FADE_IN;
      }
      p.size = 11 + Math.random() * 17;
      p.depth = (p.size - 11) / 17;
      p.vy = 14 + p.depth * 24 + Math.random() * 6;
      p.vx = -(14 + p.depth * 22 + Math.random() * 8);
      p.rot = Math.random() * Math.PI * 2;
      p.spin = (Math.random() - 0.5) * 1.4;
      p.sway = Math.random() * Math.PI * 2;
      p.swaySpeed = 0.5 + Math.random() * 0.9;
      p.swayAmp = 8 + Math.random() * 16;
      p.flip = Math.random() * Math.PI * 2;
      p.flipSpeed = 0.6 + Math.random() * 1.3;
      p.shade = (Math.random() * sprites.length) | 0;
    };

    const step = (dt: number) => {
      clock += dt;
      if (clock >= nextGust) {
        gustTarget = -(45 + Math.random() * 75);
        gustEnd = clock + 0.45 + Math.random() * 0.5;
        nextGust = clock + 3 + Math.random() * 5;
      }
      if (clock >= gustEnd) gustTarget = 0;
      gust += (gustTarget - gust) * Math.min(1, dt * 5);

      const breeze = -6 + Math.sin(clock * 0.4) * 3;
      const boost = Math.min(Math.abs(gust) / 90, 1) * 0.9;

      for (const p of petals) {
        p.age += dt;
        p.sway += p.swaySpeed * dt;
        p.flip += p.flipSpeed * dt * (1 + boost);
        p.rot += p.spin * dt * (1 + boost);
        const swayX = Math.sin(p.sway) * p.swayAmp;
        const wind = p.vx + breeze + gust * (0.4 + 0.8 * p.depth);
        p.x += (wind * drift + swayX) * dt;
        p.y += (p.vy + Math.cos(p.sway * 0.7) * 4) * dt;

        if (p.y > height + SPRITE || p.x < -SPRITE) seed(p, true);
        if (p.x > width + SPRITE * 2) p.x = width + SPRITE * 2;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      drift = Math.min(1, Math.max(0.4, width / height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (tree) {
        // The canopy fills roughly the top half of the cutout.
        const box = tree.getBoundingClientRect();
        crown.x = box.left - rect.left + box.width * 0.08;
        crown.y = box.top - rect.top + box.height * 0.08;
        crown.w = box.width * 0.88;
        crown.h = box.height * 0.47;
      } else {
        crown.x = width * 0.55;
        crown.y = 0;
        crown.w = width * 0.45;
        crown.h = height * 0.3;
      }

      // 16 to 46 petals, scaled by the slide's area.
      const wanted = Math.round(Math.min(Math.max((width * height) / 20000, 16), 46));
      petals = Array.from({ length: wanted }, () => {
        const p = {} as Petal;
        seed(p, false);
        return p;
      });
      for (let t = 0; t < WARM_UP; t += 1 / 30) step(1 / 30);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // Scaling the width by cos(flip) fakes the petal turning in 3D.
        ctx.scale(Math.cos(p.flip), 1);
        ctx.globalAlpha =
          (0.72 + 0.28 * Math.abs(Math.cos(p.flip))) * Math.min(1, p.age / FADE_IN);
        ctx.drawImage(sprites[p.shade], -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    };

    resize();

    if (reducedMotion) {
      // A still frame of the drift, redrawn only when the box changes size.
      draw();
      const observer = new ResizeObserver(() => {
        resize();
        draw();
      });
      observer.observe(canvas);
      return () => observer.disconnect();
    }

    let frame = 0;
    let last = performance.now();
    let onScreen = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        // Resync the clock so a return to view never jumps the whole field.
        last = performance.now();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      if (onScreen && !document.hidden) {
        step(dt);
        draw();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
    };
  }, [reducedMotion, source]);

  return <canvas ref={canvasRef} className="petal-field" aria-hidden="true" />;
}
