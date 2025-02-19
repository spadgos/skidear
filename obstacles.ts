import { loadImageAndTransparentize } from './canvas_lib.js';
import { FramesMap, ImageSprite } from './sprite.js';

const SPRITE_SHEET = './images/sprite-sheet.png';

const framesMap: FramesMap = new Map([
  ['mogul', [208, 223, 243, 240]],
  ['mogul2', [242, 223, 274, 240]],
  ['mogul3', [208, 240, 274, 259]],
  ['tree', [297, 188, 326, 223]],
  ['tree2', [328, 188, 358, 223]],
  ['tree3', [359, 188, 386, 223]],
]);

export class Obstacle extends ImageSprite {

  constructor() {
    super(loadImageAndTransparentize(SPRITE_SHEET));
    this.setFrames(framesMap);
    this.pickRandomFrame();
  }
}