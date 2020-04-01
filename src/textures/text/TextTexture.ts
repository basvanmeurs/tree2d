import Texture, { TextureSourceCallback, TextureSourceLoader } from "../../tree/Texture";
import TextTextureRenderer from "./TextTextureRenderer";
import { TextSettings } from "./TextSettings";
import Utils from "../../tree/Utils";
import Stage from "../../tree/Stage";

export default class TextTexture extends Texture {
    private settings: Partial<TextSettings> = {};
    private _text: string = "";

    constructor(stage: Stage) {
        super(stage);
        this.pixelRatio = this.stage.pixelRatio;
    }

    setSettings(settings: Partial<TextSettings>) {
        this.settings = settings;
        this._changed();
    }

    get text() {
        return this._text;
    }

    set text(v) {
        if (this._text !== v) {
            this._text = v;
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

    get pixelRatio() {
        return super.pixelRatio;
    }

    set pixelRatio(v) {
        // We actually draw differently when the pixel ratio changes.
        if (this.pixelRatio !== v) {
            super.pixelRatio = v;
            this._changed();
        }
    }

    _getIsValid() {
        return !!this._text;
    }

    static getHash(obj: any): string {
        if (Array.isArray(obj)) {
            return obj.map((o) => TextTexture.getHash(o)).join(",");
        } else if (Utils.isObjectLiteral(obj)) {
            const parts = [];
            for (const [key, value] of Object.entries(obj)) {
                parts.push(key + "=" + TextTexture.getHash(value));
            }
            return parts.join("|");
        } else {
            return "" + obj;
        }
    }

    _getLookupId() {
        const id = "TX$" + this.text + "|" + TextTexture.getHash(this.settings) + "|" + this.pixelRatio;
        return id;
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const args = this.cloneArgs();

        return (cb: TextureSourceCallback) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            const renderer = new TextTextureRenderer(this.stage, canvas, this.text, args, this.pixelRatio);
            const p = renderer.draw();

            const respond = () => {
                cb(
                    undefined,
                    Object.assign(
                        { renderInfo: renderer.renderInfo },
                        this.stage.platform.getTextureOptionsForDrawingCanvas(canvas),
                    ),
                );
            };

            if (p) {
                p.then(() => {
                    respond();
                }).catch((err) => {
                    cb(err);
                });
            } else {
                respond();
            }
        };
    }

    getNonDefaults() {
        const nonDefaults = super.getNonDefaults();
        for (const [key, value] of Object.entries(this.settings)) {
            nonDefaults[key] = value;
        }
        return nonDefaults;
    }

    cloneArgs() {
        return Utils.clone(this.settings);
    }
}
