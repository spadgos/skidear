import { memoize } from './lib.js';

export const loadImage = memoize((url: string): Promise<HTMLImageElement> => {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => void res(img);
    img.onerror = rej;
    img.src = url;
  });
});

export function translate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.translate(Math.round(x), Math.round(y));
}
