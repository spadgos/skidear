import {Sprite} from './sprite.js';
import {Listener, convertKeyboardEvent, KeyEventData, FrameEventData} from './events.js';
import { easeTo, getY } from './lib.js';
import { translate } from './canvas_lib.js';
import { insertSortedBy, removeFromSortedArray, sortByY } from './array_lib.js';

type Edge = 'top'|'right'|'bottom'|'left';

export class Stage {
  protected readonly sprites: Sprite[] = [];
  protected width: number;
  protected height: number;
  protected readonly context: CanvasRenderingContext2D;

  protected zoom = 1;

  // The centerpoint of the viewport
  protected viewportX = 0;
  protected viewportY = 0;
  private targetViewportX: number | undefined;
  private targetViewportY: number | undefined;
  
  protected background: string | undefined;

  protected rafId = 0;
  protected startTime = 0;
  protected lastFrameTime = 0;

  onBeforeRender?: Listener<FrameEventData>;
  onKeyDown?: Listener<KeyEventData>;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d')!;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  start() {
    document.body.addEventListener('keydown', this.onKeyDownPrivate);
    this.startTime = this.lastFrameTime = Date.now();
    this.nextFrame();
  }
  
  stop() {
    document.body.removeEventListener('keydown', this.onKeyDownPrivate);
    cancelAnimationFrame(this.rafId);
  }

  private readonly nextFrame = () => {
    const now = Date.now();
    const frameDelta = now - this.lastFrameTime;
    const timeSinceStart = now - this.startTime;
    const frameEvent: FrameEventData = {frameDelta, timeSinceStart};
    for (const sprite of this.sprites) {
      sprite.onBeforeRender?.(frameEvent);
    }
    this.onBeforeRender?.(frameEvent);
    this.render();
    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.nextFrame);
  }

  private readonly onKeyDownPrivate = (e: KeyboardEvent) => {
    const newEvent = convertKeyboardEvent(e);
    // todo: maybe gather these when the sprites are added and removed
    for (const sprite of this.sprites) {
      sprite.onKeyDown?.(newEvent);
    }
    this.onKeyDown?.(newEvent);
  }

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
  distanceOutsideViewportEdge(edge: Edge, coord: number): number {
    const edgeCoord = this.getViewportEdge(edge);
    switch (edge) {
      case 'left':
      case 'top': return edgeCoord - coord;
      case 'right': 
      case 'bottom': return coord - edgeCoord;
    }
  }

  getViewportEdge(edge: Edge): number {
    const {viewportX: vx, viewportY: vy, width, height} = this;
    switch (edge) {
      case 'top': return vy - height / 2;
      case 'right': return vx + width / 2;
      case 'bottom': return vy + height / 2;
      case 'left': return vx - width / 2;
    }
  }

  private animate() {
    if (this.targetViewportX != null && this.targetViewportY != null) {
      this.viewportX = easeTo(this.viewportX, this.targetViewportX, 0.25, 0.1);
      this.viewportY = easeTo(this.viewportY, this.targetViewportY, 0.25, 0.1);
      if (this.viewportX === this.targetViewportX && this.viewportY === this.targetViewportY) {
        this.targetViewportX = this.targetViewportY = undefined;
      }
    }
  }

  render(): void {
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
    translate(ctx, -this.viewportX + this.width / 2, -this.viewportY + this.height / 2);
    sortByY(this.sprites);
    for (const sprite of this.sprites) {
      sprite.draw(ctx);
    }
    ctx.restore();
  }
}