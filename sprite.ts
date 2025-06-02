import { Listener, KeyEventData, FrameEventData } from './events.js';
import { AABB, intersects, nthItem, randomInt } from './lib.js';
import { translate } from './canvas_lib.js';
import { sortByYZ } from './array_lib.js';

export abstract class Sprite {
  x = 0;
  y = 0;
  z = 0;
  rotation = 0; // radians
  scale = 1;
  width = 2;
  height = 2;
  private children: Sprite[] | undefined;
  debug = false;

  /** If true, `intersectsWith` will always be false. */
  noClip = false;

  private localHitbox: AABB | undefined;
  private globalHitboxCache: AABB | undefined;

  onKeyDown: Listener<KeyEventData> | undefined;
  onBeforeRender?: Listener<FrameEventData>;

  setPos(x: number, y: number, z = 0): void {
    this.x = x;
    this.y = y;
    this.z = Math.max(0, z);
    this.globalHitboxCache = undefined;
  }

  getLocalHitbox(): AABB {
    return this.localHitbox ??= [
      -this.width / 2,
      -this.height / 2,
      this.width / 2,
      this.height / 2,
    ];
  }

  getHitbox(): AABB {
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

  setHitbox(hitbox: AABB | undefined): void {
    this.localHitbox = hitbox;
    this.globalHitboxCache = undefined;
  }

  addChild(child: Sprite): void {
    (this.children ??= []).push(child);
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  // natural size of the visuals
  setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.globalHitboxCache = undefined;
  }

  intersectsWith(other: Sprite): boolean {
    if (this.noClip || other.noClip) return false;
    return intersects(this.getHitbox(), other.getHitbox());
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const {scale, width, height, rotation, children, debug} = this;
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
        /* endAngle */ 2 * Math.PI
      );
      ctx.fill();
      ctx.restore();
      ctx.translate(0, -z);
    }
    if (children) {
      sortByYZ(children);
      for (;
        childIndex < children.length && children[childIndex].y < 0;
        ++childIndex) {
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
      ctx.translate(0.5, 0.5)
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

  debugText(): string {
    return `x: ${this.x.toFixed(1)}, y: ${this.y.toFixed(1)}`;
  }

  async ready(): Promise<void> { } // resolves straight away

  protected abstract drawInner(context: CanvasRenderingContext2D): void;
}

export type FramesMap = Map<string, [frameDimensions: AABB, hitbox?: AABB]>;

export class ImageSprite extends Sprite {
  private frames: FramesMap | undefined;
  private currentFrame: string = '';
  private image: CanvasImageSource | undefined;

  constructor(private imagePromise: CanvasImageSource | Promise<CanvasImageSource>) {
    super();
    void this.loadImage(imagePromise);
  }

  override async ready(): Promise<void> {
    await this.imagePromise;
  }

  async loadImage(image: CanvasImageSource | Promise<CanvasImageSource>) {
    this.image = image instanceof Promise ? await image : image;
  }

  setFrames(frames: FramesMap | undefined): void {
    if (!frames?.size) {
      this.currentFrame = '';
      this.frames = undefined;
    } else {
      this.frames = frames;
      this.setCurrentFrame(nthItem(frames.keys(), 0)!);
    }
  }

  // addFrame(name: string, aabb: AABB): this {
  //   this.frames ??= new Map();
  //   this.frames.set(name, aabb);
  //   if (!this.currentFrame) {
  //     this.setCurrentFrame(name);
  //   }
  //   return this;
  // }

  pickRandomFrame(pickFromKeys?: string[]): void {
    if (!this.frames) return;
    const frameNames = pickFromKeys ?? [...this.frames.keys()];
    const frameInd = randomInt(0, frameNames.length);
    const frameName = frameNames[frameInd];
    if (frameName) {
      this.setCurrentFrame(frameName);
    }
  }

  setCurrentFrame(name: string): void {
    if (this.currentFrame === 'name') return;
    const aabb = this.frames?.get(name);
    if (!aabb) throw new Error(`Unknown frame: ${name}`);
    const [[x1, y1, x2, y2], localHitbox] = aabb;
    this.currentFrame = name;
    this.setSize(Math.abs(x2 - x1), Math.abs(y2 - y1));
    this.setHitbox(localHitbox);
  }

  protected drawInner(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;

    if (this.frames) {
      const [[x1, y1, x2, y2]] = this.frames.get(this.currentFrame)!;
      ctx.save();
      ctx.scale((x2 - x1) / Math.abs(x2 - x1), (y2 - y1) / Math.abs(y2 - y1));
      translate(ctx, -this.width / 2, -this.height / 2);
      ctx.drawImage(
        this.image,
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
    } else {
      ctx.drawImage(this.image, 0, 0);
    }
  }
}

// Converts a z value to the alpha value of the shadow to draw underneath the sprite
// Starts at 0, peaks at z ~= 30 @ alpha = 0.42 and gets lower from there asymptotically.
function zToAlpha(z: number): number {
  return z / 25 * (Math.E ** (-0.034657 * z));
}