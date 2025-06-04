import { loadImage } from './canvas_lib.js';
import { ImageSprite } from './sprite.js';
const SPRITE_SHEET = './images/ski-free-edit_2x8.png';
const TWO_PI = 2 * Math.PI;
const frameMeta = {
    'haveYouSeenThis': {
        aabb: [16, 565, 137, 690],
        hitbox: [-60, 0, 60, 40],
        hoverMeta: {
            offset: 0,
            height: 60,
            amplitude: 20,
            frequency: 1 / 5, // up and down in 5 seconds
        }
    },
    'title': {
        aabb: [138, 565, 218, 690],
        hitbox: [-40, 0, 40, 30],
        hoverMeta: {
            offset: 0.2,
            height: 60,
            amplitude: 10,
            frequency: 1 / 5, // up and down in 5 seconds
        }
    },
    'lobsterSki': {
        aabb: [568, 520, 634, 586]
    }
};
const framesMap = new Map(Object.entries(frameMeta)
    .map(([name, { aabb, hitbox }]) => [name, [aabb, hitbox]]));
export class Decoration extends ImageSprite {
    noClip = true;
    hoverMeta;
    constructor(frameName) {
        super(loadImage(SPRITE_SHEET));
        this.setFrames(framesMap);
        if (frameName) {
            this.setCurrentFrame(frameName);
        }
        else {
            this.pickRandomFrame();
        }
        // this.debug = true;
    }
    setCurrentFrame(name) {
        super.setCurrentFrame(name);
        this.hoverMeta = frameMeta[name].hoverMeta;
    }
    getImpact() {
        return {};
    }
    onBeforeRender(event) {
        super.onBeforeRender(event);
        if (!this.hoverMeta)
            return;
        const { timeSinceStart } = event;
        const { offset, height, amplitude, frequency } = this.hoverMeta;
        this.z = height + Math.sin(timeSinceStart / 1000 * TWO_PI * frequency + (offset * TWO_PI)) * amplitude;
    }
}
//# sourceMappingURL=decoration.js.map