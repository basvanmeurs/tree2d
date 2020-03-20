import C2dCoreQuadList from './C2dCoreQuadList';
import C2dCoreQuadOperation from './C2dCoreQuadOperation';
import C2dCoreRenderExecutor from './C2dCoreRenderExecutor';
import CoreRenderState from '../../tree/core/CoreRenderState';
import DefaultShader from './shaders/DefaultShader';
import C2dShader from './C2dShader';
import Renderer, { CopyRenderTextureOptions } from '../Renderer';
import TextureTintManager from './C2dTextureTintManager';
import Stage from '../../tree/Stage';
import RenderTexture from '../RenderTexture';
import C2dTextureTintManager from './C2dTextureTintManager';
import CoreContext from '../../tree/core/CoreContext';
import Shader from '../../tree/Shader';
import { Constructor } from '../../util/types';
import ElementCore from '../../tree/core/ElementCore';
import { RenderTextureInfo } from '../../tree/core/RenderTextureInfo';
import C2dCoreRenderState from './C2dCoreRenderState';
import TextureSource from '../../tree/TextureSource';
import { TextureSourceOptions } from '../../tree/Texture';
import NativeTexture from '../NativeTexture';
import { C2dNativeTexture } from './C2dNativeTexture';
import C2dRenderTexture from './C2dRenderTexture';

export default class C2dRenderer extends Renderer {
    public readonly tintManager: C2dTextureTintManager = new TextureTintManager(this.stage);

    constructor(stage: Stage) {
        super(stage);

        this.setupCanvasAsRenderTexture(stage.canvas);
    }

    destroy() {
        this.tintManager.destroy();
    }

    _createDefaultShader(context: CoreContext): Shader {
        return new DefaultShader(context);
    }

    _getShaderBaseType(): Constructor<Shader> {
        return C2dShader;
    }

    protected _getShaderAlternative(shaderType: Constructor<Shader>): Constructor<Shader> | undefined {
        return (shaderType as any).getC2d();
    }

    createCoreQuadList() {
        return new C2dCoreQuadList();
    }

    createCoreQuadOperation(
        context: CoreContext,
        shader: Shader,
        shaderOwner: ElementCore,
        renderTextureInfo: RenderTextureInfo,
        scissor: number[] | undefined,
        index: number,
    ) {
        return new C2dCoreQuadOperation(context, shader, shaderOwner, renderTextureInfo, scissor, index);
    }

    createCoreRenderExecutor(context: CoreContext) {
        return new C2dCoreRenderExecutor(context);
    }

    createCoreRenderState(context: CoreContext) {
        return new C2dCoreRenderState(context);
    }

    createRenderTexture(w: number, h: number, pw: number, ph: number): RenderTexture {
        const canvas = document.createElement('canvas');
        canvas.width = pw;
        canvas.height = ph;
        this.setupCanvasAsRenderTexture(canvas);
        return (canvas as unknown) as RenderTexture;
    }

    freeRenderTexture(renderTexture: RenderTexture) {
        this.tintManager.delete(renderTexture as C2dRenderTexture);
    }

    gc(aggressive: boolean) {
        this.tintManager.gc(aggressive);
    }

    uploadTextureSource(textureSource: TextureSource, options: TextureSourceOptions): NativeTexture {
        // In case of Context2d, we usually do not need to upload.
        // Only in case of ArrayBuffer
        // For canvas, we do not need to upload.
        if (options.source instanceof Uint8ClampedArray) {
            // Convert RGBA buffer to canvas.
            const canvas = document.createElement('canvas');
            canvas.width = options.width!;
            canvas.height = options.height!;

            const imageData = new ImageData(options.source as Uint8ClampedArray, options.width!, options.height!);
            canvas.getContext('2d')!.putImageData(imageData, 0, 0);
            return (canvas as unknown) as NativeTexture;
        }

        return options.source as NativeTexture;
    }

    freeTextureSource(textureSource: TextureSource) {
        this.tintManager.delete(textureSource.nativeTexture as C2dNativeTexture);
    }

    private setupCanvasAsRenderTexture(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d')!;
        (canvas as C2dRenderTexture).context = context;
        (canvas as C2dRenderTexture).context.scissor = undefined;

        // Save base state so we can restore the defaults later.
        context.save();
    }

    copyRenderTexture(renderTexture: RenderTexture, nativeTexture: WebGLTexture, options: CopyRenderTextureOptions) {
        throw new Error('Copy render texture not implemented');
    }
}
