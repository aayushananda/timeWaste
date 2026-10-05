'use client';

import { useEffect, useRef } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

const SPRITE = 48;
const GUST_RADIUS = 160;

type Petal = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  rot: number;
  spin: number;
  sway: number;
  swaySpeed: number;
  flip: number;
  flipSpeed: number;
};

/** One pre-rendered petal, reused for every instance. */
function makeSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE;
  canvas.height = SPRITE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.translate(SPRITE / 2, SPRITE / 2);
  ctx.beginPath();
  ctx.moveTo(0, -SPRITE * 0.4);
  ctx.bezierCurveTo(SPRITE * 0.34, -SPRITE * 0.26, SPRITE * 0.3, SPRITE * 0.24, 0, SPRITE * 0.4);
  ctx.bezierCurveTo(-SPRITE * 0.3, SPRITE * 0.24, -SPRITE * 0.34, -SPRITE * 0.26, 0, -SPRITE * 0.4);
  ctx.fillStyle = '#ffd9ec';
  ctx.fill();
  // A faint centre line so the petal reads as a petal when it turns.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -SPRITE * 0.34);
  ctx.lineTo(0, SPRITE * 0.34);
  ctx.stroke();

  return canvas;
}

export function Sakura() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pointer, reducedMotion } = useExperience();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const sprite = makeSprite();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let petals: Petal[] = [];

    const seed = (petal: Petal, top: boolean) => {
      petal.x = Math.random() * width;
      petal.y = top ? -SPRITE : Math.random() * height;
      petal.size = 10 + Math.random() * 16;
      petal.vy = 14 + Math.random() * 30;
      petal.vx = (Math.random() - 0.5) * 10;
      petal.rot = Math.random() * Math.PI * 2;
      petal.spin = (Math.random() - 0.5) * 1.2;
      petal.sway = Math.random() * Math.PI * 2;
      petal.swaySpeed = 0.5 + Math.random();
      petal.flip = Math.random() * Math.PI * 2;
      petal.flipSpeed = 0.8 + Math.random() * 1.4;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 18 to 70 petals, scaled by the slide's area.
      const wanted = Math.round(
        Math.min(Math.max((width * height) / 18000, 18), 70),
      );
      petals = Array.from({ length: wanted }, () => {
        const petal = {} as Petal;
        seed(petal, false);
        return petal;
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const petal of petals) {
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rot);
        // Scaling the width fakes a turn in 3D.
        ctx.scale(Math.cos(petal.flip), 1);
        ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.cos(petal.flip));
        ctx.drawImage(sprite, -petal.size / 2, -petal.size / 2, petal.size, petal.size);
        ctx.restore();
      }
    };

    resize();

    if (reducedMotion) {
      // A still scatter.
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
        const rect = canvas.getBoundingClientRect();
        const p = pointer.current;
        const mx = p.x - rect.left;
        const my = p.y - rect.top;

        for (const petal of petals) {
          petal.sway += petal.swaySpeed * dt;
          petal.flip += petal.flipSpeed * dt;
          petal.rot += petal.spin * dt;
          petal.x += (petal.vx + Math.sin(petal.sway) * 18) * dt;
          petal.y += petal.vy * dt;

          // Moving the cursor through them makes a small gust.
          if (p.active) {
            const dx = petal.x - mx;
            const dy = petal.y - my;
            const dist = Math.hypot(dx, dy);
            if (dist < GUST_RADIUS && dist > 1) {
              const push = (1 - dist / GUST_RADIUS) ** 2 * Math.min(p.speed / 40, 90);
              petal.x += (dx / dist) * push * dt;
              petal.y += (dy / dist) * push * dt;
              petal.spin += (dx / dist) * dt;
            }
          }

          if (petal.y > height + SPRITE) seed(petal, true);
          if (petal.x < -SPRITE) petal.x = width + SPRITE;
          if (petal.x > width + SPRITE) petal.x = -SPRITE;
        }

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
  }, [pointer, reducedMotion]);

  return <canvas ref={canvasRef} className="sakura" aria-hidden="true" />;
}
