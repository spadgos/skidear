import { FramesMap, ImageSprite } from './sprite.js';
import { clamp, easeTo, loadImageAndTransparentize } from './lib.js';
import { FrameEventData, KeyEventData } from './events.js';

// const FRICTION = 0.50;
// const FRICTION = 0.90;
const SLOPE = 900;
const ACCELERATION = 0.02; // 0-1
const TURN_SPEED = 0.2; // 0-1
const MAX_TURN_SPEED = Math.PI; // radians/sec
const SPRITE_SHEET = './images/sprite-sheet.png';

const frames: FramesMap = new Map([
  ['left', [34, 6, 10, 40]],
  ['hard-left', [58, 6, 34, 40]],
  ['slight-left', [76, 6, 58, 40]],
  ['straight', [76, 6, 93, 40]],
  ['slight-right', [58, 6, 76, 40]],
  ['hard-right', [34, 6, 58, 40]],
  ['right', [10, 6, 34, 40]],
]);

const turningFrames: readonly string[] = [
  'left',
  'hard-left',
  'slight-left',
  'straight',
  'slight-right',
  'hard-right',
  'right'
];

const ANGLE_STEP = Math.PI / 8;
const MIN_ANGLE = -Math.PI / 2;
const MAX_ANGLE = Math.PI / 2;
const FOOT_SPEED = 100;

export const MAX_SPEED = SLOPE;

export class Skiier extends ImageSprite {
  angle: number = MIN_ANGLE;
  private targetAngle = this.angle;
  
  speed: number = 100;

  constructor() {
    super(loadImageAndTransparentize(SPRITE_SHEET));
    this.setFrames(frames);
  }

  readonly onKeyDown = ({ key }: KeyEventData): void => {
    switch (key) {
      case 'ArrowRight':
        if (this.angle < MAX_ANGLE) {
          this.setTargetAngle(this.targetAngle + ANGLE_STEP);
        } else {
          this.speed = Math.max(this.speed, FOOT_SPEED);
        }
        break;
      case 'ArrowLeft':
        if (this.angle > MIN_ANGLE) {
          this.setTargetAngle(this.targetAngle - ANGLE_STEP);
        } else {
          this.speed = Math.max(this.speed, FOOT_SPEED);
        }
        break;
      case 'ArrowDown':
        this.setTargetAngle(0);
    }
  };

  readonly onBeforeRender = ({ frameDelta }: FrameEventData) => {
    const secondsElapsed = frameDelta / 1000;
    const { x, y } = this;
    const turnSpeedLimit = MAX_TURN_SPEED * secondsElapsed;
    const angle =
      this.angle =
      clamp(
        this.angle - turnSpeedLimit,
        easeTo(this.angle, this.targetAngle, TURN_SPEED, 0.01),
        this.angle + turnSpeedLimit
      );
    
    const xComponent = Math.sin(angle);
    const yComponent = Math.cos(angle);
    const targetSpeed = (yComponent ** 2) * SLOPE;
    this.speed = easeTo(this.speed, targetSpeed, ACCELERATION, 1);
        
    const frameInd = angle === MIN_ANGLE ? 0 :
      angle === MAX_ANGLE ? 6 :
        Math.round(xComponent * 2 + 3); // 1-5
    this.setCurrentFrame(turningFrames[frameInd]);
    
    this.setPos(
      x + xComponent * this.speed * secondsElapsed,
      y + yComponent * this.speed * secondsElapsed
    );
  };

  setTargetAngle(rads: number) {
    this.targetAngle = clamp(MIN_ANGLE, rads, MAX_ANGLE);
  }

  debugText(): string {
    const str = super.debugText();
    return `${str}, spd: ${this.speed.toFixed(1)}, ang: ${(this.angle / Math.PI * 180).toFixed(1)}`;
  }
}
