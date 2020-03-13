import Texture, {TextureSourceCallback, TextureSourceLoader} from "../../tree/Texture";

export default class TextTexture extends Texture {

    private settings : Partial<TextSettings> = {};
    
    get text() {
        return this.settings.text;
    }

    set text(v) {
        if (this.settings.text !== v) {
            this.settings.text = "" + v;
            this._changed();
        }
    }

    get fontStyle() {
        return this.settings.fontStyle;
    }

    set fontStyle(v) {
        if (this.settings.fontStyle !== v) {
            this.settings.fontStyle = v;
            this._changed();
        }
    }

    get fontSize() {
        return this.settings.fontSize;
    }

    set fontSize(v) {
        if (this.settings.fontSize !== v) {
            this.settings.fontSize = v;
            this._changed();
        }
    }

    get fontFace() {
        return this.settings.fontFace;
    }

    set fontFace(v) {
        if (this.settings.fontFace !== v) {
            this.settings.fontFace = v;
            this._changed();
        }
    }

    get wordWrap() {
        return this.settings.wordWrap;
    }

    set wordWrap(v) {
        if (this.settings.wordWrap !== v) {
            this.settings.wordWrap = v;
            this._changed();
        }
    }

    get wordWrapWidth() {
        return this.settings.wordWrapWidth;
    }

    set wordWrapWidth(v) {
        if (this.settings.wordWrapWidth !== v) {
            this.settings.wordWrapWidth = v;
            this._changed();
        }
    }

    get lineHeight() {
        return this.settings.lineHeight;
    }

    set lineHeight(v) {
        if (this.settings.lineHeight !== v) {
            this.settings.lineHeight = v;
            this._changed();
        }
    }

    get textBaseline() {
        return this.settings.textBaseline;
    }

    set textBaseline(v) {
        if (this.settings.textBaseline !== v) {
            this.settings.textBaseline = v;
            this._changed();
        }
    }

    get textAlign() {
        return this.settings.textAlign;
    }

    set textAlign(v) {
        if (this.settings.textAlign !== v) {
            this.settings.textAlign = v;
            this._changed();
        }
    }

    get offsetY() {
        return this.settings.offsetY;
    }

    set offsetY(v) {
        if (this.settings.offsetY !== v) {
            this.settings.offsetY = v;
            this._changed();
        }
    }

    get maxLines() {
        return this.settings.maxLines;
    }

    set maxLines(v) {
        if (this.settings.maxLines !== v) {
            this.settings.maxLines = v;
            this._changed();
        }
    }

    get textColor() {
        return this.settings.textColor;
    }

    set textColor(v) {
        if (this.settings.textColor !== v) {
            this.settings.textColor = v;
            this._changed();
        }
    }

    get shadow() {
        return this.settings.shadow;
    }

    set shadow(v) {
        if (this.settings.shadow !== v) {
            this.settings.shadow = v;
            this._changed();
        }
    }

    get shadowColor() {
        return this.settings.shadowColor;
    }

    set shadowColor(v) {
        if (this.settings.shadowColor !== v) {
            this.settings.shadowColor = v;
            this._changed();
        }
    }

    get shadowOffsetX() {
        return this.settings.shadowOffsetX;
    }

    set shadowOffsetX(v) {
        if (this.settings.shadowOffsetX !== v) {
            this.settings.shadowOffsetX = v;
            this._changed();
        }
    }

    get shadowOffsetY() {
        return this.settings.shadowOffsetY;
    }

    set shadowOffsetY(v) {
        if (this.settings.shadowOffsetY !== v) {
            this.settings.shadowOffsetY = v;
            this._changed();
        }
    }

    get shadowBlur() {
        return this.settings.shadowBlur;
    }

    set shadowBlur(v) {
        if (this.settings.shadowBlur !== v) {
            this.settings.shadowBlur = v;
            this._changed();
        }
    }

    get highlight() {
        return this.settings.highlight;
    }

    set highlight(v) {
        if (this.settings.highlight !== v) {
            this.settings.highlight = v;
            this._changed();
        }
    }

    get highlightHeight() {
        return this.settings.highlightHeight;
    }

    set highlightHeight(v) {
        if (this.settings.highlightHeight !== v) {
            this.settings.highlightHeight = v;
            this._changed();
        }
    }

    get highlightColor() {
        return this.settings.highlightColor;
    }

    set highlightColor(v) {
        if (this.settings.highlightColor !== v) {
            this.settings.highlightColor = v;
            this._changed();
        }
    }

    get highlightOffset() {
        return this.settings.highlightOffset;
    }

    set highlightOffset(v) {
        if (this.settings.highlightOffset !== v) {
            this.settings.highlightOffset = v;
            this._changed();
        }
    }

    get highlightPaddingLeft() {
        return this.settings.highlightPaddingLeft;
    }

    set highlightPaddingLeft(v) {
        if (this.settings.highlightPaddingLeft !== v) {
            this.settings.highlightPaddingLeft = v;
            this._changed();
        }
    }

    get highlightPaddingRight() {
        return this.settings.highlightPaddingRight;
    }

    set highlightPaddingRight(v) {
        if (this.settings.highlightPaddingRight !== v) {
            this.settings.highlightPaddingRight = v;
            this._changed();
        }
    }

    get cutSx() {
        return this.settings.cutSx;
    }

    set cutSx(v) {
        if (this.settings.cutSx !== v) {
            this.settings.cutSx = v;
            this._changed();
        }
    }

    get cutEx() {
        return this.settings.cutEx;
    }

    set cutEx(v) {
        if (this.settings.cutEx !== v) {
            this.settings.cutEx = v;
            this._changed();
        }
    }

    get cutSy() {
        return this.settings.cutSy;
    }

    set cutSy(v) {
        if (this.settings.cutSy !== v) {
            this.settings.cutSy = v;
            this._changed();
        }
    }

    get cutEy() {
        return this.settings.cutEy;
    }

    set cutEy(v) {
        if (this.settings.cutEy !== v) {
            this.settings.cutEy = v;
            this._changed();
        }
    }

    get precision() {
        return super.precision;
    }

    set precision(v) {
        // We actually draw differently when the precision changes.
        if (this.precision !== v) {
            super.precision = v;
            this._changed();
        }
    }

    _getIsValid() {
        return !!this.text;
    }

    static getHash(obj: any) : string {
        if (Array.isArray(obj)) {
            return obj.map(o => TextTexture.getHash(o)).join(",");
        } else if (Utils.isObjectLiteral(obj)) {
            const parts = [];
            for (let [key, value] of Object.entries(obj)) {
                parts.push(key + '=' + TextTexture.getHash(value));
            }
            return parts.join("|");
        } else {
            return "" + obj;
        }
    }

    _getLookupId() {
        const id = "TX$" + TextTexture.getHash(this.settings) + "|" + this.precision;
        return id;
    }

    protected _getSourceLoader() : TextureSourceLoader {
        const args = this.cloneArgs();

        return (cb: TextureSourceCallback) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            const renderer = new TextTextureRenderer(this.stage, canvas, args);
            const p = renderer.draw();

            p.then(() => {
                cb(
                    undefined,
                    Object.assign(
                        { renderInfo: renderer.renderInfo },
                        this.stage.platform.getTextureOptionsForDrawingCanvas(canvas)
                    )
                );
            }).catch(err => {
                cb(err);
            });
        };
    }

    getNonDefaults() {
        const nonDefaults = super.getNonDefaults();
        for (let [key, value] of Object.entries(this.settings)) {
            nonDefaults[key] = value;
        }
        return nonDefaults;
    }

    cloneArgs() {
        return Utils.clone(this.settings);
    }
}

import TextTextureRenderer from "./TextTextureRenderer";
import {TextSettings} from "./TextSettings";
import Utils from "../../tree/Utils";
