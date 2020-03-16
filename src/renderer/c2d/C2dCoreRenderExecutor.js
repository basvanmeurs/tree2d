import CoreRenderExecutor from "../../tree/core/CoreRenderExecutor";
import ColorUtils from "../../tree/ColorUtils";
import Utils from "../../tree/Utils";

export default class C2dCoreRenderExecutor extends CoreRenderExecutor {

    constructor(context) {
        super(context);
        this._mainRenderTexture = this.context.stage.getCanvas();
    }

    _renderQuadOperation(op) {
        const shader = op.shader;

        if (op.length || op.shader.addEmpty()) {
            const target = this._renderTexture || this._mainRenderTexture;
            shader.beforeDraw(op, target);
            shader.draw(op, target);
            shader.afterDraw(op, target);
        }
    }

    _clearRenderTexture() {
        const context = this._getContext();

        let clearColor = [0, 0, 0, 0];
        if (this._mainRenderTexture.context === context) {
            clearColor = this.context.stage.getClearColor();
        }

        const renderTexture = context.canvas;
        context.setTransform(1, 0, 0, 1, 0, 0);
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

    _getContext() {
        if (this._renderTexture) {
            return this._renderTexture.context;
        } else {
            return this._mainRenderTexture.context;
        }
    }

    _restoreContext() {
        const context = this._getContext();
        context.restore();
        context.save();
        context._scissor = null;
    }

    _setScissor(area) {
        const context = this._getContext();

        if (!C2dCoreRenderExecutor._equalScissorAreas(context.canvas, context._scissor, area)) {
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
            context._scissor = area;
        }
    }

    static _equalScissorAreas(canvas, area, current) {
        if (!area) {
            area = [0, 0, canvas.width, canvas.height];
        }
        if (!current) {
            current = [0, 0, canvas.width, canvas.height];
        }
        return Utils.equalValues(area, current);
    }
}
