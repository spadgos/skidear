import { intersects, nthItem, randomInt } from './lib.js';
import { translate } from './canvas_lib.js';
import { sortByYZ } from './array_lib.js';
export class Sprite {
    x = 0;
    y = 0;
    z = 0;
    zIndex = 0; // Used to override the Y-based sorting for elements. Negative numbers go behind.
    rotation = 0; // radians
    scale = 1;
    width = 2;
    height = 2;
    flip = false;
    children;
    debug = false;
    /** If true, `intersectsWith` will always be false. */
    noClip = false;
    localHitbox;
    globalHitboxCache;
    onKeyDown(event) { }
    onBeforeRender(event) { }
    setPos(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = Math.max(0, z);
        this.globalHitboxCache = undefined;
    }
    getLocalHitbox() {
        return this.localHitbox ??= [
            -this.width / 2,
            -this.height / 2,
            this.width / 2,
            this.height / 2,
        ];
    }
    getHitbox() {
        if (!this.globalHitboxCache) {
            const local = this.getLocalHitbox();
            this.globalHitboxCache = [
                this.x + local[0],
                this.y + local[1],
                this.x + local[2],
                this.y + local[3],
            ];
        }
        return this.globalHitboxCache;
    }
    setHitbox(hitbox) {
        this.localHitbox = hitbox;
        this.globalHitboxCache = undefined;
    }
    addChild(child) {
        (this.children ??= []).push(child);
    }
    setScale(scale) {
        this.scale = scale;
    }
    // natural size of the visuals
    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.globalHitboxCache = undefined;
    }
    intersectsWith(other) {
        if (this.noClip || other.noClip)
            return false;
        return intersects(this.getHitbox(), other.getHitbox());
    }
    draw(ctx) {
        const { scale, width, height, rotation, children, debug } = this;
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const z = Math.round(this.z);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);
        let childIndex = 0;
        if (z > 0) {
            // draw a shadow on the ground
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.globalAlpha = zToAlpha(z);
            ctx.beginPath();
            const [l, t, r, b] = this.getLocalHitbox();
            const shadowScale = 1 - (z ** 0.35) / 10;
            ctx.ellipse(
            /* x */ (r + l) / 2, 
            /* y */ (b + t) / 2, 
            /* radiusX */ (r - l) / 2 * shadowScale, 
            /* radiusY */ (b - t) / 2 * shadowScale, 
            /* rotation */ 0, 
            /* startAngle */ 0, 
            /* endAngle */ 2 * Math.PI);
            ctx.fill();
            ctx.restore();
            ctx.translate(0, -z);
        }
        if (children) {
            sortByYZ(children);
            for (; childIndex < children.length && children[childIndex].y < 0; ++childIndex) {
                children[childIndex].draw(ctx);
            }
        }
        this.drawInner(ctx);
        if (children) {
            for (; childIndex < children.length; ++childIndex) {
                children[childIndex].draw(ctx);
            }
        }
        if (debug) {
            ctx.save();
            ctx.translate(0.5, 0.5);
            ctx.fillStyle = '#f0f';
            ctx.strokeStyle = '#f0f';
            ctx.lineWidth = 1;
            ctx.fillText(this.debugText(), width / 2, height / 2);
            const [l, t, r, b] = this.getHitbox(); // global coords
            ctx.strokeRect(l - x, t - y, r - l, b - t);
            ctx.strokeStyle = '#f008';
            ctx.strokeRect(-width / 2, -height / 2, width, height);
            ctx.restore();
        }
        ctx.restore();
    }
    debugText() {
        return `x: ${this.x.toFixed(1)}, y: ${this.y.toFixed(1)}`;
    }
    async ready() { } // resolves straight away
}
export class ImageSprite extends Sprite {
    imagePromise;
    frames;
    currentFrame = '';
    image;
    animations;
    currentAnimation;
    animationStartTime = 0;
    constructor(imagePromise) {
        super();
        this.imagePromise = imagePromise;
        void this.loadImage(imagePromise);
    }
    async ready() {
        await this.imagePromise;
    }
    async loadImage(image) {
        this.image = image instanceof Promise ? await image : image;
    }
    setFrames(frames) {
        if (!frames?.size) {
            this.currentFrame = '';
            this.frames = undefined;
        }
        else {
            this.frames = frames;
            this.setCurrentFrame(nthItem(frames.keys(), 0));
        }
    }
    setAnimations(animations) {
        this.animations = animations;
    }
    startAnimation(animationName) {
        const newAnimation = this.animations?.get(animationName);
        if (!newAnimation) {
            throw new Error(`Unknown animation: ${animationName}`);
        }
        if (this.currentAnimation === newAnimation)
            return;
        this.currentAnimation = newAnimation;
        this.animationStartTime = Date.now();
    }
    clearAnimation() {
        this.currentAnimation = undefined;
    }
    onBeforeRender(event) {
        if (!this.currentAnimation)
            return;
        const { frameRate, frames, repeat = true } = this.currentAnimation;
        const elapsedSeconds = (Date.now() - this.animationStartTime) / 1000;
        const frameNumber = Math.floor(elapsedSeconds * frameRate);
        const frameIndex = repeat
            ? frameNumber % frames.length
            : Math.min(frameNumber, frames.length - 1);
        this.setCurrentFrame(frames[frameIndex]);
    }
    pickRandomFrame(pickFromKeys) {
        if (!this.frames)
            return;
        const frameNames = pickFromKeys ?? [...this.frames.keys()];
        const frameInd = randomInt(0, frameNames.length);
        const frameName = frameNames[frameInd];
        if (frameName) {
            this.setCurrentFrame(frameName);
        }
    }
    setCurrentFrame(name) {
        if (this.currentFrame === name)
            return;
        const aabb = this.frames?.get(name);
        if (!aabb)
            throw new Error(`Unknown frame: ${name}`);
        const [[x1, y1, x2, y2], localHitbox] = aabb;
        this.currentFrame = name;
        this.setSize(Math.abs(x2 - x1), Math.abs(y2 - y1));
        this.setHitbox(localHitbox);
    }
    drawInner(ctx) {
        if (!this.image)
            return;
        if (this.frames) {
            const [[x1, y1, x2, y2]] = this.frames.get(this.currentFrame);
            ctx.save();
            ctx.scale((x2 - x1) / Math.abs(x2 - x1) * (this.flip ? -1 : 1), (y2 - y1) / Math.abs(y2 - y1));
            translate(ctx, -this.width / 2, -this.height / 2);
            ctx.drawImage(this.image, 
            // Source coords
            Math.min(x1, x2), // sx
            Math.min(y1, y2), // sy
            Math.abs(x2 - x1), // sw
            Math.abs(y2 - y1), // sh
            // Destination coords
            0, // dx
            0, // dy
            Math.abs(x2 - x1), // dw
            Math.abs(y2 - y1) // dh
            );
            ctx.restore();
        }
        else {
            ctx.drawImage(this.image, 0, 0);
        }
    }
}
// Converts a z value to the alpha value of the shadow to draw underneath the sprite
// Starts at 0, peaks at z ~= 30 @ alpha = 0.42 and gets lower from there asymptotically.
function zToAlpha(z) {
    return z / 25 * (Math.E ** (-0.034657 * z));
}
//# sourceMappingURL=sprite.js.map