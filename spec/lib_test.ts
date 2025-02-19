import {intersects, AABB} from '../lib.js';

function aabbToString([l, t, r, b]: AABB): string {
  return `{l: ${l}, t: ${t}, r: ${r}, b: ${b}}`;
}

describe('intersects', () => {
  const tests: Array<[AABB, AABB, boolean]> = [
    [[5, 5, 10, 10], [2, 2, 7, 7], true], // on the left/top
    [[2, 2, 7, 7], [5, 5, 10, 10], true], // on the right/bottom
    [[5, 5, 10, 10], [0, 0, 15, 15], true], // superset
    [[5, 5, 10, 10], [7, 7, 9, 9], true], // inset
    [[5, 5, 10, 10], [0, 2, 1, 7], false], // x misses left
    [[5, 5, 10, 10], [15, 2, 16, 7], false], // x misses right
    [[5, 5, 10, 10], [2, 0, 7, 1], false], // y misses above
    [[5, 5, 10, 10], [2, 15, 7, 16], false], // y misses below
    [[5, 5, 10, 10], [2, 2, 4, 4], false], // complete miss above/left
    [[5, 5, 10, 10], [22, 22, 24, 24], false], // complete miss below/right
  ];
  for (const [a, b, expected] of tests) {
    it(`${aabbToString(a)} and ${aabbToString(b)} should ${expected ? 'not ' : ''}intersect`, () => {
      expect(intersects(a, b)).toBe(expected);
    });
  }
});