import { loadImage } from './canvas_lib.js';
import { FrameEventData, Listener } from './events.js';
import { AABB, SkiierImpact } from './lib.js';
import { FramesMap, ImageSprite } from './sprite.js';

const SPRITE_SHEET = './images/ski-free-edit_2x8.png';
const TWO_PI = 2 * Math.PI;

interface HoverMeta {
  height: number;
  amplitude: number;
  frequency: number; // Hz
  offset: number; // 0-1 how far through a cycle this should be offset
}

const frameMeta: { [name: string]: { aabb: AABB, hitbox?: AABB, hoverMeta?: HoverMeta } } = {
  'haveYouSeenThis': {
    aabb: [16, 565, 138, 690],
    hitbox: [-60, 0, 60, 40],
    hoverMeta: {
      offset: 0,
      height: 60,
      amplitude: 20,
      frequency: 1 / 5,  // up and down in 5 seconds
    }
  },
  'title': {
    aabb: [138, 565, 218, 690],
    hitbox: [-40, 0, 40, 30],
    hoverMeta: {
      offset: 0.2,
      height: 60,
      amplitude: 10,
      frequency: 1 / 5,  // up and down in 5 seconds
    }
  }
};

const framesMap: FramesMap = new Map(
  Object.entries(frameMeta)
    .map(([name, { aabb, hitbox }]) => [name, [aabb, hitbox]])
);

export class Decoration extends ImageSprite {

  noClip = true;

  constructor(frameName?: string) {
    super(loadImage(SPRITE_SHEET));
    this.setFrames(framesMap);
    if (frameName) {
      this.setCurrentFrame(frameName);
    } else {
      this.pickRandomFrame();
    }
    // this.debug = true;
  }

  override setCurrentFrame(name: string): void {
    super.setCurrentFrame(name);
    this.onBeforeRender = this.createOnBeforeRender(frameMeta[name].hoverMeta);
  }

  getImpact(): SkiierImpact {
    return {};
  }

  private createOnBeforeRender(meta: HoverMeta | undefined): Listener<FrameEventData> | undefined {
    if (!meta) return undefined;
    const { offset, height, amplitude, frequency } = meta;
    return ({ timeSinceStart }: FrameEventData) => {
      this.z = height + Math.sin(timeSinceStart / 1000 * TWO_PI * frequency + (offset * TWO_PI)) * amplitude;
    };
  }
}
