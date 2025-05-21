import { loadImageAndTransparentize } from './canvas_lib.js';
import { AABB, SkiierImpact } from './lib.js';
import { FramesMap, ImageSprite } from './sprite.js';

const SPRITE_SHEET = './images/sprite-sheet.png';

const MOGUL_MAX_SPEED = 0.1;

const frameMeta: { [name: string]: { aabb: AABB, hitbox?: AABB, impact: SkiierImpact } } = {
  'mogul': {
    aabb: [208, 223, 243, 240],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'mogul2': {
    aabb: [242, 223, 274, 240],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'mogul3': {
    aabb: [208, 240, 274, 259],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'tree': {
    aabb: [297, 188, 326, 223],
    hitbox: [-15, 13, 15, 17],
    impact: { crash: true },
  },
  'tree2': {
    aabb: [328, 188, 358, 223],
    hitbox: [-15, 13, 15, 17],
    impact: { crash: true },
  },
  'tree3': {
    aabb: [359, 188, 386, 223],
    hitbox: [-15, 13, 15, 17],
    impact: { crash: true },
  },
  'jump': {
    aabb: [224, 197, 257, 205],
    impact: { jump: true }
  },
};

const framesMap: FramesMap = new Map(
  Object.entries(frameMeta)
    .map(([name, { aabb, hitbox }]) => [name, [aabb, hitbox]])
);

export class Obstacle extends ImageSprite {
  private impact: SkiierImpact | undefined;

  constructor() {
    super(loadImageAndTransparentize(SPRITE_SHEET));
    this.setFrames(framesMap);
    this.pickRandomFrame();
    // this.setCurrentFrame('jump');
  }

  getImpact(): SkiierImpact {
    return this.impact ?? {};
  }

  override setCurrentFrame(name: string): void {
    super.setCurrentFrame(name);
    this.impact = frameMeta[name].impact;
  }
}
