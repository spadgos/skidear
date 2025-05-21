import { Stage } from './stage.js';
import { Skiier, MAX_SPEED, SkiierState } from './skiier.js';
import { Obstacle } from './obstacles.js';
import { clamp, randomInt, getY } from './lib.js';
import { insertSortedBy } from './array_lib.js';

async function main() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = `${canvas.width * 2}px`;
  canvas.style.height = `${canvas.height * 2}px`;
  document.body.appendChild(canvas);
  const stage = new SkiDear(canvas);
  await stage.init();

  stage.start();
  Object.assign(window, { stage, skiier: stage.skiier });
}

// 1 obstacle per X area. Lower = more dense
const OBSTACLE_DENSITY = 20000;

class SkiDear extends Stage {
  skiier!: Skiier;
  obstacles: Obstacle[] = [];
  private targetObstacleCount = 0;

  async init(): Promise<void> {
    this.setBackground('#ffffff');
    const skiier = new Skiier();
    // skiier.debug = true;
    this.skiier = skiier;
    this.addSprite(skiier);

    this.setViewport(0, this.skiier.y + this.height * 0.2);

    const numObsts =
      this.targetObstacleCount =
      Math.round((this.width * this.height) / OBSTACLE_DENSITY);

    const top = this.getViewportEdge('top');
    const right = this.getViewportEdge('right');
    const bottom = this.getViewportEdge('bottom');
    const left = this.getViewportEdge('left');
    for (let i = 0; i <= Math.floor(numObsts / 2); ++i) {
      const obst = new Obstacle();
      // obst.setPos(randomInt(left, right), randomInt(top, bottom + 4 * this.height));
      obst.setPos(randomInt(left, right), randomInt(top, bottom));
      this.addSprite(obst);
      insertSortedBy(this.obstacles, obst, getY);
    }
  }

  onPrepareFrame = () => {
    const {skiier} = this;
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
  };

  onBeforeRender = () => {
    this.adjustViewport();
    this.addObstacles();
  };

  private adjustViewport() {
    const speedPct = (this.skiier.speed * Math.cos(this.skiier.angle)) / MAX_SPEED;
    const lag = Math.cos(speedPct * Math.PI / 2) * -0.2 + 0.4;
    // this.targetZoom = 1 - (speedPct * 0.5);
    this.animateViewport(
      clamp(-this.width, this.skiier.x / 1.5, this.width),
      Math.max(this.viewportY, this.skiier.y + this.height * lag)
    );
  }

  private addObstacles() {
    let popped: Obstacle[] | undefined;
    while (this.obstacles.length && this.distanceOutsideViewportEdge('top', this.obstacles[0].y) > 50) {
      const tree = this.obstacles.shift()!;
      popped ??= [];
      popped.push(tree);
      this.removeSprite(tree);
    }
    if (this.obstacles.length < this.targetObstacleCount) {
      const bottom = this.getViewportEdge('bottom');
      const left = this.getViewportEdge('left');
      const { width, height } = this;
      const buffer = 0.2;
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