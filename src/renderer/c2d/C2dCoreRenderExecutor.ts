import CoreRenderExecutor from "../../tree/core/CoreRenderExecutor";
import ColorUtils from "../../tree/ColorUtils";
import C2dCoreQuadOperation from "./C2dCoreQuadOperation";
import C2dRenderTexture from "./C2dRenderTexture";
import CoreRenderState from "../../tree/core/CoreRenderState";

export default class C2dCoreRenderExecutor extends CoreRenderExecutor {
    private _mainRenderTexture = this.context.stage.getCanvas() as C2dRenderTexture;

    protected _renderQuadOperation(op: C2dCoreQuadOperation) {
        const shader = op.getC2dShader();

        if (op.length || op.shader.addEmpty()) {
            const target = (this._renderTexture || this._mainRenderTexture) as C2dRenderTexture;
            shader.beforeDraw(op, target);
            shader.draw(op, target);
            shader.afterDraw(op, target);
        }
    }

    _clearRenderTexture() {
        const context = this._getContext();

        const renderTexture = context.canvas;
        context.setTransform(1, 0, 0, 1, 0, 0);

        let clearColor: number[] | null = [0, 0, 0, 0];
        if (this._mainRenderTexture.context === context) {
            clearColor = this.context.stage.getClearColor();
        }
        if (clearColor) {
            if (!clearColor[0] && !clearColor[1] && !clearColor[2] && !clearColor[3]) {
                context.clearRect(0, 0, renderTexture.width, renderTexture.height);
            } else {
                context.fillStyle = ColorUtils.getRgbaStringFromArray(clearColor);
                // Do not use fillRect because it produces artifacts.
                context.globalCompositeOperation = "copy";
                context.beginPath();
                context.rect(0, 0, renderTexture.width, renderTexture.height);
                context.closePath();
                context.fill();
                context.globalCompositeOperation = "source-over";
            }
        }
    }

    _getContext() {
        if (this._renderTexture) {
            return (this._renderTexture as C2dRenderTexture).context;
        } else {
            return this._mainRenderTexture.context;
        }
    }

    _restoreContext() {
        const context = this._getContext();
        context.restore();
        context.save();
        context.scissor = undefined;
    }

    _setScissor(area: number[] | undefined) {
        const context = this._getContext();

        if (!CoreRenderState.scissorsEqual(context.scissor, area)) {
            // Clipping is stored in the canvas context state.
            // We can't reset clipping alone so we need to restore the full context.
            this._restoreContext();

            const precision = this.context.stage.getRenderPrecision();
            if (area) {
                context.beginPath();
                context.rect(
                    Math.round(area[0] * precision),
                    Math.round(area[1] * precision),
                    Math.round(area[2] * precision),
                    Math.round(area[3] * precision)
                );
                context.closePath();
                context.clip();
            }
            context.scissor = area;
        }
    }

}
