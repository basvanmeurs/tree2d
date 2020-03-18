import Utils from "../../tree/Utils";
import WebGLCoreQuadList from "./WebGLCoreQuadList";
import WebGLCoreQuadOperation from "./WebGLCoreQuadOperation";
import WebGLCoreRenderExecutor from "./WebGLCoreRenderExecutor";
import CoreRenderState from "../../tree/core/CoreRenderState";
import DefaultShader from "./shaders/DefaultShader";
import WebGLShader from "./WebGLShader";
import Renderer, {CopyRenderTextureOptions} from "../Renderer";
import TextureSource from "../../tree/TextureSource";
import Stage from "../../tree/Stage";
import CoreContext from "../../tree/core/CoreContext";
import Shader from "../../tree/Shader";
import { Constructor } from "../../util/types";
import ElementCore from "../../tree/core/ElementCore";
import { RenderTextureInfo } from "../../tree/core/RenderTextureInfo";
import WebGLShaderProgram from "./WebGLShaderProgram";
import { TextureSourceOptions } from "../../tree/Texture";
import NativeTexture from "../NativeTexture";
import WebGLRenderTexture from "./WebGLRenderTexture";
import { WebGLNativeTexture } from "./WebGLNativeTexture";
import WebGLCoreRenderState from "./WebGLCoreRenderState";
import RenderTexture from "../RenderTexture";

export default class WebGLRenderer extends Renderer {
    shaderPrograms: Map<Function, WebGLShaderProgram>;

    constructor(stage: Stage) {
        super(stage);
        this.shaderPrograms = new Map();
    }

    destroy() {
        this.shaderPrograms.forEach(shaderProgram => shaderProgram.destroy());
    }

    _createDefaultShader(context: CoreContext) {
        return new DefaultShader(context);
    }

    _getShaderBaseType() {
        return WebGLShader;
    }

    protected _getShaderAlternative(shaderType: Constructor<Shader>): Constructor<Shader> | undefined {
        return (shaderType as any).getWebGL();
    }

    createCoreQuadList() {
        return new WebGLCoreQuadList(this.stage.bufferMemory);
    }

    createCoreQuadOperation(
        context: CoreContext,
        shader: Shader,
        shaderOwner: ElementCore,
        renderTextureInfo: RenderTextureInfo,
        scissor: number[] | undefined,
        index: number
    ) {
        return new WebGLCoreQuadOperation(
            context,
            shader as WebGLShader,
            shaderOwner,
            renderTextureInfo,
            scissor,
            index
        );
    }

    createCoreRenderExecutor(context: CoreContext) {
        return new WebGLCoreRenderExecutor(context);
    }

    createCoreRenderState(context: CoreContext): CoreRenderState {
        return new WebGLCoreRenderState(context);
    }

    createRenderTexture(w: number, h: number, pw: number, ph: number): WebGLRenderTexture {
        const gl = this.stage.gl;
        const glTexture: WebGLRenderTexture = gl.createTexture() as WebGLRenderTexture;
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pw, ph, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        glTexture.params = {};
        glTexture.params[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        glTexture.params[gl.TEXTURE_MIN_FILTER] = gl.LINEAR;
        glTexture.params[gl.TEXTURE_WRAP_S] = gl.CLAMP_TO_EDGE;
        glTexture.params[gl.TEXTURE_WRAP_T] = gl.CLAMP_TO_EDGE;
        glTexture.options = { format: gl.RGBA, internalFormat: gl.RGBA, type: gl.UNSIGNED_BYTE };

        // We need a specific framebuffer for every render texture.
        glTexture.framebuffer = gl.createFramebuffer()!;
        glTexture.projection = new Float32Array([2 / w, 2 / h]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, glTexture.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glTexture, 0);

        return glTexture;
    }

    freeRenderTexture(glTexture: WebGLRenderTexture) {
        const gl = this.stage.gl;
        gl.deleteFramebuffer(glTexture.framebuffer);
        gl.deleteTexture(glTexture);
    }

    uploadTextureSource(textureSource: TextureSource, options: TextureSourceOptions): NativeTexture {
        const gl = this.stage.gl;

        const source = options.source;

        const format = {
            premultiplyAlpha: true,
            hasAlpha: true,
            texParams: {} as TexParams,
            texOptions: {
                format: 0,
                internalFormat: 0,
                type: gl.UNSIGNED_BYTE
            }
        };

        if (options && options.premultiplyAlpha !== undefined) {
            format.premultiplyAlpha = options.premultiplyAlpha;
        }

        if (options && options.hasAlpha !== undefined) {
            format.hasAlpha = options.hasAlpha;
        }

        if (!format.hasAlpha) {
            format.premultiplyAlpha = false;
        }

        format.texParams = options.texParams || {};

        const glTexture = gl.createTexture() as WebGLNativeTexture;
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, format.premultiplyAlpha);

        const texParams = format.texParams;
        if (!texParams[gl.TEXTURE_MAG_FILTER]) texParams[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        if (!texParams[gl.TEXTURE_MIN_FILTER]) texParams[gl.TEXTURE_MIN_FILTER] = gl.LINEAR;
        if (!texParams[gl.TEXTURE_WRAP_S]) texParams[gl.TEXTURE_WRAP_S] = gl.CLAMP_TO_EDGE;
        if (!texParams[gl.TEXTURE_WRAP_T]) texParams[gl.TEXTURE_WRAP_T] = gl.CLAMP_TO_EDGE;

        for (const key in texParams) {
            const value = texParams[key];
            gl.texParameteri(gl.TEXTURE_2D, parseInt(key), value);
        }

        const texOptions = format.texOptions;
        texOptions.format = (texOptions && texOptions.format) || (format.hasAlpha ? gl.RGBA : gl.RGB);
        texOptions.type = (texOptions && texOptions.type) || gl.UNSIGNED_BYTE;
        texOptions.internalFormat = (texOptions && texOptions.internalFormat) || texOptions.format;

        this.stage.platform.uploadGlTexture(gl, textureSource, source, texOptions);

        glTexture.params = Utils.cloneObjShallow(texParams);
        glTexture.options = Utils.cloneObjShallow(texOptions);

        return glTexture;
    }

    freeTextureSource(textureSource: TextureSource) {
        this.stage.gl.deleteTexture(textureSource.nativeTexture!);
    }

    copyRenderTexture(
        renderTexture: RenderTexture,
        nativeTexture: WebGLTexture,
        options: CopyRenderTextureOptions
    ) {
        const gl = this.stage.gl;
        gl.bindTexture(gl.TEXTURE_2D, nativeTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, (renderTexture as WebGLRenderTexture).framebuffer);
        const precision = renderTexture.precision;
        gl.copyTexSubImage2D(
            gl.TEXTURE_2D,
            0,
            precision * (options.sx || 0),
            precision * (options.sy || 0),
            precision * (options.x || 0),
            precision * (options.y || 0),
            precision * (options.w || renderTexture.ow),
            precision * (options.h || renderTexture.oh)
        );
    }
}

type TexParams = { [key: number]: GLenum };
