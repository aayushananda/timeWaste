'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { ThemeName } from '@/lib/site';

export type PointerState = {
  /** Viewport pixels. */
  x: number;
  y: number;
  /** Normalised to -1..1, origin at centre: what the 3D field wants. */
  nx: number;
  ny: number;
  /** Pixels per second. */
  vx: number;
  vy: number;
  speed: number;
  active: boolean;
  /** True over a link or button, so the cursor can grow and slow. */
  overTarget: boolean;
};

type Experience = {
  introDone: boolean;
  finishIntro: () => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  reducedMotion: boolean;
  /** Mutable, read inside frame loops. Never triggers a render. */
  pointer: RefObject<PointerState>;
};

const ExperienceContext = createContext<Experience | null>(null);

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return value;
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);
  const [theme, setTheme] = useState<ThemeName>('blush');
  const [reducedMotion, setReducedMotion] = useState(false);

  const pointer = useRef<PointerState>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    active: false,
    overTarget: false,
  });

  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();

    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 1 / 240);
      lastTime = now;

      const state = pointer.current;
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;

      state.vx = state.active ? dx / dt : 0;
      state.vy = state.active ? dy / dt : 0;
      state.speed = Math.hypot(state.vx, state.vy);
      state.x = event.clientX;
      state.y = event.clientY;
      state.nx = (event.clientX / window.innerWidth) * 2 - 1;
      state.ny = -((event.clientY / window.innerHeight) * 2 - 1);
      state.active = true;

      const target = event.target;
      state.overTarget =
        target instanceof Element && !!target.closest('a, button, [role="button"], summary');
    };

    const onLeave = () => {
      pointer.current.active = false;
      pointer.current.speed = 0;
      pointer.current.vx = 0;
      pointer.current.vy = 0;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  const value = useMemo<Experience>(
    () => ({ introDone, finishIntro, theme, setTheme, reducedMotion, pointer }),
    [introDone, finishIntro, theme, reducedMotion],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}
