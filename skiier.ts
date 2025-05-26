import { FramesMap, ImageSprite } from './sprite.js';
import { clamp, easeTo } from './lib.js';
import { loadImageAndTransparentize } from "./canvas_lib.js";
import { FrameEventData, KeyEventData, Listener } from './events.js';
import { Obstacle } from './obstacles.js';

const SLOPE = 600; // 900;
const ACCELERATION = 0.015; // 0.02; // 0-1
const DECELERATION = 0.05;
const TURN_SPEED = 0.2; // 0-1
const MAX_TURN_SPEED = Math.PI; // radians/sec
const SPRITE_SHEET = './images/ski-free-edit6.png';
// When hitting a jump, the z speed will be set according to this angle and the current speed
const RAMP_ANGLE = Math.PI / 18; // 15 deg
const GRAVITY = 98; // m/s/s

export enum SkiierState {
  SKIING,
  CRASHED,
  AIRBORNE,
}

// The original sprites
// const SPRITE_SHEET = './images/sprite-sheet.png';
// const frames: FramesMap = new Map([
//   ['left', [[34, 6, 10, 40], [-10, 10, 12, 17]]],
//   ['hard-left', [[58, 6, 34, 40], [-11, 5, 9, 17]]],
//   ['slight-left', [[76, 6, 58, 40], [-7, 0, 9, 17]]],
//   ['straight', [[77, 6, 92, 40], [-6, 0, 6, 16]]],
//   ['slight-right', [[58, 6, 76, 40], [-9, 0, 7, 17]]],
//   ['hard-right', [[34, 6, 58, 40], [-9, 5, 11, 17]]],
//   ['right', [[10, 6, 34, 40], [-12, 10, 10, 17]]],
//   ['air', [[93, 6, 127, 40], [-17, 10, 14, 17]]],
//   ['crashed', [[288, 6, 320, 40], [-16, 10, 16, 17]]],
// ]);

const frames: FramesMap = new Map([
  ['left', [[240, 230, 4, 410], [-110, 25, 80, 37]]],
  ['hard-left', [[480, 230, 246, 410], [-105, 25, 0, 42]]],
  ['slight-left', [[720, 230, 530, 410], [-80, 50, 0, 70]]],
  ['straight', [[720, 200, 830, 410], [-50, 70, 50, 80]]],
  ['slight-right', [[530, 230, 720, 410], [80, 50, 0, 70]]],
  ['hard-right', [[246, 230, 480, 410], [0, 25, 105, 42]]],
  ['right', [[4, 230, 240, 410], [-80, 53, 110, 63]]],
  ['air', [[830, 180, 1000, 390], [-50, 70, 50, 80]]],
  ['crashed', [[1720, 230, 1850, 410], [-16, 10, 16, 17]]],
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

const ANGLE_STEP = Math.PI / 6;
const MIN_ANGLE = -Math.PI / 2;
const MAX_ANGLE = Math.PI / 2;
const FOOT_SPEED = 100;

export const MAX_SPEED = SLOPE;

export class Skiier extends ImageSprite {
  speed: number = 0;
  zSpeed: number = 0;

  angle: number = MIN_ANGLE;
  private targetAngle = this.angle;

  state: SkiierState = SkiierState.SKIING;

  constructor() {
    super(loadImageAndTransparentize(SPRITE_SHEET));
    this.setFrames(frames);
    // this.debug = true;
    // this.scale = 0.25;
  }

  onCollision(other: Obstacle) {
    if (this.state !== SkiierState.SKIING) return;
    const impact = other.getImpact();
    if (impact.crash) {
      // move in front of whatever we crashed into
      this.setPos(this.x, other.y + 0.001, this.z);
      this.setState(SkiierState.CRASHED);
    } else if (impact.jump) {
      this.setState(SkiierState.AIRBORNE);
    } else if (impact.maxSpeed != null) {
      this.speed = Math.min(this.speed, MAX_SPEED * impact.maxSpeed);
    }
  }

  setState(state: SkiierState) {
    if (this.state === state) return;
    const old = this.state;
    this.state = state;
    this.onStateChange(state);
  }

  private onStateChange(newState: SkiierState) {
    switch (newState) {
      case SkiierState.AIRBORNE:
        this.speed *= Math.cos(this.angle);
        this.angle = this.targetAngle = 0;
        this.zSpeed = this.speed * Math.sin(RAMP_ANGLE);
        this.noClip = true;
        break;
      case SkiierState.SKIING:
        this.noClip = false;
        break;
      case SkiierState.CRASHED:
        this.noClip = true;
        this.speed = this.zSpeed = 0;
        this.angle = this.targetAngle = MIN_ANGLE;
        break;
    }
    // todo
    // queue future events
  }

  readonly onKeyDown: Listener<KeyEventData> = ({ key }) => {
    if (key === 'd') {
      this.debug = !this.debug;
      return false;
    }
    switch (this.state) {
      case SkiierState.SKIING:
        return this.keyActionsSkiing(key);
      case SkiierState.CRASHED:
        return this.keyActionsCrashed(key);
      case SkiierState.AIRBORNE:
        return this.keyActionsAirborne(key);
    }
  };

  private keyActionsSkiing(key: string): boolean | void {
    switch (key) {
      case 'ArrowRight':
        if (this.angle < MAX_ANGLE) {
          this.setTargetAngle(this.targetAngle + ANGLE_STEP);
        } else {
          this.speed = Math.max(this.speed, FOOT_SPEED);
        }
        return false;
      case 'ArrowLeft':
        if (this.angle > MIN_ANGLE) {
          this.setTargetAngle(this.targetAngle - ANGLE_STEP);
        } else {
          this.speed = Math.max(this.speed, FOOT_SPEED);
        }
        return false;
      case 'ArrowDown':
        this.setTargetAngle(0);
        return false;
    }
  }

  private keyActionsCrashed(key: string) {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowDown':
        return false;
    }
  }

  private keyActionsAirborne(key: string) {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowDown':
        return false;
    }
  }

  readonly onBeforeRender = ({ frameDelta }: FrameEventData) => {
    if (this.state === SkiierState.CRASHED) {
      this.setCurrentFrame('crashed');
      return;
    }
    const secondsElapsed = frameDelta / 1000;
    const { x, y, z, state } = this;

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
    this.speed = easeTo(
      this.speed,
      targetSpeed,
      this.speed < targetSpeed ? ACCELERATION : DECELERATION,
      1
    );
    let newZ = z;
    switch (state) {
      case SkiierState.SKIING:
        const frameInd = angle === MIN_ANGLE ? 0 :
          angle === MAX_ANGLE ? 6 :
            Math.round(xComponent * 2 + 3); // 1-5
        this.setCurrentFrame(turningFrames[frameInd]);
        break;
      case SkiierState.AIRBORNE:
        newZ = z + this.zSpeed * secondsElapsed;
        this.zSpeed -= GRAVITY * secondsElapsed;
        this.setCurrentFrame('air');
        break;
    }

    this.setPos(
      x + xComponent * this.speed * secondsElapsed,
      y + yComponent * this.speed * secondsElapsed,
      newZ,
    );
  };

  setTargetAngle(rads: number) {
    this.targetAngle = clamp(MIN_ANGLE, rads, MAX_ANGLE);
  }

  debugText(): string {
    const str = super.debugText();
    const speed = this.speed.toFixed(1);
    const angle = (this.angle / Math.PI * 180).toFixed(1);
    const zStuff = this.state !== SkiierState.AIRBORNE ? '' :
      `, z: ${this.z.toFixed(1)}, zSpd: ${this.zSpeed.toFixed(1)}`;
    return `${str}, spd: ${speed}, ang: ${angle}${zStuff}`;
  }
}
