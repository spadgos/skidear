import {Sprite} from './sprite.js';

export enum TextAlign {
  LEFT,
  CENTER,
  RIGHT,
}

const {LEFT, CENTER, RIGHT} = TextAlign;

interface TextAttributes {
  align?: TextAlign;
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

const DEFAULT_ATTRIBUTES: Required<TextAttributes> = {
  align: LEFT,
  text: '',
  color: '#000',
  fontSize: 12,
  fontFamily: 'sans-serif',
};

export class TextSprite extends Sprite {
  noClip = true;

  align: TextAlign;
  fontFamily: string;
  fontSize: number; // px
  color: string;
  text: string;

  constructor(attrs: TextAttributes = {}) {
    super();

    const {align, fontFamily, fontSize, color, text} = {
      ...DEFAULT_ATTRIBUTES,
      ...attrs
    };
    this.align = align;
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.color = color;
    this.text = text;
  }

  protected override drawInner(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
    const {width} = ctx.measureText(this.text);
    const xOffset = this.align === LEFT ? 0
                  : this.align === RIGHT ? -width
                  : -width / 2;
    ctx.translate(xOffset, 0);
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}