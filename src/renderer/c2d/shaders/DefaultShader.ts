import C2dShader from "../C2dShader";
import ColorUtils from "../../../tree/ColorUtils";
import C2dRenderer from "../C2dRenderer";
import C2dCoreQuadOperation from "../C2dCoreQuadOperation";
import C2dRenderTexture from "../C2dRenderTexture";
import ElementCore from "../../../tree/core/ElementCore";
import { C2dNativeTexture } from "../C2dNativeTexture";

export default class DefaultShader extends C2dShader {
    private _rectangleTexture = this.context.stage.rectangleTexture.source!.nativeTexture;
    private _tintManager = (this.context.stage.renderer as C2dRenderer).tintManager;

    draw(operation: C2dCoreQuadOperation, target: C2dRenderTexture) {
        const length = operation.length;
        for (let i = 0; i < length; i++) {
            const tx = operation.getTexture(i) as C2dNativeTexture;
            const elementCore = operation.getElementCore(i);
            const rc = operation.getRenderContext(i);
            const white = operation.getWhite(i);
            const stc = operation.getSimpleTc(i);

            const context = target.context;

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
                    this._setColorGradient(context, elementCore);
                }

                context.globalAlpha = rc.alpha;
                this._beforeDrawEl(info);
                context.fillRect(0, 0, elementCore.getLayoutW(), elementCore.getLayoutH());
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
                const sourceX = stc ? 0 : elementCore.ulx * tx.w;
                const sourceY = stc ? 0 : elementCore.uly * tx.h;
                const sourceW = (stc ? 1 : elementCore.brx - elementCore.ulx) * tx.w;
                const sourceH = (stc ? 1 : elementCore.bry - elementCore.uly) * tx.h;

                const colorize = !white;
                if (colorize) {
                    // @todo: cache the tint texture for better performance.

                    // Draw to intermediate texture with background color/gradient.
                    // This prevents us from having to create a lot of render texture canvases.

                    // Notice that we don't support (non-rect) gradients, only color tinting for c2d. We'll just take the average color.
                    let color = elementCore.colorUl;
                    if (
                        elementCore.colorUl !== elementCore.colorUr ||
                        elementCore.colorUr !== elementCore.colorBl ||
                        elementCore.colorBr !== elementCore.colorBl
                    ) {
                        color = ColorUtils.mergeMultiColorsEqual([
                            elementCore.colorUl,
                            elementCore.colorUr,
                            elementCore.colorBl,
                            elementCore.colorBr
                        ]);
                    }

                    const alpha = ((color / 16777216) | 0) / 255.0;
                    context.globalAlpha *= alpha;

                    const rgb = color & 0x00ffffff;
                    const tintTexture = this._tintManager.getTintTexture(tx, rgb);

                    // Actually draw result.
                    context.fillStyle = "white";
                    context.drawImage(
                        tintTexture as any,
                        sourceX,
                        sourceY,
                        sourceW,
                        sourceH,
                        0,
                        0,
                        elementCore.getLayoutW(),
                        elementCore.getLayoutH()
                    );
                } else {
                    context.fillStyle = "white";
                    context.drawImage(
                        tx as any,
                        sourceX,
                        sourceY,
                        sourceW,
                        sourceH,
                        0,
                        0,
                        elementCore.getLayoutW(),
                        elementCore.getLayoutH()
                    );
                }
                this._afterDrawEl(info);
                context.globalAlpha = 1.0;
            }
        }
    }

    _setColorGradient(
        context: CanvasRenderingContext2D,
        core: ElementCore,
        w = core.getLayoutW(),
        h = core.getLayoutH(),
        transparency = true
    ) {
        const color = core.colorUl;
        let gradient;
        //@todo: quick single color check.
        //@todo: cache gradient/fill style (if possible, probably context-specific).

        if (core.colorUl === core.colorUr) {
            if (core.colorBl === core.colorBr) {
                if (core.colorUl === core.colorBl) {
                    // Single color.
                } else {
                    // Vertical gradient.
                    gradient = context.createLinearGradient(0, 0, 0, h);
                    if (transparency) {
                        gradient.addColorStop(0, ColorUtils.getRgbaString(core.colorUl));
                        gradient.addColorStop(1, ColorUtils.getRgbaString(core.colorBl));
                    } else {
                        gradient.addColorStop(0, ColorUtils.getRgbString(core.colorUl));
                        gradient.addColorStop(1, ColorUtils.getRgbString(core.colorBl));
                    }
                }
            } else {
                // Not supported gradient.
            }
        } else {
            if (core.colorUl === core.colorBl && core.colorUr === core.colorBr) {
                // Horizontal gradient.
                gradient = context.createLinearGradient(0, 0, w, 0);
                if (transparency) {
                    gradient.addColorStop(0, ColorUtils.getRgbaString(core.colorUl));
                    gradient.addColorStop(1, ColorUtils.getRgbaString(core.colorBr));
                } else {
                    gradient.addColorStop(0, ColorUtils.getRgbString(core.colorUl));
                    gradient.addColorStop(1, ColorUtils.getRgbString(core.colorBr));
                }
            }
        }

        if (gradient) {
            context.fillStyle = gradient;
        } else {
            context.fillStyle = transparency ? ColorUtils.getRgbaString(color) : ColorUtils.getRgbString(color);
        }
    }

    _beforeDrawEl(info: any) {}

    _afterDrawEl(info: any) {}
}
