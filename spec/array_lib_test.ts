import { indexOfSorted, insertSortedBy, removeFromSortedArray, sortByYZ } from '../array_lib.js';
import { HasYZ } from '../lib.js';

function charCode(x: string): number {
  return x.charCodeAt(0);
}

describe('indexOfSorted', () => {
  describe('when there are unique matching elements', () => {
    it('finds the index', () => {
      const arr = ['a', 'b', 'c', 'd', 'e', 'f'];

      expect(indexOfSorted(arr, 'b', charCode)).toBe(1);
      expect(indexOfSorted(arr, 'e', charCode)).toBe(4);
    });
  })

  describe('when the element is not in the array', () => {
    it('returns -1', () => {
      const arr = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(indexOfSorted(arr, 'x', charCode)).toBe(-1);
    });

    it('returns -1 when the order matches but the item is different', () => {
      const arr = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(indexOfSorted(arr, 'bb', charCode)).toBe(-1);
    });
  });

  describe('when there are multiple items at the same order', () => {
    it('returns the index of the matching one', () => {
      const arr = ['apple', 'avocado', 'arancia', 'banana', 'beetroot', 'betelnut'];
      expect(indexOfSorted(arr, 'apple', charCode)).toBe(0);
      expect(indexOfSorted(arr, 'avocado', charCode)).toBe(1);
      expect(indexOfSorted(arr, 'arancia', charCode)).toBe(2);
      expect(indexOfSorted(arr, 'armadillos', charCode)).toBe(-1);
    });
  });
});

describe('insertSortedBy', () => {
  it('mutates the input array and returns it', () => {
    const arr = ['a', 'c', 'e', 'g', 'i'];
    const res = insertSortedBy(arr, 'b', charCode);
    expect(res).toBe(arr);
  })

  it('adds items in the position defined by the order function at the start', () => {
    const arr = ['b', 'd', 'f', 'h', 'j'];
    insertSortedBy(arr, 'a', charCode);
    expect(arr).toEqual(['a', 'b', 'd', 'f', 'h', 'j']);
  });

  it('adds items in the position defined by the order function at the end', () => {
    const arr = ['b', 'd', 'f', 'h', 'j'];
    insertSortedBy(arr, 'k', charCode);
    expect(arr).toEqual(['b', 'd', 'f', 'h', 'j', 'k']);
  });

  it('adds items in the position defined by the order function in the middle', () => {
    const arr = ['b', 'd', 'f', 'h', 'j'];
    insertSortedBy(arr, 'e', charCode);
    expect(arr).toEqual(['b', 'd', 'e', 'f', 'h', 'j']);
  });

  it('inserts into an empty array', () => {
    const arr: string[] = [];
    insertSortedBy(arr, 'a', charCode);
    expect(arr).toEqual(['a']);
  });
});

describe('removeFromSortedArray', () => {
  it('mutates the input array and returns it', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const res = removeFromSortedArray(arr, 'b', charCode);
    expect(arr).toBe(res);
  });

  it('removes items from the start', () => {
    const arr = ['a', 'b', 'c', 'd'];
    removeFromSortedArray(arr, 'a', charCode);
    expect(arr).toEqual(['b', 'c', 'd']);
  });

  it('removes items from the end', () => {
    const arr = ['a', 'b', 'c', 'd'];
    removeFromSortedArray(arr, 'd', charCode);
    expect(arr).toEqual(['a', 'b', 'c']);
  });

  it('removes items from the middle', () => {
    const arr = ['a', 'b', 'c', 'd'];
    removeFromSortedArray(arr, 'c', charCode);
    expect(arr).toEqual(['a', 'b', 'd']);
  });

  it('does nothing if the element is not found', () => {
    const arr = ['a', 'b', 'c', 'd'];
    removeFromSortedArray(arr, 'z', charCode);
    expect(arr).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('sortByYZ', () => {
  it('sorts elements by their Z property first, then their Y property', () => {
    const arr = [
      { id: 'a', y: 10, z: 0 },
      { id: 'b', y: 5, z: 0 },
      { id: 'c', y: 100, z: 0 },
      { id: 'd', y: -3, z: 1 },
    ];
    sortByYZ(arr);
    expect(arr).toEqual([
      { id: 'b', y: 5, z: 0 },
      { id: 'a', y: 10, z: 0 },
      { id: 'c', y: 100, z: 0 },
      { id: 'd', y: -3, z: 1 },
    ]);
  });
});

