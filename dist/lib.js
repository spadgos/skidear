export function randomInt(lowInclusive, highExclusive) {
    return Math.floor(Math.random() * (highExclusive - lowInclusive)) + lowInclusive;
}
export function nthItem(iterable, index) {
    let i = 0;
    for (const item of iterable) {
        if (i++ === index)
            return item;
    }
    return undefined;
}
export function getDistance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
export function getY(item) {
    return item.y;
}
export function getZ(item) {
    return item.z;
}
// memoize a function with 1 param
export function memoize(fn) {
    const cache = new Map();
    return (p) => {
        if (cache.has(p))
            return cache.get(p);
        const r = fn(p);
        cache.set(p, r);
        return r;
    };
}
export function clamp(min, val, max) {
    return Math.min(max, Math.max(min, val));
}
// Gets the next step of easing from the `current` to the `target` with the given
// `strength`, snapping to `target` when the diff is less than `epsilon`.
// `strength` is a number between 0 and 1.
export function easeTo(current, target, strength, epsilon) {
    const diff = target - current;
    if (Math.abs(diff) < epsilon)
        return target;
    return current + diff * strength;
}
export function intersects([aLeft, aTop, aRight, aBottom], [bLeft, bTop, bRight, bBottom]) {
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
export function getAngleBetweenPoints(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    // Math.atan2(dy, dx) correctly handles all four quadrants.
    return Math.atan2(dy, dx);
}
//# sourceMappingURL=lib.js.map