'use client';

import dynamic from 'next/dynamic';

/** three.js downloads while the intro plays, never blocking first paint. */
const SceneCanvas = dynamic(() => import('./SceneCanvas').then((m) => m.SceneCanvas), {
  ssr: false,
});

export function Scene() {
  return <SceneCanvas />;
}
