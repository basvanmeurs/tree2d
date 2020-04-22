import { CoreContext } from "./CoreContext";
import { CoreRenderState } from "./CoreRenderState";
import { RenderTexture } from "../../renderer/RenderTexture";
import { CoreQuadOperation } from "./CoreQuadOperation";

export class CoreRenderExecutor<CoreRenderStateType extends CoreRenderState = CoreRenderState> {
    renderState: CoreRenderStateType;

    protected _renderTexture: RenderTexture | undefined;

    constructor(public context: CoreContext) {
        this.renderState = context.renderState as CoreRenderStateType;
    }

    destroy() {}

    protected _reset() {
        this._bindRenderTexture(undefined);
        this._setScissor(undefined);
        this._clearRenderTexture();
    }

    execute() {
        this._reset();

        const quadOps = this.renderState.quadOperations;

        let i = 0;
        const n = quadOps.length;
        while (i < n) {
            this._processQuadOperation(quadOps[i]);
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
        const renderTexture = op.renderTextureInfo ? op.renderTextureInfo.renderTexture : undefined;

        if (this._renderTexture !== renderTexture) {
            this._bindRenderTexture(renderTexture);
        }

        if (op.renderTextureInfo && !op.renderTextureInfo.cleared) {
            this._setScissor(undefined);
            this._clearRenderTexture();
            op.renderTextureInfo.cleared = true;
            this._setScissor(op.scissor);
        } else {
            this._setScissor(op.scissor);
        }

        this._renderQuadOperation(op);
    }

    protected _renderQuadOperation(op: CoreQuadOperation) {}

    protected _bindRenderTexture(renderTexture: RenderTexture | undefined) {
        this._renderTexture = renderTexture;
    }

    protected _clearRenderTexture() {}

    protected _setScissor(area: number[] | undefined) {}
}
