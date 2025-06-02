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
const SPRITE_SHEET = './images/ski-free-edit_2x7.png';
// When hitting a jump, the z speed will be set according to this angle and the current speed
const RAMP_ANGLE = Math.PI / 18; // 15 deg
const GRAVITY = 98; // m/s/s

export enum SkiierState {
  SKIING,
  CRASHED,
  AIRBORNE,
}

const frames: FramesMap = new Map([
  ['left', [[120, 115, 2, 205], [-55, 12.5, 40, 18.5]]],
  ['hard-left', [[240, 115, 123, 205], [-52.5, 12.5, 0, 21]]],
  ['slight-left', [[360, 115, 265, 205], [-40, 25, 0, 35]]],
  ['straight', [[360, 100, 415, 205], [-25, 35, 25, 40]]],
  ['slight-right', [[265, 115, 360, 205], [40, 25, 0, 35]]],
  ['hard-right', [[123, 115, 240, 205], [0, 12.5, 52.5, 21]]],
  ['right', [[2, 115, 120, 205], [-40, 26.5, 55, 31.5]]],
  ['air', [[415, 90, 500, 195], [-25, 35, 25, 40]]],
  ['crashed', [[860, 115, 925, 205], [-8, 5, 8, 8.5]]],
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
