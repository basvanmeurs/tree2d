import Utils from "../../tree/Utils";
import ColorUtils from "../../tree/ColorUtils";
import WebGLCoreQuadList from "./WebGLCoreQuadList";
import WebGLCoreQuadOperation from "./WebGLCoreQuadOperation";
import WebGLCoreRenderExecutor from "./WebGLCoreRenderExecutor";
import CoreRenderState from "../../tree/core/CoreRenderState";
import DefaultShader from "./shaders/DefaultShader";
import WebGLShader from "./WebGLShader";
import Renderer from "../Renderer";
import CoreQuadList from "../../tree/core/CoreQuadList";
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

export type NativeWebGLTexture = WebGLTexture &
    NativeTexture & {
        params: any;
        options: any;
    };

export interface RenderTexture extends NativeWebGLTexture {
    id: number;
    f: number;
    ow: number;
    oh: number;
    precision: number;
    framebuffer: WebGLFramebuffer;
    projection: Float32Array;
}

type TexParams = { [key: number]: GLenum };

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

    createCoreQuadList(context: CoreContext) {
        return new WebGLCoreQuadList(context);
    }

    createCoreQuadOperation(
        context: CoreContext,
        shader: Shader,
        shaderOwner: ElementCore,
        renderTextureInfo: RenderTextureInfo,
        scissor: number[],
        index: number
    ) {
        return new WebGLCoreQuadOperation(context, shader, shaderOwner, renderTextureInfo, scissor, index);
    }

    createCoreRenderExecutor(context: CoreContext) {
        return new WebGLCoreRenderExecutor(context);
    }

    createRenderTexture(w: number, h: number, pw: number, ph: number): RenderTexture {
        const gl = this.stage.gl;
        const glTexture: RenderTexture = gl.createTexture() as RenderTexture;
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

    freeRenderTexture(glTexture: RenderTexture) {
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

        const glTexture = gl.createTexture() as NativeWebGLTexture;
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
        this.stage.gl.deleteTexture(textureSource.nativeTexture);
    }

    addQuad(renderState: CoreRenderState, quads: CoreQuadList, index: number) {
        let offset = index * 20;
        const elementCore = quads.quadElements[index];

        const r = elementCore._renderContext;

        const floats = renderState.quads.floats;
        const uints = renderState.quads.uints;
        const mca = ColorUtils.mergeColorAlpha;

        if (r.tb !== 0 || r.tc !== 0) {
            floats[offset++] = r.px;
            floats[offset++] = r.py;
            floats[offset++] = elementCore._ulx;
            floats[offset++] = elementCore._uly;
            uints[offset++] = mca(elementCore._colorUl, r.alpha);
            floats[offset++] = r.px + elementCore._w * r.ta;
            floats[offset++] = r.py + elementCore._w * r.tc;
            floats[offset++] = elementCore._brx;
            floats[offset++] = elementCore._uly;
            uints[offset++] = mca(elementCore._colorUr, r.alpha);
            floats[offset++] = r.px + elementCore._w * r.ta + elementCore._h * r.tb;
            floats[offset++] = r.py + elementCore._w * r.tc + elementCore._h * r.td;
            floats[offset++] = elementCore._brx;
            floats[offset++] = elementCore._bry;
            uints[offset++] = mca(elementCore._colorBr, r.alpha);
            floats[offset++] = r.px + elementCore._h * r.tb;
            floats[offset++] = r.py + elementCore._h * r.td;
            floats[offset++] = elementCore._ulx;
            floats[offset++] = elementCore._bry;
            uints[offset] = mca(elementCore._colorBl, r.alpha);
        } else {
            // Simple.
            const cx = r.px + elementCore._w * r.ta;
            const cy = r.py + elementCore._h * r.td;

            floats[offset++] = r.px;
            floats[offset++] = r.py;
            floats[offset++] = elementCore._ulx;
            floats[offset++] = elementCore._uly;
            uints[offset++] = mca(elementCore._colorUl, r.alpha);
            floats[offset++] = cx;
            floats[offset++] = r.py;
            floats[offset++] = elementCore._brx;
            floats[offset++] = elementCore._uly;
            uints[offset++] = mca(elementCore._colorUr, r.alpha);
            floats[offset++] = cx;
            floats[offset++] = cy;
            floats[offset++] = elementCore._brx;
            floats[offset++] = elementCore._bry;
            uints[offset++] = mca(elementCore._colorBr, r.alpha);
            floats[offset++] = r.px;
            floats[offset++] = cy;
            floats[offset++] = elementCore._ulx;
            floats[offset++] = elementCore._bry;
            uints[offset] = mca(elementCore._colorBl, r.alpha);
        }
    }

    isRenderTextureReusable(renderState: CoreRenderState, renderTextureInfo: TextureSource) {
        const offset = (renderState._renderTextureInfo.offset * 80) / 4;
        const floats = renderState.quads.floats;
        const uints = renderState.quads.uints;
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

    finishRenderState(renderState: CoreRenderState) {
        // Set extra shader attribute data.
        let offset = renderState.length * 80;
        for (let i = 0, n = renderState.quadOperations.length; i < n; i++) {
            renderState.quadOperations[i].extraAttribsDataByteOffset = offset;
            const extra =
                renderState.quadOperations[i].shader.getExtraAttribBytesPerVertex() *
                4 *
                renderState.quadOperations[i].length;
            offset += extra;
            if (extra) {
                renderState.quadOperations[i].shader.setExtraAttribsInBuffer(
                    renderState.quadOperations[i],
                    renderState.quads
                );
            }
        }
        renderState.quads.dataLength = offset;
    }

    copyRenderTexture(
        renderTexture: RenderTexture,
        nativeTexture: WebGLTexture,
        options: {
            sx?: number;
            sy?: number;
            x?: number;
            y?: number;
            w?: number;
            h?: number;
        }
    ) {
        const gl = this.stage.gl;
        gl.bindTexture(gl.TEXTURE_2D, nativeTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTexture.framebuffer);
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
