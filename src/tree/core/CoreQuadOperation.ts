import CoreContext from "./CoreContext";
import Shader from "../Shader";
import ElementCore from "./ElementCore";
import { RenderTextureInfo } from "./RenderTextureInfo";

export default class CoreQuadOperation {
    public length: number = 0;

    constructor(
        public readonly context: CoreContext,
        public readonly shader: Shader,
        public readonly shaderOwner: ElementCore,
        public readonly renderTextureInfo: RenderTextureInfo,
        public readonly scissor: number[],
        public readonly index: number
    ) {}

    get quads() {
        return this.context.renderState.quads;
    }

    getTexture(index: number) {
        return this.quads.getTexture(this.index + index);
    }

    getElementCore(index: number) {
        return this.quads.getElementCore(this.index + index);
    }

    getElement(index: number) {
        return this.quads.getElement(this.index + index);
    }

    getElementWidth(index: number) {
        return this.getElement(index).renderWidth;
    }

    getElementHeight(index: number) {
        return this.getElement(index).renderHeight;
    }

    getTextureWidth(index: number) {
        return this.quads.getTextureWidth(this.index + index);
    }

    getTextureHeight(index: number) {
        return this.quads.getTextureHeight(this.index + index);
    }

    getRenderWidth() {
        if (this.renderTextureInfo) {
            return this.renderTextureInfo.w;
        } else {
            return this.context.stage.w;
        }
    }

    getRenderHeight() {
        if (this.renderTextureInfo) {
            return this.renderTextureInfo.h;
        } else {
            return this.context.stage.h;
        }
    }
}
