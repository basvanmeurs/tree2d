import CoreContext from './CoreContext';
import CoreQuadOperation from './CoreQuadOperation';
import Shader from '../Shader';
import Renderer from '../../renderer/Renderer';
import CoreQuadList from './CoreQuadList';
import { RenderTextureInfo } from './RenderTextureInfo';
import ElementCore from './ElementCore';
import NativeTexture from '../../renderer/NativeTexture';
import ElementTexturizer from './ElementTexturizer';

export default abstract class CoreRenderState<
    CoreQuadListType extends CoreQuadList = CoreQuadList,
    CoreQuadOperationType extends CoreQuadOperation = CoreQuadOperation
> {
    public quadOperations: CoreQuadOperationType[] = [];
    public readonly defaultShader: Shader = this.context.stage.renderer.getDefaultShader(this.context);
    private renderer: Renderer = this.context.stage.renderer;
    public readonly quadList: CoreQuadListType = this.renderer.createCoreQuadList() as CoreQuadListType;

    public renderTextureInfo?: RenderTextureInfo;
    private scissor?: number[];
    private shaderOwner?: ElementCore;
    private specifiedShader?: Shader;
    private usedShader?: Shader;
    private checkForChanges: boolean = false;
    private texturizer?: ElementTexturizer;
    private pendingQuadOperation?: CoreQuadOperationType;

    // A list of texturizers that should not to be cached - and pending to be released.
    private temporaryTexturizers: ElementTexturizer[] = [];

    public isCachingTexturizer: boolean = false;
    private useTexturizerCache: boolean = false;

    constructor(private context: CoreContext) {}

    reset() {
        this.renderTextureInfo = undefined;

        this.scissor = undefined;

        this.usedShader = undefined;

        this.shaderOwner = undefined;

        this.specifiedShader = undefined;

        this.checkForChanges = false;

        this.quadOperations = [];

        this.texturizer = undefined;

        this.pendingQuadOperation = undefined;

        this.quadList.reset();

        this.temporaryTexturizers = [];

        this.isCachingTexturizer = false;

        this.useTexturizerCache = false;
    }

    get length() {
        return this.quadList.length;
    }

    setShader(shader: Shader, owner?: ElementCore) {
        if (this.shaderOwner !== owner || this.specifiedShader !== shader) {
            // Same shader owner: active shader is also the same.
            // Prevent any shader usage to save performance.

            this.specifiedShader = shader;

            if (shader.useDefault()) {
                // Use the default shader when possible to prevent unnecessary program changes.
                shader = this.defaultShader;
            }
            if (this.usedShader !== shader || this.shaderOwner !== owner) {
                this.usedShader = shader;
                this.shaderOwner = owner;
                this.checkForChanges = true;
            }
        }
    }

    setScissor(area: number[] | undefined) {
        if (this.scissor !== area) {
            this.scissor = area;
            this.checkForChanges = true;
        }
    }

    getScissor() {
        return this.scissor;
    }

    setRenderTextureInfo(renderTextureInfo: RenderTextureInfo | undefined) {
        if (this.renderTextureInfo !== renderTextureInfo) {
            this.renderTextureInfo = renderTextureInfo;
            this.scissor = undefined;
            this.checkForChanges = true;
        }
    }

    // Sets the texturizer to be drawn during subsequent addQuads.
    setTexturizer(texturizer: ElementTexturizer | undefined, cache: boolean) {
        this.texturizer = texturizer;
        this.useTexturizerCache = cache;
    }

    addElementCore(elementCore: ElementCore) {
        if (!this.pendingQuadOperation) {
            this._createQuadOperation();
        } else if (this.checkForChanges && this._hasChanges()) {
            this._finishQuadOperation();
            this.checkForChanges = false;
        }

        let nativeTexture;
        if (this.texturizer) {
            nativeTexture = this.texturizer.getResultTexture();

            if (!this.useTexturizerCache) {
                // We can release the temporary texture immediately after finalizing this quad operation.
                this.temporaryTexturizers.push(this.texturizer);
            }
        }

        if (!nativeTexture) {
            nativeTexture = elementCore.displayedTextureSource!.nativeTexture!;
        }

        if (this.renderTextureInfo) {
            if (this.usedShader === this.defaultShader && this.renderTextureInfo.empty) {
                // The texture might be reusable under some conditions. We will check the conditions later.
                this.renderTextureInfo.reusableTexture = nativeTexture;
                this.renderTextureInfo.reusableRenderStateOffset = this.length;
            } else {
                // It is not possible to reuse another texture when there is more than one quad.
                this.renderTextureInfo.reusableTexture = undefined;
            }
            this.renderTextureInfo.empty = false;
        }

        this.pendingQuadOperation!.length++;

        this.addQuad(nativeTexture, elementCore);
    }

    finishedRenderTexture() {
        if (this.renderTextureInfo && this.renderTextureInfo.reusableTexture) {
            // There was only one texture drawn in this render texture.
            // Check if we can reuse it so that we can optimize out an unnecessary render texture operation.
            // (it should exactly span this render texture).

            if (!this._isRenderTextureReusable()) {
                this.renderTextureInfo.reusableTexture = undefined;
            }
        }
    }

    _isRenderTextureReusable() {
        const renderTextureInfo = this.renderTextureInfo!;
        const offset = renderTextureInfo.reusableRenderStateOffset;
        const texture = this.quadList.getTexture(offset);
        return (
            texture.w === renderTextureInfo.w &&
            texture.h === renderTextureInfo.h &&
            this.isRenderTextureReusable(renderTextureInfo)
        );
    }

    _hasChanges() {
        const q = this.pendingQuadOperation!;
        if (this.usedShader !== q.shader) return true;
        if (this.shaderOwner !== q.shaderOwner) return true;
        if (this.renderTextureInfo !== q.renderTextureInfo) return true;
        if (!CoreRenderState.scissorsEqual(this.scissor, q.scissor)) return true;

        return false;
    }

    public static scissorsEqual(a: number[] | undefined, b: number[] | undefined) {
        return !(a !== b || !a || !b || a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]);
    }

    _finishQuadOperation(create = true) {
        if (this.pendingQuadOperation) {
            if (this.pendingQuadOperation.length || (this.usedShader && this.usedShader.addEmpty())) {
                if (
                    !this.pendingQuadOperation.scissor ||
                    (this.pendingQuadOperation.scissor[2] > 0 && this.pendingQuadOperation.scissor[3] > 0)
                ) {
                    // Ignore empty clipping regions.
                    this.quadOperations.push(this.pendingQuadOperation);
                }
            }

            if (this.temporaryTexturizers.length) {
                for (let i = 0, n = this.temporaryTexturizers.length; i < n; i++) {
                    // We can now reuse these render-to-textures in subsequent stages.
                    // Huge performance benefit when filtering (fast blur).
                    this.temporaryTexturizers[i].releaseRenderTexture();
                }
                this.temporaryTexturizers = [];
            }

            this.pendingQuadOperation = undefined;
        }

        if (create) {
            this._createQuadOperation();
        }
    }

    _createQuadOperation() {
        this.pendingQuadOperation = this.renderer.createCoreQuadOperation(
            this.context,
            this.usedShader!,
            this.shaderOwner!,
            this.renderTextureInfo!,
            this.scissor,
            this.length,
        ) as CoreQuadOperationType;
        this.checkForChanges = false;
    }

    finish() {
        if (this.pendingQuadOperation) {
            // Add remaining.
            this._finishQuadOperation(false);
        }

        this.finishRenderState();
    }

    abstract addQuad(texture: NativeTexture, elementCore: ElementCore): void;

    abstract isRenderTextureReusable(renderTextureInfo: RenderTextureInfo): boolean;

    abstract finishRenderState(): void;
}
