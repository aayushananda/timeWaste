'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Mesh } from 'three';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { createQuestionMarkGeometry, MARK_RADIUS } from './questionMarkGeometry';

/** Rule 1: a push glides out instead of stopping dead. */
const CRUISE_TAU = 2.5;
const WANDER_SPEED = 0.38;
const WANDER_EVERY = [3.5, 8] as const;

/** Rule 2: a slow hover nudges, a fast swipe scatters. */
const CURSOR_RADIUS = 1.6;
const CURSOR_FORCE = 7;
const CURSOR_SPIN = 2.4;

/** Rule 3: an ellipse around the lockup, so marks circle it. */
const LOGO_PADDING = 1.32;
const LOGO_FORCE = 5.5;

/** Rule 4: soft springs at the edges, elastic bounces between marks. */
const EDGE_FORCE = 9;
const RESTITUTION = 0.72;
const SPIN_DAMPING = 0.8;

const ENTRANCE_STAGGER = 0.09;
const ENTRANCE_FALL = -2.8;

type Mark = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  wx: number;
  wy: number;
  nextWander: number;
  rot: number;
  spin: number;
  tiltX: number;
  tiltY: number;
  scale: number;
  delay: number;
  released: boolean;
  /** Falling in; drift rules are held off until the mark reaches the frame. */
  entering: boolean;
  /** Where this mark's rain ends, so the field fills instead of piling up top. */
  settleY: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

type Props = {
  boxRef: RefObject<HTMLElement | null>;
  logoRef: RefObject<HTMLElement | null>;
};

export function QuestionField({ boxRef, logoRef }: Props) {
  const { introDone, reducedMotion, pointer } = useExperience();
  const { viewport, size } = useThree();

  const count = size.width < 640 ? 6 : 9;

  const geometry = useMemo(() => createQuestionMarkGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const meshes = useRef<(Mesh | null)[]>([]);
  const settled = useRef(false);

  // Cached so the frame loop never reads layout.
  const box = useRef({ top: 0, left: 0, width: 1, height: 1 });
  const logoAxes = useRef({ ax: 0.9, ay: 1.2 });

  const marks = useMemo<Mark[]>(() => {
    const halfW = viewport.width / 2;
    return Array.from({ length: count }, (_, i) => ({
      // Parked above the frame until the intro hands off.
      x: ((i + 0.5) / count - 0.5) * halfW * 1.75 + rand(-0.4, 0.4),
      y: viewport.height / 2 + rand(0.8, 3.4),
      z: rand(-0.6, 0.6),
      vx: rand(-0.25, 0.25),
      vy: ENTRANCE_FALL,
      wx: rand(-WANDER_SPEED, WANDER_SPEED),
      wy: rand(-WANDER_SPEED, WANDER_SPEED),
      nextWander: rand(...WANDER_EVERY),
      rot: rand(-0.5, 0.5),
      spin: rand(-0.8, 0.8),
      tiltX: rand(-0.3, 0.3),
      tiltY: rand(-0.5, 0.5),
      scale: rand(0.3, 0.52),
      delay: i * ENTRANCE_STAGGER + rand(0, 0.1),
      released: false,
      entering: true,
      settleY: (0.5 - (i % 3) / 2.2) * viewport.height * 0.62 + rand(-0.5, 0.5),
    }));
    // Re-seeded when the mark count changes (crossing the 640px breakpoint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Measure the hero box and the lockup inside it: the box maps CSS pixels to
  // world units for the pointer, the lockup sets the exclusion ellipse.
  useEffect(() => {
    const measure = () => {
      const node = boxRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      box.current = {
        top: rect.top,
        left: rect.left,
        width: rect.width || 1,
        height: rect.height || 1,
      };

      const logo = logoRef.current?.getBoundingClientRect();
      if (logo && rect.width && rect.height) {
        logoAxes.current = {
          ax: (logo.width / rect.width) * viewport.width * 0.5 * LOGO_PADDING,
          ay: (logo.height / rect.height) * viewport.height * 0.5 * LOGO_PADDING,
        };
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (boxRef.current) observer.observe(boxRef.current);
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [boxRef, logoRef, viewport.width, viewport.height]);

  useFrame((_, delta) => {
    // Reduced motion: one still frame, no drift, no pointer response.
    if (reducedMotion) {
      if (settled.current) return;
      const halfW = viewport.width / 2;
      const halfH = viewport.height / 2;
      marks.forEach((mark, i) => {
        const angle = (i / marks.length) * Math.PI * 2 + 0.4;
        mark.x = Math.cos(angle) * halfW * 0.72;
        mark.y = Math.sin(angle) * halfH * 0.66;
        const mesh = meshes.current[i];
        mesh?.position.set(mark.x, mark.y, mark.z);
        mesh?.rotation.set(mark.tiltX, mark.tiltY, mark.rot);
        mesh?.scale.setScalar(mark.scale);
      });
      settled.current = true;
      return;
    }

    if (!introDone) return;

    const dt = Math.min(delta, 1 / 30);
    const halfH = viewport.height / 2;
    const { ax, ay } = logoAxes.current;

    const p = pointer.current;
    const rect = box.current;
    // Pointer into the field's own world coordinates.
    const px = ((p.x - rect.left) / rect.width - 0.5) * viewport.width;
    const py = -((p.y - rect.top) / rect.height - 0.5) * viewport.height;
    const pointerLive = p.active && p.x >= rect.left && p.x <= rect.left + rect.width;

    for (const mark of marks) {
      if (!mark.released) {
        mark.delay -= dt;
        if (mark.delay > 0) continue;
        mark.released = true;
      }

      if (mark.entering) {
        // Rain in, then hand over to drift at the top of the frame.
        mark.y += mark.vy * dt;
        mark.x += mark.vx * dt;
        mark.rot += mark.spin * dt;
        if (mark.y <= mark.settleY) {
          mark.entering = false;
          mark.vy = -0.3;
        }
        continue;
      }

      // 1 — Cruise toward this mark's own slow wander velocity.
      mark.nextWander -= dt;
      if (mark.nextWander <= 0) {
        mark.wx = rand(-WANDER_SPEED, WANDER_SPEED);
        mark.wy = rand(-WANDER_SPEED, WANDER_SPEED);
        mark.nextWander = rand(...WANDER_EVERY);
      }
      const ease = 1 - Math.exp(-dt / CRUISE_TAU);
      mark.vx += (mark.wx - mark.vx) * ease;
      mark.vy += (mark.wy - mark.vy) * ease;

      // 2 — Cursor pushes marks away, scaled by pointer speed, plus spin.
      if (pointerLive) {
        const dx = mark.x - px;
        const dy = mark.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < CURSOR_RADIUS && dist > 1e-3) {
          const falloff = (1 - dist / CURSOR_RADIUS) ** 2;
          const power = (1 + Math.min(p.speed / 700, 5)) * falloff * CURSOR_FORCE * dt;
          mark.vx += (dx / dist) * power;
          mark.vy += (dy / dist) * power;
          mark.spin += (dx / dist) * power * CURSOR_SPIN;
        }
      }

      // 3 — Logo exclusion: push outward so marks circle the lockup.
      const inside = (mark.x / ax) ** 2 + (mark.y / ay) ** 2;
      if (inside < 1 && ax > 0 && ay > 0) {
        const gx = mark.x / (ax * ax);
        const gy = mark.y / (ay * ay);
        const len = Math.hypot(gx, gy) || 1;
        const power = (1 - inside) * LOGO_FORCE * dt;
        mark.vx += (gx / len) * power;
        mark.vy += (gy / len) * power;
      }

      // 4a — Soft springs at the frame edges, inset by the mark's own size.
      const inset = MARK_RADIUS * mark.scale;
      const limX = viewport.width / 2 - inset;
      const limY = viewport.height / 2 - inset;
      if (mark.x > limX) mark.vx -= (mark.x - limX) * EDGE_FORCE * dt;
      if (mark.x < -limX) mark.vx += (-limX - mark.x) * EDGE_FORCE * dt;
      if (mark.y > limY) mark.vy -= (mark.y - limY) * EDGE_FORCE * dt;
      if (mark.y < -limY) mark.vy += (-limY - mark.y) * EDGE_FORCE * dt;

      mark.x += mark.vx * dt;
      mark.y += mark.vy * dt;
      mark.rot += mark.spin * dt;
      mark.spin *= 1 - SPIN_DAMPING * dt;
    }

    // 4b — Elastic bounces between marks.
    for (let i = 0; i < marks.length; i++) {
      const a = marks[i];
      if (!a.released || a.entering) continue;
      for (let j = i + 1; j < marks.length; j++) {
        const b = marks[j];
        if (!b.released || b.entering) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const min = MARK_RADIUS * (a.scale + b.scale);
        if (dist >= min || dist < 1e-4) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (min - dist) / 2;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (closing < 0) {
          const impulse = closing * RESTITUTION;
          a.vx += nx * impulse;
          a.vy += ny * impulse;
          b.vx -= nx * impulse;
          b.vy -= ny * impulse;
          a.spin -= impulse * 0.6;
          b.spin += impulse * 0.6;
        }
      }
    }

    marks.forEach((mark, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      mesh.position.set(mark.x, mark.y, mark.z);
      mesh.rotation.set(mark.tiltX, mark.tiltY, mark.rot);
      mesh.scale.setScalar(mark.scale);
    });
  });

  return (
    <>
      {/* Procedural environment: the gloss comes from lightformers, not a
          downloaded HDR, so the 3D chunk stays inside its budget. */}
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2.6} position={[0, 3, 2]} scale={[8, 3, 1]} />
        <Lightformer
          form="circle"
          intensity={3.2}
          color="#ffbde3"
          position={[-4, -1, 1]}
          scale={[5, 5, 1]}
        />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 4, 5]} intensity={1.1} />

      {marks.map((mark, i) => (
        <mesh
          key={i}
          ref={(node) => {
            meshes.current[i] = node;
          }}
          geometry={geometry}
          position={[mark.x, mark.y, mark.z]}
          scale={mark.scale}
        >
          <meshPhysicalMaterial
            color="#0b0b0b"
            roughness={0.18}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.06}
            reflectivity={0.6}
          />
        </mesh>
      ))}
    </>
  );
}
