'use client';

import { View } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';

// Imported for the side effect, and from here because fiber constructs the
// deprecated Clock when this Canvas creates its store, well after module load.
import './silenceDeprecations';

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** One WebGL context for the whole site. A fixed canvas sits behind the page
 *  and drei's View draws into each 3D section's box, so adding a second 3D
 *  section costs a <View>, not another context. */
export function SceneCanvas() {
  const [source, setSource] = useState<HTMLElement | null>(null);
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');

  useEffect(() => {
    // Without WebGL the canvas never mounts and every section still works.
    if (hasWebGL()) setSource(document.body);
  }, []);

  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!source) return null;

  return (
    <Canvas
      className="scene-canvas"
      eventSource={source}
      eventPrefix="client"
      frameloop={frameloop}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <View.Port />
    </Canvas>
  );
}
