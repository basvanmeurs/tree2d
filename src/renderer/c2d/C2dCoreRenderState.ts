import CoreRenderState from "../../tree/core/CoreRenderState";
import NativeTexture from "../NativeTexture";
import { RenderTextureInfo } from "../../tree/core/RenderTextureInfo";
import ElementCore from "../../tree/core/ElementCore";
import C2dCoreQuadList from "./C2dCoreQuadList";

export default class C2dCoreRenderState extends CoreRenderState {
    isRenderTextureReusable(renderTextureInfo: RenderTextureInfo): boolean {
        return false;
    }

    finishRenderState(): void {}

    addQuad(texture: NativeTexture, elementCore: ElementCore) {
        const index = this.length;

        // Render context changes while traversing so we save it by ref.
        const quadList = this.quadList as C2dCoreQuadList;
        quadList.add(texture, elementCore);
        quadList.setRenderContext(index, elementCore.getRenderContext());
        quadList.setWhite(index, elementCore.isWhite());
        quadList.setSimpleTc(index, elementCore.hasSimpleTexCoords());
    }
}
