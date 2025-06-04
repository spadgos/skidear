import { memoize } from './lib.js';
export const loadImage = memoize((url) => {
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => void res(img);
        img.onerror = rej;
        img.src = url;
    });
});
export function translate(ctx, x, y) {
    ctx.translate(Math.round(x), Math.round(y));
}
//# sourceMappingURL=canvas_lib.js.map