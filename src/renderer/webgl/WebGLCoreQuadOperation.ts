import CoreQuadOperation from "../../tree/core/CoreQuadOperation";
import CoreContext from "../../tree/core/CoreContext";
import Shader from "../../tree/Shader";
import ElementCore from "../../tree/core/ElementCore";
import { RenderTextureInfo } from "../../tree/core/RenderTextureInfo";

export default class WebGLCoreQuadOperation extends CoreQuadOperation {
    extraAttribsDataByteOffset: number;

    constructor(
        context: CoreContext,
        shader: Shader,
        shaderOwner: ElementCore,
        renderTextureInfo: RenderTextureInfo,
        scissor: number[],
        index: number
    ) {
        super(context, shader, shaderOwner, renderTextureInfo, scissor, index);

        this.extraAttribsDataByteOffset = 0;
    }

    getAttribsDataByteOffset(index: number) {
        // Where this quad can be found in the attribs buffer.
        return this.quads.getAttribsDataByteOffset(this.index + index);
    }

    /**
     * Returns the relative pixel coordinates in the shader owner to gl position coordinates in the render texture.
     * @param x
     * @param y
     * @return {number[]}
     */
    getNormalRenderTextureCoords(x: number, y: number) {
        const coords = this.shaderOwner.getRenderTextureCoords(x, y);
        coords[0] /= this.getRenderWidth();
        coords[1] /= this.getRenderHeight();
        coords[0] = coords[0] * 2 - 1;
        coords[1] = 1 - coords[1] * 2;
        return coords;
    }

    getProjection() {
        if (this.renderTextureInfo === null) {
            return this.context.renderExecutor._projection;
        } else {
            return this.renderTextureInfo.nativeTexture.projection;
        }
    }
}
