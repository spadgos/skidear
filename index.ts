import { Stage } from './stage.js';
import { Skiier, MAX_SPEED } from './skiier.js';
import { Obstacle } from './obstacles.js';
import { clamp, randomInt, getY } from './lib.js';
import { insertSortedBy } from "./array_lib.js";

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

// 1 tree per X area. Lower = more dense
const TREE_DENSITY = 20000;

class SkiDear extends Stage {
  skiier!: Skiier;
  trees: Obstacle[] = [];
  private targetTreeCount = 0;

  async init(): Promise<void> {
    this.setBackground('#ffffff');
    const skiier = new Skiier();
    skiier.debug = true;

    this.addSkiier(skiier);

    this.setViewport(0, this.skiier.y + this.height * 0.2);

    const numTrees =
      this.targetTreeCount =
      Math.round((this.width * this.height) / TREE_DENSITY);

    const top = this.getViewportEdge('top');
    const right = this.getViewportEdge('right');
    const bottom = this.getViewportEdge('bottom');
    const left = this.getViewportEdge('left');
    for (let i = 0; i <= Math.floor(numTrees / 2); ++i) {
      const tree = new Obstacle();
      tree.setPos(randomInt(left, right), randomInt(top, bottom + 4 * this.height));
      this.addSprite(tree);
      insertSortedBy(this.trees, tree, getY);
    }
  }

  addSkiier(skiier: Skiier) {
    this.skiier = skiier;
    this.addSprite(skiier);
  }

  onBeforeRender = () => {
    this.adjustViewport();
    this.addObstacles();
  };

  private adjustViewport() {
    const speedPct = (this.skiier.speed * Math.cos(this.skiier.angle)) / MAX_SPEED;
    const lag = Math.cos(speedPct * Math.PI / 2) * -0.2 + 0.4;
    this.animateViewport(
      clamp(-this.width, this.skiier.x / 1.5, this.width),
      Math.max(this.viewportY, this.skiier.y + this.height * lag)
    );
  }

  private addObstacles() {
    let popped: Obstacle[] | undefined;
    while (this.trees.length && this.distanceOutsideViewportEdge('top', this.trees[0].y) > 50) {
      const tree = this.trees.shift()!;
      popped ??= [];
      popped.push(tree);
      this.removeSprite(tree);
    }
    if (this.trees.length < this.targetTreeCount) {
      const bottom = this.getViewportEdge('bottom');
      const left = this.getViewportEdge('left');
      const { width, height } = this;
      const buffer = 0.2;
      while (this.trees.length < this.targetTreeCount) {
        const tree = popped?.pop() ?? new Obstacle();
        tree.setPos(
          randomInt(left - width * buffer, left + width * (1 + buffer)),
          randomInt(bottom + 50, bottom + height),
        );
        insertSortedBy(this.trees, tree, getY);
        this.addSprite(tree);
      }
    }
  }
}

main();