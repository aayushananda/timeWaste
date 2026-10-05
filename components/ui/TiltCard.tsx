'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const MAX_TILT = 8;

/** Leans toward the pointer by driving CSS variables, so `@media (hover: hover)`
 *  and reduced motion can switch the effect off entirely in CSS. */
export function TiltCard({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      node.style.setProperty('--tilt-y', `${nx * MAX_TILT * 2}deg`);
      node.style.setProperty('--tilt-x', `${-ny * MAX_TILT * 2}deg`);
    };

    const onLeave = () => {
      node.style.setProperty('--tilt-y', '0deg');
      node.style.setProperty('--tilt-x', '0deg');
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className} data-tilt="">
      {children}
    </div>
  );
}
