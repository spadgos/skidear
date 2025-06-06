import { ImageSprite } from './sprite.js';
import { loadImage } from "./canvas_lib.js";
import { MAX_SPEED as SKIIER_MAX_SPEED, SkiierState } from './skiier.js';
import { getAngleBetweenPoints, getDistance } from './lib.js';
const SPRITE_SHEET = './images/ski-free-edit_2x9.png';
const frames = new Map([
    ['run-1', [[16, 320, 90, 414]]],
    ['run-2', [[91, 320, 150, 414]]],
    ['run-3', [[151, 320, 200, 414]]],
    ['run-4', [[201, 320, 268, 414]]],
    ['eat-1', [[890, 190, 1030, 320]]],
    ['eat-2', [[1030, 190, 1140, 320]]],
    ['eat-3', [[1150, 190, 1230, 320]]],
    ['eat-4', [[1230, 190, 1310, 320]]],
    ['eat-5', [[1308, 190, 1384, 320]]],
    ['eat-6', [[1379, 190, 1455, 320]]],
]);
export var RobotState;
(function (RobotState) {
    RobotState[RobotState["WAITING"] = 0] = "WAITING";
    RobotState[RobotState["RUNNING"] = 1] = "RUNNING";
    RobotState[RobotState["EATING"] = 2] = "EATING";
})(RobotState || (RobotState = {}));
const { WAITING, RUNNING, EATING } = RobotState;
function* times(n, ...frames) {
    for (let i = 0; i < n; i++) {
        yield* frames;
    }
}
const animations = new Map([
    ['running', {
            frames: ['run-3', 'run-4'],
            frameRate: 6,
            repeat: true
        }],
    ['eating', {
            frames: [
                ...times(3, 'eat-1'),
                ...times(3, 'eat-2'),
                ...times(3, 'eat-3'),
                ...times(3, 'eat-4'),
                ...times(6, 'eat-5', 'eat-6'),
            ],
            frameRate: 8,
            repeat: false,
        }],
    ['celebrating', {
            frames: ['run-1', 'run-2'],
            frameRate: 6,
            repeat: true,
        }],
]);
const RUNNING_SPEED = SKIIER_MAX_SPEED;
export class Robot extends ImageSprite {
    state = WAITING;
    skiier;
    onSkiierCaught;
    constructor(options) {
        super(loadImage(SPRITE_SHEET));
        this.setFrames(frames);
        this.setAnimations(animations);
        this.skiier = options.skiier;
        this.onSkiierCaught = options.onSkiierCaught;
    }
    setState(state) {
        if (this.state === state)
            return;
        this.state = state;
        switch (state) {
            case RUNNING:
                this.startAnimation('running');
                break;
            case EATING:
                this.startAnimation('eating');
                break;
            case WAITING:
                this.clearAnimation();
                break;
        }
    }
    onBeforeRender(event) {
        super.onBeforeRender(event);
        const { frameDelta } = event;
        const secondsElapsed = frameDelta / 1000;
        if (this.state !== RUNNING)
            return;
        const { x, y, skiier } = this;
        const distance = getDistance(this, skiier);
        if (skiier.state === SkiierState.CRASHED && distance < 100) {
            this.startAnimation('celebrating');
            return;
        }
        const angle = getAngleBetweenPoints(this, skiier);
        let amount = RUNNING_SPEED * secondsElapsed * (distance < 100 ? 0.9 : 1);
        if (amount > distance) {
            amount = distance;
            this.onSkiierCaught();
        }
        this.setPos(x + Math.cos(angle) * amount, y + Math.sin(angle) * amount);
        this.flip = skiier.x < x;
    }
}
//# sourceMappingURL=robot.js.map