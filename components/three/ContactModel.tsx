'use client';

import { Environment, Lightformer, PerspectiveCamera, useGLTF, View } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
  Box3,
  CanvasTexture,
  MathUtils,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Mesh,
} from 'three';
import { useExperience } from '@/components/providers/ExperienceProvider';
import { contactModel } from '@/lib/site';

/** The skin's material in the source file. It is self-lit: the same texture
 *  drives both base color and emissive, so both are lifted together. */
const SKIN_MATERIAL = 'VRayAlSurface1SG';
/** Linear-light multiplier on the skin; 1 is the artist's original tone. */
const SKIN_LIFT = 1.5;
/** Unlike the kid, the bean bag has no glow of its own, so under the same
 *  lights it reads grey. Some of its texture as emissive brings it up to the
 *  soft white of the reference render without brightening the kid. */
const BAG_MATERIAL = 'VRayMtl8SG';
const BAG_GLOW = 0.8;

/** The pointer turns the chair a little, never far enough to lose the face. */
const SWAY_YAW = 0.32;
const SWAY_PITCH = 0.06;
const SWAY_TAU = 0.9;
const FLOAT_HEIGHT = 0.018;
const FLOAT_SPEED = 0.7;

/** Camera framing, matched to the reference render: front on, a little above. */
const CAMERA_FOV = 28;
const CAMERA_ELEVATION = 0.3;
const CAMERA_DISTANCE = 2.75;
const LOOK_AT_Y = 0.43;
/** Half the width, in bag widths, that must stay in frame: bag plus shadow. */
const FIT_HALF_WIDTH = 0.85;

/** A soft radial blob, cast back and to the right as in the reference. */
function useShadowTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.45, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Daydreamer() {
  const { reducedMotion, pointer } = useExperience();
  // Meshopt, not Draco: its decoder is bundled, Draco's comes from a CDN.
  const { scene } = useGLTF(contactModel.src, false, true);
  const swayRef = useRef<Group>(null);
  const shadow = useShadowTexture();

  // Normalise the file's centimetre-scale units: one unit wide, sitting on
  // y = 0, centred on the bean bag.
  const fit = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const scale = 1 / size.x;
    const center = box.getCenter(new Vector3());
    const position: [number, number, number] = [
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    ];
    return { scale, position };
  }, [scene]);

  useEffect(() => {
    scene.traverse((node) => {
      const { material } = node as Mesh;
      if (!(material instanceof MeshStandardMaterial)) return;
      // The textures are painted, not photographed: filmic tone mapping
      // muddies the browns into maroon, so they are shown as authored.
      material.toneMapped = false;
      // Cached by useGLTF, so guard against adjusting twice on remount.
      if (material.userData.adjusted) return;
      material.userData.adjusted = true;
      if (material.name === SKIN_MATERIAL) {
        material.color.multiplyScalar(SKIN_LIFT);
        material.emissiveIntensity *= SKIN_LIFT;
      } else if (material.name === BAG_MATERIAL) {
        material.emissive.set('#ffffff');
        material.emissiveMap = material.map;
        material.emissiveIntensity = BAG_GLOW;
        material.needsUpdate = true;
      }
    });
  }, [scene]);

  useFrame(({ clock }, delta) => {
    const group = swayRef.current;
    if (!group) return;
    if (reducedMotion) {
      group.rotation.set(0, 0, 0);
      group.position.y = 0;
      return;
    }

    const p = pointer.current;
    const ease = 1 - Math.exp(-Math.min(delta, 1 / 30) / SWAY_TAU);
    const targetYaw = p.active ? p.nx * SWAY_YAW : 0;
    const targetPitch = p.active ? -p.ny * SWAY_PITCH : 0;
    group.rotation.y += (targetYaw - group.rotation.y) * ease;
    group.rotation.x += (targetPitch - group.rotation.x) * ease;
    group.position.y = (Math.sin(clock.elapsedTime * FLOAT_SPEED) * 0.5 + 0.5) * FLOAT_HEIGHT;
  });

  return (
    <group ref={swayRef}>
      <primitive object={scene} scale={fit.scale} position={fit.position} />
      <mesh position={[0.16, 0.002, -0.12]} rotation={[-Math.PI / 2, 0, -0.3]} scale={[1.4, 1, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          map={shadow}
          color="#2b1630"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Backs off in a narrow box so the bag and its shadow never meet the edge,
 *  where the View's scissor would cut them off in a hard line. */
function Rig() {
  const size = useThree((state) => state.size);
  const aspect = size.width / Math.max(size.height, 1);
  const halfFov = MathUtils.degToRad(CAMERA_FOV / 2);
  const distance = Math.max(CAMERA_DISTANCE, FIT_HALF_WIDTH / (Math.tan(halfFov) * aspect));
  const position: [number, number, number] = [
    0,
    LOOK_AT_Y + Math.sin(CAMERA_ELEVATION) * distance,
    Math.cos(CAMERA_ELEVATION) * distance,
  ];

  return (
    <PerspectiveCamera
      makeDefault
      fov={CAMERA_FOV}
      position={position}
      near={0.1}
      far={20}
      onUpdate={(self) => self.lookAt(0, LOOK_AT_Y, 0)}
    />
  );
}

/** The kid on the bean bag, drawn into the contact section's box on the
 *  shared canvas. The View is the box itself; see HeroField. */
export function ContactModel() {
  return (
    <View className="contact-model-view">
      <Rig />

      {/* Warm key from the front left, as in the reference; the lightformers
          give the mug's glaze something to reflect without an HDR download. */}
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={1.6} position={[0, 3, 2]} scale={[8, 3, 1]} />
        <Lightformer form="circle" intensity={1.2} color="#fff1e8" position={[4, 0, 1]} scale={[5, 5, 1]} />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-2.5, 4, 3]} intensity={1.1} color="#fff4ec" />

      <Suspense fallback={null}>
        <Daydreamer />
      </Suspense>
    </View>
  );
}
