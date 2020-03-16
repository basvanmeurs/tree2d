import C2dShader from "../C2dShader";
import ColorUtils from "../../../tree/ColorUtils";

export default class DefaultShader extends C2dShader {
    constructor(context) {
        super(context);
        this._rectangleTexture = context.stage.rectangleTexture.source.nativeTexture;
        this._tintManager = this.context.stage.renderer.tintManager;
    }

    draw(operation, target) {
        const context = target.context;
        const length = operation.length;
        for (let i = 0; i < length; i++) {
            const tx = operation.getTexture(i);
            const vc = operation.getElementCore(i);
            const rc = operation.getRenderContext(i);
            const white = operation.getWhite(i);
            const stc = operation.getSimpleTc(i);

            //@todo: try to optimize out per-draw transform setting. split translate, transform.
            const precision = this.context.stage.getRenderPrecision();
            context.setTransform(
                rc.ta * precision,
                rc.tc * precision,
                rc.tb * precision,
                rc.td * precision,
                rc.px * precision,
                rc.py * precision
            );

            const rect = tx === this._rectangleTexture;
            const info = { operation, target, index: i, rect };

            if (rect) {
                // Check for gradient.
                if (white) {
                    context.fillStyle = "white";
                } else {
                    this._setColorGradient(context, vc);
                }

                context.globalAlpha = rc.alpha;
                this._beforeDrawEl(info);
                context.fillRect(0, 0, vc.getLayoutW(), vc.getLayoutH());
                this._afterDrawEl(info);
                context.globalAlpha = 1.0;
            } else {
                // @todo: set image smoothing based on the texture.

                // @todo: optimize by registering whether identity texcoords are used.
                context.globalAlpha = rc.alpha;
                this._beforeDrawEl(info);

                // @todo: test if rounding yields better performance.

                // Notice that simple texture coords can be turned on even though vc._ulx etc are not simple, because
                //  we are rendering a render-to-texture (texcoords were stashed). Same is true for 'white' color btw.
                const sourceX = stc ? 0 : vc._ulx * tx.w;
                const sourceY = stc ? 0 : vc._uly * tx.h;
                const sourceW = (stc ? 1 : vc._brx - vc._ulx) * tx.w;
                const sourceH = (stc ? 1 : vc._bry - vc._uly) * tx.h;

                const colorize = !white;
                if (colorize) {
                    // @todo: cache the tint texture for better performance.

                    // Draw to intermediate texture with background color/gradient.
                    // This prevents us from having to create a lot of render texture canvases.

                    // Notice that we don't support (non-rect) gradients, only color tinting for c2d. We'll just take the average color.
                    let color = vc._colorUl;
                    if (vc._colorUl !== vc._colorUr || vc._colorUr !== vc._colorBl || vc._colorBr !== vc._colorBl) {
                        color = ColorUtils.mergeMultiColorsEqual([vc._colorUl, vc._colorUr, vc._colorBl, vc._colorBr]);
                    }

                    const alpha = ((color / 16777216) | 0) / 255.0;
                    context.globalAlpha *= alpha;

                    const rgb = color & 0x00ffffff;
                    const tintTexture = this._tintManager.getTintTexture(tx, rgb);

                    // Actually draw result.
                    context.fillStyle = "white";
                    context.drawImage(tintTexture, sourceX, sourceY, sourceW, sourceH, 0, 0, vc.getLayoutW(), vc.getLayoutH());
                } else {
                    context.fillStyle = "white";
                    context.drawImage(tx, sourceX, sourceY, sourceW, sourceH, 0, 0, vc.getLayoutW(), vc.getLayoutH());
                }
                this._afterDrawEl(info);
                context.globalAlpha = 1.0;
            }
        }
    }

    _setColorGradient(context, vc, w = vc.w, h = vc.h, transparency = true) {
        const color = vc._colorUl;
        let gradient;
        //@todo: quick single color check.
        //@todo: cache gradient/fill style (if possible, probably context-specific).

        if (vc._colorUl === vc._colorUr) {
            if (vc._colorBl === vc._colorBr) {
                if (vc._colorUl === vc.colorBl) {
                    // Single color.
                } else {
                    // Vertical gradient.
                    gradient = context.createLinearGradient(0, 0, 0, h);
                    if (transparency) {
                        gradient.addColorStop(0, ColorUtils.getRgbaString(vc._colorUl));
                        gradient.addColorStop(1, ColorUtils.getRgbaString(vc._colorBl));
                    } else {
                        gradient.addColorStop(0, ColorUtils.getRgbString(vc._colorUl));
                        gradient.addColorStop(1, ColorUtils.getRgbString(vc._colorBl));
                    }
                }
            } else {
                // Not supported gradient.
            }
        } else {
            if (vc._colorUl === vc._colorBl && vc._colorUr === vc._colorBr) {
                // Horizontal gradient.
                gradient = context.createLinearGradient(0, 0, w, 0);
                if (transparency) {
                    gradient.addColorStop(0, ColorUtils.getRgbaString(vc._colorUl));
                    gradient.addColorStop(1, ColorUtils.getRgbaString(vc._colorBr));
                } else {
                    gradient.addColorStop(0, ColorUtils.getRgbString(vc._colorUl));
                    gradient.addColorStop(1, ColorUtils.getRgbString(vc._colorBr));
                }
            }
        }

        if (gradient) {
            context.fillStyle = gradient;
        } else {
            context.fillStyle = transparency ? ColorUtils.getRgbaString(color) : ColorUtils.getRgbString(color);
        }
    }

    _beforeDrawEl(info) {}

    _afterDrawEl(info) {}
}
