import CoreContext from "./CoreContext";
import CoreQuadOperation from "./CoreQuadOperation";
import { RenderTexture } from "../../renderer/webgl/WebGLRenderer";
import CoreRenderState from "./CoreRenderState";

export default class CoreRenderExecutor {
    renderState: CoreRenderState;

    protected _renderTexture: RenderTexture | null;

    constructor(public context: CoreContext) {
        this.renderState = context.renderState;
    }

    destroy() {}

    protected _reset() {
        this._bindRenderTexture(null);
        this._setScissor(null);
        this._clearRenderTexture();
    }

    execute() {
        this._reset();

        const qops = this.renderState.quadOperations;

        let i = 0;
        const n = qops.length;
        while (i < n) {
            this._processQuadOperation(qops[i]);
            i++;
        }
    }

    protected _processQuadOperation(quadOperation: CoreQuadOperation) {
        if (quadOperation.renderTextureInfo && quadOperation.renderTextureInfo.ignore) {
            // Ignore quad operations when we are 're-using' another texture as the render texture result.
            return;
        }

        this._setupQuadOperation(quadOperation);
        this._execQuadOperation(quadOperation);
    }

    protected _setupQuadOperation(quadOperation: CoreQuadOperation) {}

    protected _execQuadOperation(op: CoreQuadOperation) {
        // Set render texture.
        const nativeTexture = op.renderTextureInfo ? op.renderTextureInfo.nativeTexture : null;

        if (this._renderTexture !== nativeTexture) {
            this._bindRenderTexture(nativeTexture);
        }

        if (op.renderTextureInfo && !op.renderTextureInfo.cleared) {
            this._setScissor(null);
            this._clearRenderTexture();
            op.renderTextureInfo.cleared = true;
            this._setScissor(op.scissor);
        } else {
            this._setScissor(op.scissor);
        }

        this._renderQuadOperation(op);
    }

    protected _renderQuadOperation(op: CoreQuadOperation) {}

    protected _bindRenderTexture(renderTexture: RenderTexture | null) {
        this._renderTexture = renderTexture;
    }

    protected _clearRenderTexture() {}

    protected _setScissor(area: number[] | null) {}
}
