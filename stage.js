import { convertKeyboardEvent } from './events.js';
import { easeTo, getY } from './lib.js';
import { translate } from './canvas_lib.js';
import { insertSortedBy, removeFromSortedArray, sortByYZ } from './array_lib.js';
const VIEWPORT_EASING_STRENGTH = 0.25;
const VIEWPORT_EASING_EPSILON = 0.1;
const ZOOM_EASING_STRENGTH = 0.05;
const ZOOM_EASING_EPSILON = 0.005;
export class Stage {
    canvas;
    sprites = [];
    chromeSprites = [];
    width;
    height;
    context;
    zoom = 1;
    targetZoom = undefined;
    // The centerpoint of the viewport
    viewportX = 0;
    viewportY = 0;
    targetViewportX;
    targetViewportY;
    background;
    rafId = 0;
    startTime = 0;
    lastFrameTime = 0;
    onPrepareFrame;
    onBeforeRender;
    adjustContextBeforeChrome;
    onBeforeRenderChrome;
    onKeyDown;
    timeouts = new Set();
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
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
    setTimeout(callback, delayMs) {
        const id = window.setTimeout(() => {
            this.timeouts.delete(id);
            callback();
        }, delayMs);
        this.timeouts.add(id);
        return id;
    }
    nextFrame = () => {
        const now = Date.now();
        const frameDelta = now - this.lastFrameTime;
        const timeSinceStart = now - this.startTime;
        const frameEvent = { frameDelta, timeSinceStart };
        this.onPrepareFrame?.(frameEvent);
        for (const sprite of this.sprites) {
            sprite.onBeforeRender?.(frameEvent);
        }
        this.onBeforeRender?.(frameEvent);
        this.render();
        this.onBeforeRenderChrome?.(frameEvent);
        if (this.adjustContextBeforeChrome != null) {
            this.context.save();
            this.adjustContextBeforeChrome(this.context, frameEvent);
        }
        this.renderChrome();
        if (this.adjustContextBeforeChrome != null) {
            this.context.restore();
        }
        this.lastFrameTime = now;
        this.rafId = requestAnimationFrame(this.nextFrame);
    };
    onKeyDownPrivate = (e) => {
        let preventDefault = false;
        const newEvent = convertKeyboardEvent(e);
        for (const sprite of this.sprites) {
            preventDefault = (sprite.onKeyDown(newEvent) === false) || preventDefault;
        }
        preventDefault = (this.onKeyDown?.(newEvent) === false) || preventDefault;
        if (preventDefault) {
            e.preventDefault();
        }
    };
    drawChrome(ctx) { }
    setBackground(color) {
        this.background = color;
    }
    setViewport(vx, vy) {
        this.viewportX = vx;
        this.viewportY = vy;
        this.targetViewportX = this.targetViewportY = undefined;
    }
    animateViewport(vx, vy) {
        this.targetViewportX = vx;
        this.targetViewportY = vy;
    }
    addSprite(sprite) {
        insertSortedBy(this.sprites, sprite, getY);
    }
    removeSprite(sprite) {
        removeFromSortedArray(this.sprites, sprite, getY);
    }
    // positive number means it's to the outer side of that edge
    // negative number means it's to the inner side of that edge (might be outside the viewport on the opposite side though)
    // todo: handle zoom
    distanceOutsideViewportEdge(edge, coord) {
        const edgeCoord = this.getViewportEdge(edge);
        switch (edge) {
            case 'left':
            case 'top': return edgeCoord - coord;
            case 'right':
            case 'bottom': return coord - edgeCoord;
        }
    }
    getViewportEdge(edge) {
        const { viewportX: vx, viewportY: vy, width, height, zoom } = this;
        switch (edge) {
            case 'top': return vy - (height / zoom) / 2;
            case 'right': return vx + (width / zoom) / 2;
            case 'bottom': return vy + (height / zoom) / 2;
            case 'left': return vx - (width / zoom) / 2;
        }
    }
    animate() {
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
    render() {
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
    renderChrome() {
        const ctx = this.context;
        for (const sprite of this.chromeSprites) {
            sprite.draw(ctx);
        }
    }
}
//# sourceMappingURL=stage.js.map