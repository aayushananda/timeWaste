import { CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** The glyph's centreline, traced from the question marks in the intro video.
 *  Procedural geometry costs a few hundred bytes of code instead of a 300 KB
 *  to 2 MB GLB, and the stroke weight can be tuned to match the wordmark. */
const SPINE: [number, number][] = [
  [-0.4, 0.34],
  [-0.46, 0.58],
  [-0.3, 0.82],
  [0.0, 0.9],
  [0.3, 0.82],
  [0.45, 0.58],
  [0.38, 0.33],
  [0.2, 0.16],
  [0.04, 0.0],
  [0.0, -0.16],
  [0.0, -0.34],
];

const STROKE = 0.115;
const DOT = new Vector3(0, -0.72, 0);
const DOT_RADIUS = 0.145;

/** Bounding radius, at scale 1, for bounces and for holding marks inside the
 *  frame. A touch under the glyph's full half-height: these are thin strokes,
 *  not discs, so slight visual overlap reads better than bouncing off air. */
export const MARK_RADIUS = 0.95;

export function createQuestionMarkGeometry() {
  const curve = new CatmullRomCurve3(
    SPINE.map(([x, y]) => new Vector3(x, y, 0)),
    false,
    'catmullrom',
    0.5,
  );

  const parts = [
    new TubeGeometry(curve, 56, STROKE, 10, false),
    // Rounded stroke ends, the logo's cap style.
    new SphereGeometry(STROKE, 10, 8).translate(...curve.getPoint(0).toArray()),
    new SphereGeometry(STROKE, 10, 8).translate(...curve.getPoint(1).toArray()),
    new SphereGeometry(DOT_RADIUS, 14, 10).translate(DOT.x, DOT.y, DOT.z),
  ];

  // One geometry means one draw call per mark.
  const merged = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());

  if (!merged) throw new Error('Failed to merge question-mark geometry');
  // The glyph reaches further above its spine than below it, so centre it:
  // position then means the visual centre, and bounds and bounces stay
  // symmetric without a per-axis offset.
  merged.center();
  merged.computeBoundingSphere();
  return merged;
}
