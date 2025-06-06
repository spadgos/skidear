import { Stage } from './stage.js';
import { Skiier, MAX_SPEED, SkiierState } from './skiier.js';
import { Obstacle } from './obstacles.js';
import { clamp, randomInt, getY, getDistance } from './lib.js';
import { insertSortedBy } from './array_lib.js';
import { Decoration } from './decoration.js';
import { Robot, RobotState } from './robot.js';
import { TextAlign, TextSprite } from './text_sprite.js';
import { applyUserInputTo, getHighScoresWithPlaceholder, isValidHighScore, setHighScores } from './high_scores.js';
async function main() {
    const canvas = document.createElement('canvas');
    // canvas.width = 1280;
    // canvas.height = 960;
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;
    document.body.appendChild(canvas);
    async function newGame() {
        const stage = new SkiDear(canvas, {
            onRestart: () => {
                stage.stop();
                newGame();
            }
        });
        await stage.init();
        stage.start();
    }
    newGame();
}
const ROBOT_TRIGGER = {
    // how far before the robot starts chasing
    headstart: 200,
    // how far behind it starts
    offset: 200,
};
// 1 obstacle per X area. Lower = more dense
const OBSTACLE_DENSITY = 30000;
const fontFamily = 'Press Start 2P';
const createTitleText = TextSprite.createFactory({
    fontFamily,
    fontSize: 48,
    align: TextAlign.CENTER,
    color: '#fb551c'
});
const createBodyText = TextSprite.createFactory({
    fontFamily,
    fontSize: 18,
    color: '#000',
});
class SkiDear extends Stage {
    skiier;
    obstacles = [];
    haveYouSeenThis;
    scoreSprite;
    robot;
    playing = true;
    // Set to a value when entering your name for the high scores
    scoreInput;
    highScores;
    scoreInputSprite;
    targetObstacleCount = 0;
    onRestart;
    constructor(canvas, options) {
        super(canvas);
        this.onRestart = options.onRestart;
    }
    async init() {
        this.setBackground('#ffffff');
        const skiier = this.skiier = new Skiier({
            onStateChange: (newState) => {
                if (newState === SkiierState.CRASHED) {
                    this.beginGameOver(1000);
                }
                else if (newState === SkiierState.EATEN) {
                    this.beginGameOver(3000); // wait for the robot animation
                }
            }
        });
        this.addSprite(skiier);
        const robot = this.robot = new Robot({
            skiier,
            onSkiierCaught: () => {
                robot.setState(RobotState.EATING);
                skiier.setState(SkiierState.EATEN);
            },
        });
        this.setViewport(0, this.skiier.y + this.height * 0.2);
        const numObsts = this.targetObstacleCount =
            Math.round((this.width * this.height) / OBSTACLE_DENSITY);
        const top = this.getViewportEdge('top');
        const right = Math.ceil(this.getViewportEdge('right'));
        const bottom = Math.ceil(this.getViewportEdge('bottom'));
        const left = Math.floor(this.getViewportEdge('left'));
        const obstaclesArea = [left, 50, right, bottom];
        for (let i = 0; i <= Math.floor(numObsts / 2); ++i) {
            const obst = new Obstacle();
            const pos = this.pickRandomlyInAreaButNotCloseToOtherObstacles(obstaclesArea);
            obst.setPos(pos.x, pos.y);
            this.addSprite(obst);
            insertSortedBy(this.obstacles, obst, getY);
        }
        const haveYouSeenThis = this.haveYouSeenThis = new Decoration('haveYouSeenThis');
        haveYouSeenThis.setPos(randomInt(-500, 500), 1000, 50);
        this.addSprite(haveYouSeenThis);
        // const titleSprite = new Decoration('title');
        // titleSprite.setPos(100, -100, 50);
        // this.addSprite(titleSprite);
        const titleText = createTitleText('LOBSTER CAR SKI FREE');
        titleText.setPos(0, top + 180);
        this.addSprite(titleText);
        const instructions = createBodyText('Arrow keys to steer\n'
            + 'Watch out for the robot\n'
            + 'Use the jumps to get away quicker!', { align: TextAlign.CENTER });
        instructions.setPos(0, top + 210);
        this.addSprite(instructions);
        const hbs = createBodyText('Happy Birthday Sam!!', { align: TextAlign.CENTER, color: '#fb551c', fontSize: 24 });
        hbs.setPos(0, top + 290);
        this.addSprite(hbs);
        this.setupChromeSprites();
        await this.loadFont();
        this.playing = true;
    }
    setupChromeSprites() {
        const padding = 20;
        const { width } = this;
        const lobsterLogo = new Decoration('lobsterSki');
        const lw = lobsterLogo.width * lobsterLogo.scale;
        const lh = lobsterLogo.height * lobsterLogo.scale;
        const lx = width - (lw / 2) - padding;
        const ly = (lh / 2) + padding;
        lobsterLogo.setPos(lx, ly);
        const score = this.scoreSprite = createBodyText('', {
            align: TextAlign.RIGHT,
        });
        score.setPos(width - padding, ly + lh / 2 + padding + 9 /* half fontSize */);
        this.chromeSprites.push(score, lobsterLogo);
    }
    beginGameOver(endScreenDelay) {
        if (!this.playing)
            return;
        this.playing = false;
        this.setTimeout(() => {
            let y = this.height / 2 - 100;
            const x = this.width / 2;
            {
                const message = createTitleText('WELCOME TO YOUR 40s SAM\nTHIS IS WHAT IT\'S LIKE');
                message.setPos(x, y);
                this.chromeSprites.push(message);
            }
            {
                const message = createBodyText('Press space to relive your wasted youth', { align: TextAlign.CENTER });
                message.setPos(x, y += 100);
                this.chromeSprites.push(message);
            }
            y += 50;
            const { scores, yours } = getHighScoresWithPlaceholder(this.getScore());
            this.highScores = scores;
            this.scoreInput = yours;
            for (let i = 0; i < scores.length; ++i) {
                const isYours = scores[i] === yours;
                const color = isYours ? '#fb551c' : '#000';
                const text = createBodyText(this.highScoreToText(scores[i]), { align: TextAlign.CENTER, color });
                text.setPos(x, y += 30);
                this.chromeSprites.push(text);
                if (isYours) {
                    this.scoreInputSprite = text;
                }
            }
        }, endScreenDelay);
    }
    highScoreToText(score) {
        const isYours = score === this.scoreInput;
        const prefix = isYours ? '> ' : '';
        const suffix = isYours ? ' <' : '';
        const name = isYours && score.name.length < 3 ? score.name + '_' : score.name;
        return prefix + name.padEnd(4, ' ') + String(score.score).padStart(6, ' ') + suffix;
    }
    onKeyDown = (event) => {
        if (this.scoreInput && this.highScores && this.scoreInputSprite) {
            const highScore = this.scoreInput;
            switch (event.key) {
                case 'Enter':
                    // check it's 3 chars, etc
                    if (isValidHighScore(highScore)) {
                        setHighScores(this.highScores);
                        this.scoreInput = undefined;
                    }
                    break;
                default:
                    applyUserInputTo(this.scoreInput, event.key);
            }
            this.scoreInputSprite.setText(this.highScoreToText(highScore));
        }
        else if (event.key === ' ' && (this.skiier.state === SkiierState.CRASHED
            || this.skiier.state === SkiierState.EATEN)) {
            this.onRestart();
        }
    };
    onBeforeRenderChrome = () => {
        if (this.playing) {
            this.scoreSprite.setText(`Score: ${this.getScore()}`);
        }
    };
    adjustContextBeforeChrome = (ctx, { timeSinceStart }) => {
        if (this.playing)
            return;
        ctx.translate(this.width / 2, this.height / 2);
        ctx.rotate(Math.sin(timeSinceStart / 2000) * Math.PI / 60);
        const scale = Math.sin(timeSinceStart / 1500) * 0.05 + 1;
        ctx.scale(scale, scale);
        ctx.translate(-this.width / 2, -this.height / 2);
    };
    async loadFont() {
        try {
            const font = await new FontFace('Press Start 2P', 'url(https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2)'
            // "url('https://fonts.googleapis.com/css2?family=Press+Start+2P')"
            ).load();
            document.fonts.add(font);
        }
        catch { }
    }
    onPrepareFrame = () => {
        const { skiier, robot } = this;
        if (skiier.state === SkiierState.AIRBORNE) {
            if (skiier.zSpeed < 0 && skiier.z <= 0) {
                skiier.setState(SkiierState.SKIING);
            }
        }
        if (!skiier.noClip) { // if noClip is true, then nothing will intersect
            // Check for collisions. This is just O(N) for now, but could be improved
            // since obstacles is sorted by Y position
            for (const obst of this.obstacles) {
                if (skiier.intersectsWith(obst)) {
                    skiier.onCollision(obst);
                    break; // I guess?
                }
            }
        }
        if (robot.state === RobotState.WAITING && this.getScore() > ROBOT_TRIGGER.headstart) {
            this.addSprite(robot);
            robot.setPos(this.getViewportEdge('left'), skiier.y - ROBOT_TRIGGER.offset);
            robot.setState(RobotState.RUNNING);
        }
    };
    getScore() {
        return Math.round(this.skiier.y / 100) * 10;
    }
    onBeforeRender = () => {
        this.adjustViewport();
        this.addObstacles();
    };
    adjustViewport() {
        const speedPct = (this.skiier.speed * Math.cos(this.skiier.angle)) / MAX_SPEED;
        const lag = Math.cos(speedPct * Math.PI / 2) * -0.2 + 0.2;
        // this.targetZoom = 1 - (speedPct * 0.5);
        this.animateViewport(clamp(-this.width, this.skiier.x / 1.5, this.width), Math.max(this.viewportY, this.skiier.y + this.height * lag));
    }
    addObstacles() {
        let popped;
        const bottom = this.getViewportEdge('bottom');
        const left = this.getViewportEdge('left');
        const buffer = 0.2;
        const { width, height } = this;
        if (this.distanceOutsideViewportEdge('top', this.haveYouSeenThis.y) > 50) {
            this.haveYouSeenThis.setPos(randomInt(left - width * buffer, left + width * (1 + buffer)), randomInt(bottom + 50, bottom + height));
        }
        while (this.obstacles.length && this.distanceOutsideViewportEdge('top', this.obstacles[0].y) > 50) {
            const obst = this.obstacles.shift();
            popped ??= [];
            popped.push(obst);
            this.removeSprite(obst);
        }
        if (this.obstacles.length < this.targetObstacleCount) {
            const area = [
                Math.floor(left - width * buffer),
                Math.floor(bottom + 50),
                Math.ceil(left + width * (1 + buffer)),
                Math.ceil(bottom + height),
            ];
            while (this.obstacles.length < this.targetObstacleCount) {
                const tree = popped?.pop() ?? new Obstacle();
                const pos = this.pickRandomlyInAreaButNotCloseToOtherObstacles(area);
                tree.setPos(pos.x, pos.y);
                insertSortedBy(this.obstacles, tree, getY);
                this.addSprite(tree);
            }
        }
    }
    pickRandomlyInAreaButNotCloseToOtherObstacles(area) {
        const MIN_DISTANCE = 50;
        let remainingAttempts = 15;
        let tryAgain;
        let candidate;
        do {
            tryAgain = false;
            candidate = randomCoordsInBox(area);
            for (let i = 0; i < this.obstacles.length; ++i) {
                if (getDistance(candidate, this.obstacles[i]) < MIN_DISTANCE) {
                    tryAgain = true;
                    break;
                }
            }
        } while (tryAgain && --remainingAttempts);
        if (remainingAttempts === 0) {
            console.log("COULDN'T FIND ROOM");
        }
        return candidate;
    }
}
function randomCoordsInBox([x1, y1, x2, y2]) {
    return { x: randomInt(x1, x2), y: randomInt(y1, y2) };
}
main();
//# sourceMappingURL=index.js.map