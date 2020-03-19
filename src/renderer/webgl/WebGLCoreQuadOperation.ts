import CoreQuadOperation from '../../tree/core/CoreQuadOperation';
import CoreContext from '../../tree/core/CoreContext';
import ElementCore from '../../tree/core/ElementCore';
import { RenderTextureInfo } from '../../tree/core/RenderTextureInfo';
import WebGLCoreRenderExecutor from './WebGLCoreRenderExecutor';
import WebGLShader from './WebGLShader';
import WebGLCoreQuadList from './WebGLCoreQuadList';
import WebGLRenderTexture from './WebGLRenderTexture';

export default class WebGLCoreQuadOperation extends CoreQuadOperation {
  extraAttribsDataByteOffset: number;

  constructor(
    context: CoreContext,
    shader: WebGLShader,
    shaderOwner: ElementCore,
    renderTextureInfo: RenderTextureInfo,
    scissor: number[] | undefined,
    index: number,
  ) {
    super(context, shader, shaderOwner, renderTextureInfo, scissor, index);

    this.extraAttribsDataByteOffset = 0;
  }

  get quadList(): WebGLCoreQuadList {
    return super.quadList as WebGLCoreQuadList;
  }

  getWebGLShader(): WebGLShader {
    return this.shader as WebGLShader;
  }

  getAttribsDataByteOffset(index: number) {
    // Where this quad can be found in the attribs buffer.
    return (this.quadList as WebGLCoreQuadList).getAttribsDataByteOffset(this.index + index);
  }

  // Returns the relative pixel coordinates in the shader owner to gl position coordinates in the render texture.
  getNormalRenderTextureCoords(x: number, y: number) {
    const coords = this.shaderOwner.getRenderTextureCoords(x, y);
    coords[0] /= this.getRenderWidth();
    coords[1] /= this.getRenderHeight();
    coords[0] = coords[0] * 2 - 1;
    coords[1] = 1 - coords[1] * 2;
    return coords;
  }

  getProjection() {
    if (this.renderTextureInfo && this.renderTextureInfo.renderTexture) {
      return (this.renderTextureInfo.renderTexture as WebGLRenderTexture).projection;
    } else {
      return (this.context.renderExecutor as WebGLCoreRenderExecutor).projection;
    }
  }
}
