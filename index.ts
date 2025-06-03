import { Stage } from './stage.js';
import { Skiier, MAX_SPEED, SkiierState } from './skiier.js';
import { Obstacle } from './obstacles.js';
import { clamp, randomInt, getY } from './lib.js';
import { insertSortedBy } from './array_lib.js';
import { Decoration } from './decoration.js';
import { Robot, RobotState } from './robot.js';
import { TextAlign, TextSprite } from './text_sprite.js';
import { FrameEventData } from './events.js';

async function main() {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 960;
  document.body.appendChild(canvas);
  const stage = new SkiDear(canvas);
  await stage.init();

  stage.start();
  Object.assign(window, { stage, skiier: stage.skiier });
}

const ROBOT_TRIGGER = {
  headstart: 200,
  offset: 200,
}

// 1 obstacle per X area. Lower = more dense
const OBSTACLE_DENSITY = 30000;
const fontFamily = 'Press Start 2P';

class SkiDear extends Stage {
  skiier!: Skiier;
  obstacles: Obstacle[] = [];
  haveYouSeenThis!: Decoration;
  scoreSprite!: TextSprite;
  robot!: Robot;

  private targetObstacleCount = 0;

  async init(): Promise<void> {
    this.setBackground('#ffffff');
    const skiier = this.skiier = new Skiier();
    // skiier.debug = true;
    this.addSprite(skiier);

    const robot = this.robot = new Robot(skiier);
    robot.setPos(150, -50);
    this.addSprite(robot);

    this.setViewport(0, this.skiier.y + this.height * 0.2);

    const numObsts =
      this.targetObstacleCount =
      Math.round((this.width * this.height) / OBSTACLE_DENSITY);

    // const top = this.getViewportEdge('top');
    const right = this.getViewportEdge('right');
    const bottom = this.getViewportEdge('bottom');
    const left = this.getViewportEdge('left');
    for (let i = 0; i <= Math.floor(numObsts / 2); ++i) {
      const obst = new Obstacle();
      // obst.setPos(randomInt(left, right), randomInt(top, bottom + 4 * this.height));
      obst.setPos(randomInt(left, right), randomInt(50, bottom));
      this.addSprite(obst);
      insertSortedBy(this.obstacles, obst, getY);
    }

    const haveYouSeenThis = this.haveYouSeenThis = new Decoration('haveYouSeenThis');
    haveYouSeenThis.setPos(-100, -100, 50);
    this.addSprite(haveYouSeenThis);

    const titleSprite = new Decoration('title');
    titleSprite.setPos(100, -100, 50);
    this.addSprite(titleSprite);

    const titleText = new TextSprite({
      text: 'LOBSTER CAR SKI FREE',
      fontFamily,
      fontSize: 48,
      align: TextAlign.CENTER,
      color: '#fb551c'
    });
    titleText.setPos(0, -50);
    this.addSprite(titleText);

    this.setupChromeSprites();
    await this.loadFont();
  }

  private setupChromeSprites() {
    const padding = 20;
    const {width} = this;

    const lobsterLogo = new Decoration('lobsterSki');
    const lw = lobsterLogo.width * lobsterLogo.scale;
    const lh = lobsterLogo.height * lobsterLogo.scale;
    const lx = width - (lw / 2) - padding;
    const ly = (lh / 2) + padding;
    lobsterLogo.setPos(lx, ly);

    const score = this.scoreSprite = new TextSprite({
      fontFamily,
      fontSize: 18,
      color: '#000',
      align: TextAlign.RIGHT,
    });
    score.setPos(width - padding, ly + lh / 2 + padding + 9 /* half fontSize */);

    this.chromeSprites.push(
      score,
      lobsterLogo,
    );
  }

  readonly onBeforeRenderChrome = (event: FrameEventData): void => {
    this.scoreSprite.text = `Score: ${this.getScore()}`;
  };

  private async loadFont() {
    try {
      const font = await new FontFace(
        'Press Start 2P',
        'url(https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2)'
        // "url('https://fonts.googleapis.com/css2?family=Press+Start+2P')"
      ).load();

      document.fonts.add(font);
    } catch {}
  }

  onPrepareFrame = () => {
    const { skiier } = this;
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
    if (this.robot.state === RobotState.WAITING && this.getScore() > ROBOT_TRIGGER.headstart) {
      console.log('GO ROBOT');
      this.robot.setPos(
        skiier.x,
        skiier.y - ROBOT_TRIGGER.offset,
      );

      this.robot.setState(RobotState.RUNNING);
    }
  };

  getScore(): number {
    return Math.round(this.skiier.y / 100) * 10;
  }

  onBeforeRender = () => {
    this.adjustViewport();
    this.addObstacles();
  };

  private adjustViewport() {
    const speedPct = (this.skiier.speed * Math.cos(this.skiier.angle)) / MAX_SPEED;
    const lag = Math.cos(speedPct * Math.PI / 2) * -0.2
              + (this.robot.state === RobotState.RUNNING ? 0.2 : 0.3);
    // this.targetZoom = 1 - (speedPct * 0.5);
    this.animateViewport(
      clamp(-this.width, this.skiier.x / 1.5, this.width),
      Math.max(this.viewportY, this.skiier.y + this.height * lag)
    );
  }

  private addObstacles() {
    let popped: Obstacle[] | undefined;
    const bottom = this.getViewportEdge('bottom');
    const left = this.getViewportEdge('left');
    const buffer = 0.2;
    const { width, height } = this;

    if (this.distanceOutsideViewportEdge('top', this.haveYouSeenThis.y) > 50) {
      this.haveYouSeenThis.setPos(
        randomInt(left - width * buffer, left + width * (1 + buffer)),
        randomInt(bottom + 50, bottom + height),
      );
    }

    while (this.obstacles.length && this.distanceOutsideViewportEdge('top', this.obstacles[0].y) > 50) {
      const obst = this.obstacles.shift()!;
      popped ??= [];
      popped.push(obst);
      this.removeSprite(obst);
    }
    if (this.obstacles.length < this.targetObstacleCount) {
      while (this.obstacles.length < this.targetObstacleCount) {
        const tree = popped?.pop() ?? new Obstacle();
        tree.setPos(
          randomInt(left - width * buffer, left + width * (1 + buffer)),
          randomInt(bottom + 50, bottom + height),
        );
        insertSortedBy(this.obstacles, tree, getY);
        this.addSprite(tree);
      }
    }
  }
}

main();