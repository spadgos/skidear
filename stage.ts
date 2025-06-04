import {Sprite} from './sprite.js';
import {Listener, convertKeyboardEvent, KeyEventData, FrameEventData} from './events.js';
import { easeTo, getY } from './lib.js';
import { translate } from './canvas_lib.js';
import { insertSortedBy, removeFromSortedArray, sortByYZ } from './array_lib.js';

type Edge = 'top'|'right'|'bottom'|'left';

const VIEWPORT_EASING_STRENGTH = 0.25;
const VIEWPORT_EASING_EPSILON = 0.1;
const ZOOM_EASING_STRENGTH = 0.05;
const ZOOM_EASING_EPSILON = 0.005;

export class Stage {
  protected readonly sprites: Sprite[] = [];
  protected readonly chromeSprites: Sprite[] = [];
  protected width: number;
  protected height: number;
  protected readonly context: CanvasRenderingContext2D;

  private zoom = 1;
  protected targetZoom: number | undefined = undefined;

  // The centerpoint of the viewport
  protected viewportX = 0;
  protected viewportY = 0;
  private targetViewportX: number | undefined;
  private targetViewportY: number | undefined;

  protected background: string | undefined;

  protected rafId = 0;
  protected startTime = 0;
  protected lastFrameTime = 0;

  onPrepareFrame?: Listener<FrameEventData>;
  onBeforeRender?: Listener<FrameEventData>;
  onBeforeRenderChrome?: Listener<FrameEventData>;
  onKeyDown?: Listener<KeyEventData>;

  private readonly timeouts = new Set<number>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  start() {
    // focus lock?
    document.body.addEventListener('keydown', this.onKeyDownPrivate);
    this.startTime = this.lastFrameTime = Date.now();
    this.nextFrame();
  }

  stop() {
    document.body.removeEventListener('keydown', this.onKeyDownPrivate);
    cancelAnimationFrame(this.rafId);
    for (const id of this.timeouts) {
      window.clearTimeout(id);
    }
    this.timeouts.clear();
  }

  protected setTimeout(callback: () => void, delayMs: number): number {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delayMs);
    this.timeouts.add(id);
    return id;
  }

  private readonly nextFrame = () => {
    const now = Date.now();
    const frameDelta = now - this.lastFrameTime;
    const timeSinceStart = now - this.startTime;
    const frameEvent: FrameEventData = {frameDelta, timeSinceStart};
    this.onPrepareFrame?.(frameEvent);
    for (const sprite of this.sprites) {
      sprite.onBeforeRender?.(frameEvent);
    }
    this.onBeforeRender?.(frameEvent);
    this.render();
    this.onBeforeRenderChrome?.(frameEvent);
    this.renderChrome();
    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.nextFrame);
  }

  private readonly onKeyDownPrivate = (e: KeyboardEvent) => {
    let preventDefault = false;
    const newEvent = convertKeyboardEvent(e);
    for (const sprite of this.sprites) {
      preventDefault = (sprite.onKeyDown(newEvent) === false) || preventDefault;
    }
    preventDefault = (this.onKeyDown?.(newEvent) === false) || preventDefault;
    if (preventDefault) {
      e.preventDefault();
    }
  }

  drawChrome(ctx: CanvasRenderingContext2D) {}

  setBackground(color: string) {
    this.background = color;
  }

  setViewport(vx: number, vy: number) {
    this.viewportX = vx;
    this.viewportY = vy;
    this.targetViewportX = this.targetViewportY = undefined;
  }

  animateViewport(vx: number, vy: number) {
    this.targetViewportX = vx;
    this.targetViewportY = vy;
  }

  addSprite(sprite: Sprite): void {
    insertSortedBy(this.sprites, sprite, getY);
  }

  removeSprite(sprite: Sprite): void {
    removeFromSortedArray(this.sprites, sprite, getY);
  }

  // positive number means it's to the outer side of that edge
  // negative number means it's to the inner side of that edge (might be outside the viewport on the opposite side though)
  // todo: handle zoom
  protected distanceOutsideViewportEdge(edge: Edge, coord: number): number {
    const edgeCoord = this.getViewportEdge(edge);
    switch (edge) {
      case 'left':
      case 'top': return edgeCoord - coord;
      case 'right':
      case 'bottom': return coord - edgeCoord;
    }
  }

  protected getViewportEdge(edge: Edge): number {
    const {viewportX: vx, viewportY: vy, width, height, zoom} = this;
    switch (edge) {
      case 'top': return vy - (height / zoom) / 2;
      case 'right': return vx + (width / zoom) / 2;
      case 'bottom': return vy + (height / zoom) / 2;
      case 'left': return vx - (width / zoom) / 2;
    }
  }

  private animate() {
    if (this.targetViewportX != null && this.targetViewportY != null) {
      this.viewportX = easeTo(this.viewportX, this.targetViewportX, VIEWPORT_EASING_STRENGTH, VIEWPORT_EASING_EPSILON);
      this.viewportY = easeTo(this.viewportY, this.targetViewportY, VIEWPORT_EASING_STRENGTH, VIEWPORT_EASING_EPSILON);
      if (this.viewportX === this.targetViewportX && this.viewportY === this.targetViewportY) {
        this.targetViewportX = this.targetViewportY = undefined;
      }
    }
    if (this.targetZoom != null) {
      this.zoom = easeTo(this.zoom, this.targetZoom, ZOOM_EASING_STRENGTH, ZOOM_EASING_EPSILON);
      if (this.zoom === this.targetZoom) {
        this.targetZoom = undefined;
      }
    }
  }

  private render(): void {
    this.animate();
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.background) {
      ctx.save();
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
    ctx.save();
    translate(ctx, -this.viewportX + this.width / 2, 0);
    ctx.scale(this.zoom, this.zoom);
    translate(ctx, 0, -this.viewportY + this.height / 2);
    sortByYZ(this.sprites);
    for (const sprite of this.sprites) {
      sprite.draw(ctx);
    }
    ctx.restore();
  }

  private renderChrome() {
    const ctx = this.context;
    for (const sprite of this.chromeSprites) {
      sprite.draw(ctx);
    }
  }
}