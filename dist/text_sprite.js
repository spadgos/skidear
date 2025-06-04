import { Sprite } from './sprite.js';
export var TextAlign;
(function (TextAlign) {
    TextAlign[TextAlign["LEFT"] = 0] = "LEFT";
    TextAlign[TextAlign["CENTER"] = 1] = "CENTER";
    TextAlign[TextAlign["RIGHT"] = 2] = "RIGHT";
})(TextAlign || (TextAlign = {}));
const { LEFT, CENTER, RIGHT } = TextAlign;
const DEFAULT_ATTRIBUTES = {
    align: LEFT,
    text: '',
    color: '#000',
    fontSize: 12,
    fontFamily: 'sans-serif',
};
export class TextSprite extends Sprite {
    noClip = true;
    align;
    fontFamily;
    fontSize; // px
    color;
    lines;
    constructor(attrs = {}) {
        super();
        const { align, fontFamily, fontSize, color, text } = {
            ...DEFAULT_ATTRIBUTES,
            ...attrs
        };
        this.align = align;
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;
        this.color = color;
        this.setText(text);
    }
    setText(text) {
        this.lines = text.split('\n');
    }
    static createFactory(defaults) {
        return (text, attrs = {}) => {
            return new TextSprite({ ...defaults, ...attrs, text });
        };
    }
    drawInner(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `${this.fontSize}px "${this.fontFamily}"`;
        for (let i = 0; i < this.lines.length; ++i) {
            const text = this.lines[i];
            const { width } = ctx.measureText(text);
            const xOffset = this.align === LEFT ? 0
                : this.align === RIGHT ? -width
                    : -width / 2;
            ctx.save();
            ctx.translate(xOffset, i * this.fontSize * 1.1);
            ctx.fillText(text, 0, 0);
            ctx.restore();
        }
        ctx.restore();
    }
}
//# sourceMappingURL=text_sprite.js.map