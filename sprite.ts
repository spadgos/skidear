import { Listener, KeyEventData, FrameEventData } from './events.js';
import { nthItem, randomInt, translate } from './lib.js';
import { sortByY } from "./array_lib.js";

export abstract class Sprite {
  x = 0;
  y = 0;
  rotation = 0; // radians
  scale = 1;
  width = 0;
  height = 0;
  private children: Sprite[] | undefined;
  debug = false;

  onKeyDown: Listener<KeyEventData> | undefined;
  onBeforeRender: Listener<FrameEventData> | undefined;

  setPos(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  addChild(child: Sprite) {
    (this.children ??= []).push(child);
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  // natural size
  setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);
    let childIndex = 0;
    if (this.children) {
      sortByY(this.children);
      for (;
        childIndex < this.children.length && this.children[childIndex].y < 0;
        ++childIndex) {
        this.children[childIndex].draw(ctx);
      }
    }
    this.drawInner(ctx);
    if (this.children) {
      for (; childIndex < this.children.length; ++childIndex) {
        this.children[childIndex].draw(ctx);
      }
    }
    if (this.debug) {
      ctx.fillText(this.debugText(), this.width / 2, this.height / 2);
    }
    ctx.restore();
  }

  debugText(): string {
    return `x: ${this.x.toFixed(1)}, y: ${this.y.toFixed(1)}`;
  }

  async ready(): Promise<void> { } // resolves straight away

  protected abstract drawInner(context: CanvasRenderingContext2D): void;
}

export type AABB = [x1: number, y1: number, x2: number, y2: number];

export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

export type FramesMap = Map<string, AABB>;

export class ImageSprite extends Sprite {
  private frames: FramesMap | undefined;
  private currentFrame: string = '';
  private image: ImageSource | undefined;

  constructor(private imagePromise: ImageSource | Promise<ImageSource>) {
    super();
    void this.loadImage(imagePromise);
  }

  override async ready(): Promise<void> {
    await this.imagePromise;
  }

  async loadImage(image: ImageSource | Promise<ImageSource>) {
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

  addFrame(name: string, aabb: AABB): this {
    this.frames ??= new Map();
    this.frames.set(name, aabb);
    if (!this.currentFrame) {
      this.setCurrentFrame(name);
    }
    return this;
  }

  pickRandomFrame(): void {
    if (!this.frames) return;
    const frameInd = randomInt(0, this.frames.size);
    const frameName = nthItem(this.frames.keys(), frameInd);
    if (frameName) {
      this.setCurrentFrame(frameName);
    }
  }

  setCurrentFrame(name: string): void {
    const aabb = this.frames?.get(name);
    if (!aabb) throw new Error(`Unknown frame: ${name}`);
    const [x1, y1, x2, y2] = aabb;
    this.currentFrame = name;
    this.setSize(Math.abs(x2 - x1), Math.abs(y2 - y1));
  }

  protected drawInner(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;

    if (this.frames) {
      const [x1, y1, x2, y2] = this.frames.get(this.currentFrame)!;
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