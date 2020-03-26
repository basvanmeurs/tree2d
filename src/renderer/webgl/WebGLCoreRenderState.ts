import CoreRenderState from "../../tree/core/CoreRenderState";
import NativeTexture from "../NativeTexture";
import WebGLCoreQuadList from "./WebGLCoreQuadList";
import ColorUtils from "../../tree/ColorUtils";
import { RenderTextureInfo } from "../../tree/core/RenderTextureInfo";
import WebGLCoreQuadOperation from "./WebGLCoreQuadOperation";
import ElementCore from "../../tree/core/ElementCore";

export default class WebGLCoreRenderState extends CoreRenderState<WebGLCoreQuadList, WebGLCoreQuadOperation> {
    isRenderTextureReusable(renderTextureInfo: RenderTextureInfo): boolean {
        const offset = (this.renderTextureInfo!.reusableRenderStateOffset * 80) / 4;
        const floats = this.quadList.floats;
        const uints = this.quadList.uints;
        return (
            floats[offset] === 0 &&
            floats[offset + 1] === 0 &&
            floats[offset + 2] === 0 &&
            floats[offset + 3] === 0 &&
            uints[offset + 4] === 0xffffffff &&
            floats[offset + 5] === renderTextureInfo.w &&
            floats[offset + 6] === 0 &&
            floats[offset + 7] === 1 &&
            floats[offset + 8] === 0 &&
            uints[offset + 9] === 0xffffffff &&
            floats[offset + 10] === renderTextureInfo.w &&
            floats[offset + 11] === renderTextureInfo.h &&
            floats[offset + 12] === 1 &&
            floats[offset + 13] === 1 &&
            uints[offset + 14] === 0xffffffff &&
            floats[offset + 15] === 0 &&
            floats[offset + 16] === renderTextureInfo.h &&
            floats[offset + 17] === 0 &&
            floats[offset + 18] === 1 &&
            uints[offset + 19] === 0xffffffff
        );
    }

    finishRenderState(): void {
        // Set extra shader attribute data.
        let offset = this.length * 80;
        for (let i = 0, n = this.quadOperations.length; i < n; i++) {
            const quadOperation = this.quadOperations[i];
            quadOperation.extraAttribsDataByteOffset = offset;
            const extra = quadOperation.getWebGLShader().getExtraAttribBytesPerVertex() * 4 * quadOperation.length;
            offset += extra;
            if (extra) {
                quadOperation.getWebGLShader().setExtraAttribsInBuffer(quadOperation);
            }
        }
        this.quadList.setDataLength(offset);
    }

    addQuad(texture: NativeTexture, elementCore: ElementCore) {
        const index = this.length;

        const quadList = this.quadList;
        let offset = index * 20;

        quadList.add(texture, elementCore);

        const r = elementCore.getRenderContext();

        const floats = quadList.floats;
        const uints = quadList.uints;
        const mca = ColorUtils.mergeColorAlpha;

        const w = elementCore.getLayoutW();
        const h = elementCore.getLayoutH();

        if (r.tb !== 0 || r.tc !== 0) {
            floats[offset++] = r.px;
            floats[offset++] = r.py;
            floats[offset++] = elementCore.ulx;
            floats[offset++] = elementCore.uly;
            uints[offset++] = mca(elementCore.colorUl, r.alpha);
            floats[offset++] = r.px + w * r.ta;
            floats[offset++] = r.py + w * r.tc;
            floats[offset++] = elementCore.brx;
            floats[offset++] = elementCore.uly;
            uints[offset++] = mca(elementCore.colorUr, r.alpha);
            floats[offset++] = r.px + w * r.ta + h * r.tb;
            floats[offset++] = r.py + w * r.tc + h * r.td;
            floats[offset++] = elementCore.brx;
            floats[offset++] = elementCore.bry;
            uints[offset++] = mca(elementCore.colorBr, r.alpha);
            floats[offset++] = r.px + h * r.tb;
            floats[offset++] = r.py + h * r.td;
            floats[offset++] = elementCore.ulx;
            floats[offset++] = elementCore.bry;
            uints[offset] = mca(elementCore.colorBl, r.alpha);
        } else {
            // Simple.
            const cx = r.px + w * r.ta;
            const cy = r.py + h * r.td;

            floats[offset++] = r.px;
            floats[offset++] = r.py;
            floats[offset++] = elementCore.ulx;
            floats[offset++] = elementCore.uly;
            uints[offset++] = mca(elementCore.colorUl, r.alpha);
            floats[offset++] = cx;
            floats[offset++] = r.py;
            floats[offset++] = elementCore.brx;
            floats[offset++] = elementCore.uly;
            uints[offset++] = mca(elementCore.colorUr, r.alpha);
            floats[offset++] = cx;
            floats[offset++] = cy;
            floats[offset++] = elementCore.brx;
            floats[offset++] = elementCore.bry;
            uints[offset++] = mca(elementCore.colorBr, r.alpha);
            floats[offset++] = r.px;
            floats[offset++] = cy;
            floats[offset++] = elementCore.ulx;
            floats[offset++] = elementCore.bry;
            uints[offset] = mca(elementCore.colorBl, r.alpha);
        }
    }
}
