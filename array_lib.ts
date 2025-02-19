import { HasY } from "./lib";

function sortedInsertPosition<T>(arr: readonly T[], item: T, fn: (item: T) => number): number {
  const val = fn(item);
  // some shortcuts
  if (arr.length === 0 || val <= fn(arr[0])) {
    return 0;
  } else if (val >= fn(arr[arr.length - 1])) {
    return arr.length;
  }

  let left = 0, right = arr.length;
  let leftLast = 0, rightLast = right;
  while (left < right) {
    const inPos = Math.floor((right + left) / 2);
    const compared = fn(arr[inPos]) - val;
    if (compared < 0) {
      left = inPos;
    } else if (compared > 0) {
      right = inPos;
    } else {
      right = inPos;
      left = inPos;
    }
    // nothing has changed, must have found limits. insert between.
    if (leftLast === left && rightLast === right) {
      break;
    }
    leftLast = left;
    rightLast = right;
  }
  return right;
}

export function indexOfSorted<T>(arr: readonly T[], item: T, fn: (item: T) => number): number {
  const ind = sortedInsertPosition(arr, item, fn);

  // Did we land on it?
  if (arr[ind] === item) return ind;

  const val = fn(item);

  // Check up and down for the element
  for (let dir = -1; dir <= 1; dir += 2) {
    for (let i = ind + dir; i >= 0 && i < arr.length && fn(arr[i]) === val; i += dir) {
      if (arr[i] === item) return i;
    }
  }
  return -1;
}

export function insertSortedBy<T>(arr: T[], item: T, fn: (item: T) => number): T[] {
  const insertPos = sortedInsertPosition(arr, item, fn);
  switch (insertPos) {
    case arr.length: arr.push(item); break;
    case 0: arr.unshift(item); break;
    default: arr.splice(insertPos, 0, item);
  }
  return arr;
}

export function removeFromSortedArray<T>(arr: T[], item: T, fn: (item: T) => number): T[] {
  const ind = indexOfSorted(arr, item, fn);
  switch (ind) {
    case -1: break;
    case 0: arr.shift(); break;
    case arr.length - 1: arr.pop(); break;
    default: arr.splice(ind, 1);
  }
  return arr;
}

export function sortByY<T extends HasY>(items: T[]): void {
  items.sort(sortByYComparator);
}
const sortByYComparator = ({ y: a }: HasY, { y: b }: HasY) => a - b;

