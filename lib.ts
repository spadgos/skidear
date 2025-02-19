export type HasY = {y: number};

export const loadImage = memoize((url: string): Promise<HTMLImageElement> => {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => void res(img);
    img.onerror = rej;
    img.src = url;
  });
});

// todo: could remove this if the source was a proper transparent png
export const loadImageAndTransparentize = memoize(async (url: string): Promise<OffscreenCanvas> => {
  return whiteToTransparent(await loadImage(url));
});

function whiteToTransparent(img: HTMLImageElement): OffscreenCanvas {
  const { width, height } = img;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function translate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.translate(Math.round(x), Math.round(y));
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

export function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getY(item: HasY): number {
  return item.y;
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