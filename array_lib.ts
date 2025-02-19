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
  let ind = sortedInsertPosition(arr, item, fn);
  const val = fn(item);
  for (let i = 0, searchUp = true, searchDown = true; searchUp || searchDown; ++i) {
    if (searchUp && arr[ind + i] === item) {
      return ind + i;
    }
    if (searchDown && arr[ind - i] === item) {
      return ind - i;
    }
    searchUp &&= fn(arr[ind + i]) === val;
    searchDown &&= fn(arr[ind - i]) === val;
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

