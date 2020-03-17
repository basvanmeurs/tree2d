import Stage from "../tree/Stage";
import CoreContext from "../tree/core/CoreContext";
import Shader from "../tree/Shader";
import { Constructor } from "../util/types";
import { TextureSourceOptions } from "../tree/Texture";
import TextureSource from "../tree/TextureSource";
import NativeTexture from "./NativeTexture";
import CoreRenderState from "../tree/core/CoreRenderState";
import CoreRenderExecutor from "../tree/core/CoreRenderExecutor";
import CoreQuadList from "../tree/core/CoreQuadList";
import { RenderTextureInfo } from "../tree/core/RenderTextureInfo";
import ElementCore from "../tree/core/ElementCore";
import CoreQuadOperation from "../tree/core/CoreQuadOperation";
import RenderTexture from "./RenderTexture";

export default abstract class Renderer {
    _defaultShader?: Shader;

    protected constructor(public stage: Stage) {}

    gc(aggressive: boolean) {}

    abstract destroy(): void;

    getDefaultShader(context = this.stage.context) {
        if (!this._defaultShader) {
            this._defaultShader = this._createDefaultShader(context);
        }
        return this._defaultShader;
    }

    protected abstract _createDefaultShader(context: CoreContext): Shader;

    isValidShaderType(shaderType: Constructor<Shader>) {
        return shaderType.prototype instanceof this._getShaderBaseType();
    }

    getSupportedShaderType(shaderType: Constructor<Shader>) {
        if (!this.isValidShaderType(shaderType)) {
            const convertedShaderType = this._getShaderAlternative(shaderType);
            if (!convertedShaderType) {
                return undefined;
            }
            return convertedShaderType;
        } else {
            return shaderType;
        }
    }

    abstract _getShaderBaseType(): Constructor<Shader>;

    protected _getShaderAlternative(shaderType: Constructor<Shader>): Constructor<Shader> | undefined {
        return undefined;
    }

    abstract copyRenderTexture(
        renderTexture: RenderTexture,
        nativeTexture: NativeTexture,
        options: CopyRenderTextureOptions
    ): void;

    abstract freeTextureSource(textureSource: TextureSource): void;

    abstract uploadTextureSource(textureSource: TextureSource, options: TextureSourceOptions): NativeTexture;

    abstract createCoreRenderState(context: CoreContext): CoreRenderState;

    abstract createCoreRenderExecutor(context: CoreContext): CoreRenderExecutor;

    abstract createRenderTexture(w: number, h: number, pw: number, ph: number): RenderTexture;

    abstract freeRenderTexture(renderTexture: RenderTexture): void;

    abstract createCoreQuadList(context: CoreContext): CoreQuadList;

    abstract createCoreQuadOperation(
        context: CoreContext,
        shader: Shader,
        shaderOwner: ElementCore,
        renderTextureInfo: RenderTextureInfo,
        scissor: number[] | undefined,
        index: number
    ): CoreQuadOperation;
}

export type CopyRenderTextureOptions = {
    sx?: number;
    sy?: number;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
};
