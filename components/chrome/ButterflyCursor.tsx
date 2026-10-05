'use client';

import { useEffect, useRef, useState } from 'react';
import { useExperience } from '@/components/providers/ExperienceProvider';

const BASE_SIZE = 38;
const TARGET_SIZE = 56;

export function ButterflyCursor() {
  const { pointer, reducedMotion } = useExperience();
  const wrapRef = useRef<HTMLDivElement>(null);
  const wingRef = useRef<HTMLImageElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Pointer devices only; touch never sees it, and high contrast keeps the
    // real cursor so the pointer is never invisible.
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const forced = window.matchMedia('(forced-colors: active)');

    const update = () => setEnabled(query.matches && !forced.matches);
    update();
    query.addEventListener('change', update);
    forced.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
      forced.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    document.body.dataset.butterfly = enabled ? 'on' : 'off';
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const wrap = wrapRef.current;
    const wing = wingRef.current;
    if (!wrap || !wing) return;

    let frame = 0;
    let phase = 0;
    let size = BASE_SIZE;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const p = pointer.current;

      // Grows and slows over anything clickable.
      const wanted = p.overTarget ? TARGET_SIZE : BASE_SIZE;
      size += (wanted - size) * Math.min(dt * 12, 1);
      wrap.style.width = `${size}px`;
      wrap.style.height = `${size}px`;

      wrap.style.opacity = p.active ? '1' : '0';
      // Centred here rather than with a margin, because the size changes.
      wrap.style.transform = `translate3d(${p.x - size / 2}px, ${p.y - size / 2}px, 0)`;

      if (reducedMotion) {
        wing.style.transform = 'none';
      } else {
        // Flap speed rises with pointer speed; a slow hover barely moves.
        const rate = (p.overTarget ? 2.2 : 5) + Math.min(p.speed / 260, 9);
        phase += dt * rate;
        // Scaling width fakes the wings turning in 3D.
        wing.style.transform = `scaleX(${0.32 + 0.68 * Math.abs(Math.cos(phase))})`;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, pointer, reducedMotion]);

  if (!enabled) return null;

  return (
    <div ref={wrapRef} className="cursor" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={wingRef} className="cursor-wing" src="/cursor/butterfly.svg" alt="" />
    </div>
  );
}
