export type HasX = { x: number };
export type HasY = { y: number };
export type HasZ = { z: number };
export type HasXY = HasX & HasY;
export type HasYZ = HasY & HasZ;

export interface SkiierImpact {
  jump?: boolean;
  crash?: boolean;
  minSpeed?: number; // 0-1 of skiier max speed
  maxSpeed?: number; // 0-1 of skiier max speed
}

export function randomInt(lowInclusive: number, highExclusive: number): number {
  return Math.floor(Math.random() * (highExclusive - lowInclusive)) + lowInclusive;
}

export function nthItem<T>(iterable: Iterable<T>, index: number): T | undefined {
  let i = 0;
  for (const item of iterable) {
    if (i++ === index) return item;
  }
  return undefined;
}


export function getDistance({x: x1, y: y1}: HasXY, {x: x2, y: y2}: HasXY) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getY(item: HasY): number {
  return item.y;
}

export function getZ(item: HasZ): number {
  return item.z;
}

// memoize a function with 1 param
export function memoize<P, R>(fn: (p: P) => R): (p: P) => R {
  const cache = new Map<P, R>();
  return (p: P): R => {
    if (cache.has(p)) return cache.get(p)!;
    const r: R = fn(p);
    cache.set(p, r);
    return r;
  };
}

export function clamp(min: number, val: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

// Gets the next step of easing from the `current` to the `target` with the given
// `strength`, snapping to `target` when the diff is less than `epsilon`.
// `strength` is a number between 0 and 1.
export function easeTo(current: number, target: number, strength: number, epsilon: number): number {
  const diff = target - current;
  if (Math.abs(diff) < epsilon) return target;
  return current + diff * strength;
}

// Axis-aligned bounding box
export type AABB = [x1: number, y1: number, x2: number, y2: number];

export function intersects(
  [aLeft, aTop, aRight, aBottom]: AABB,
  [bLeft, bTop, bRight, bBottom]: AABB): boolean {
  return aRight > bLeft && aLeft < bRight && aBottom > bTop && aTop < bBottom;
}

/**
 * Calculates the angle (in radians) of the line segment connecting two points
 * with respect to the positive x-axis.
 * The angle is measured counter-clockwise from the positive x-axis.
 *
 * @param {object} p1 - The first point, with x and y properties (e.g., {x: 1, y: 2}).
 * @param {object} p2 - The second point, with x and y properties (e.g., {x: 4, y: 6}).
 * @returns {number} The angle in radians, ranging from -PI to PI.
 */
export function getAngleBetweenPoints(p1: HasXY, p2: HasXY) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Math.atan2(dy, dx) correctly handles all four quadrants.
  return Math.atan2(dy, dx);
}
