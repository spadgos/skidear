import { loadImage } from './canvas_lib.js';
import { AABB, randomInt, SkiierImpact } from './lib.js';
import { FramesMap, ImageSprite } from './sprite.js';

const SPRITE_SHEET = './images/ski-free-edit_2x9.png';

const MOGUL_MAX_SPEED = 0.25;

const frameMeta: { [name: string]: { aabb: AABB, hitbox?: AABB, impact: SkiierImpact } } = {
  'mogul': {
    aabb: [415, 648, 484, 676],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'mogul2': {
    aabb: [484, 654, 548, 680],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'mogul3': {
    aabb: [415, 682, 548, 720],
    impact: { maxSpeed: MOGUL_MAX_SPEED },
  },
  'tree': {
    aabb: [594, 600, 652, 668],
    hitbox: [-25, 26, 25, 34],
    impact: { crash: true },
  },
  'tree2': {
    aabb: [656, 600, 716, 668],
    hitbox: [-25, 26, 25, 34],
    impact: { crash: true },
  },
  'tree3': {
    aabb: [718, 600, 772, 668],
    hitbox: [-25, 26, 25, 34],
    impact: { crash: true },
  },
  'jump': {
    aabb: [450, 615, 514, 630],
    impact: { jump: true }
  },
};

const frameWeights = Object.keys(frameMeta).concat(['jump', 'jump', 'tree', 'tree2', 'tree3']);

const framesMap: FramesMap = new Map(
  Object.entries(frameMeta)
    .map(([name, { aabb, hitbox }]) => [name, [aabb, hitbox]])
);

export class Obstacle extends ImageSprite {
  private impact: SkiierImpact | undefined;

  constructor() {
    super(loadImage(SPRITE_SHEET));
    this.setFrames(framesMap);
    const frameInd = randomInt(0, frameWeights.length);
    const frameName = frameWeights[frameInd];
    this.setCurrentFrame(frameName);
    // this.debug = true;
    // this.setCurrentFrame('jump');
  }

  getImpact(): SkiierImpact {
    return this.impact ?? {};
  }

  override setCurrentFrame(name: string): void {
    super.setCurrentFrame(name);
    this.impact = frameMeta[name].impact;
    this.zIndex = name.startsWith('mogul') ? -1 : 0;
  }
}
