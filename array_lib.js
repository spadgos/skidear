function sortedInsertPosition(arr, item, fn) {
    const val = fn(item);
    // some shortcuts
    if (arr.length === 0 || val <= fn(arr[0])) {
        return 0;
    }
    else if (val >= fn(arr[arr.length - 1])) {
        return arr.length;
    }
    let left = 0, right = arr.length;
    let leftLast = 0, rightLast = right;
    while (left < right) {
        const inPos = Math.floor((right + left) / 2);
        const compared = fn(arr[inPos]) - val;
        if (compared < 0) {
            left = inPos;
        }
        else if (compared > 0) {
            right = inPos;
        }
        else {
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
export function indexOfSorted(arr, item, fn) {
    const ind = sortedInsertPosition(arr, item, fn);
    // Did we land on it?
    if (arr[ind] === item)
        return ind;
    const val = fn(item);
    // Check up and down for the element
    for (let dir = -1; dir <= 1; dir += 2) {
        for (let i = ind + dir; i >= 0 && i < arr.length && fn(arr[i]) === val; i += dir) {
            if (arr[i] === item)
                return i;
        }
    }
    return -1;
}
export function insertSortedBy(arr, item, fn) {
    const insertPos = sortedInsertPosition(arr, item, fn);
    switch (insertPos) {
        case arr.length:
            arr.push(item);
            break;
        case 0:
            arr.unshift(item);
            break;
        default: arr.splice(insertPos, 0, item);
    }
    return arr;
}
export function removeFromSortedArray(arr, item, fn) {
    const ind = indexOfSorted(arr, item, fn);
    switch (ind) {
        case -1: break;
        case 0:
            arr.shift();
            break;
        case arr.length - 1:
            arr.pop();
            break;
        default: arr.splice(ind, 1);
    }
    return arr;
}
export function sortByYZ(items) {
    items.sort(sortByYComparator);
}
const sortByYComparator = ({ y: ay, z: az, zIndex: azi }, { y: by, z: bz, zIndex: bzi }) => {
    return azi - bzi || az - bz || ay - by;
};
//# sourceMappingURL=array_lib.js.map