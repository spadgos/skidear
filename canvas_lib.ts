import { memoize } from "./lib";

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
