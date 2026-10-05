'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';

/** three.js is fetched as soon as the page hydrates, in parallel with the
 *  intro video, so it never blocks the logo's first paint. */
const HeroField = dynamic(() => import('@/components/three/HeroField').then((m) => m.HeroField), {
  ssr: false,
});

export function HeroStage() {
  const logoRef = useRef<HTMLElement | null>(null);

  // The lockup is server-rendered by the Hero, so it is found by id rather
  // than threaded through as a ref.
  useEffect(() => {
    logoRef.current = document.getElementById('hero-logo');
  }, []);

  return <HeroField logoRef={logoRef} />;
}
