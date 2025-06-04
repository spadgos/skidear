import { loadImage } from './canvas_lib.js';
import { ImageSprite } from './sprite.js';
const SPRITE_SHEET = './images/ski-free-edit_2x8.png';
const MOGUL_MAX_SPEED = 0.1;
const frameMeta = {
    // 'mogul': {
    //   aabb: [416, 670, 486, 698],
    //   impact: { maxSpeed: MOGUL_MAX_SPEED },
    // },
    // 'mogul2': {
    //   aabb: [484, 672, 548, 700],
    //   impact: { maxSpeed: MOGUL_MAX_SPEED },
    // },
    // 'mogul3': {
    //   aabb: [416, 702, 548, 740],
    //   impact: { maxSpeed: MOGUL_MAX_SPEED },
    // },
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
const framesMap = new Map(Object.entries(frameMeta)
    .map(([name, { aabb, hitbox }]) => [name, [aabb, hitbox]]));
export class Obstacle extends ImageSprite {
    impact;
    constructor() {
        super(loadImage(SPRITE_SHEET));
        this.setFrames(framesMap);
        this.pickRandomFrame();
        // this.debug = true;
        // this.setCurrentFrame('jump');
    }
    getImpact() {
        return this.impact ?? {};
    }
    setCurrentFrame(name) {
        super.setCurrentFrame(name);
        this.impact = frameMeta[name].impact;
    }
}
//# sourceMappingURL=obstacles.js.map