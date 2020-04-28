import { ElementTexturizer } from "./ElementTexturizer";
import { Utils } from "../Utils";
import { CoreContext } from "./CoreContext";
import { TextureSource } from "../TextureSource";
import { CoreRenderState } from "./CoreRenderState";
import { Shader } from "../Shader";
import { ElementCoreContext } from "./ElementCoreContext";
import { RenderTextureInfo } from "./RenderTextureInfo";
import { ElementEventCallback } from "../ElementListeners";
import { FlexContainer, FlexItem, FlexNode, FlexSubject } from "flexbox.js";
import { Element } from "../Element";

export class ElementCore implements FlexSubject {
    private _element: Element;

    public readonly context: CoreContext;

    /**
     * Recalc flags in bits.
     */
    private flags: number = 0;

    private _parent?: ElementCore = undefined;

    private _onUpdate?: ElementEventCallback = undefined;

    private updatedFlags: number = 0;

    private _worldContext = new ElementCoreContext();

    private _hasUpdates: boolean = false;

    private _localAlpha: number = 1;

    private _onAfterCalcs?: ElementEventCallback = undefined;

    private _onAfterUpdate?: ElementEventCallback = undefined;

    // All local translation/transform updates: directly propagated from x/y/w/h/scale/whatever.
    private _localPx: number = 0;
    private _localPy: number = 0;
    private _localTa: number = 1;
    private _localTb: number = 0;
    private _localTc: number = 0;
    private _localTd: number = 1;

    private _isComplex: boolean = false;
    private _dimsUnknown: boolean = false;
    private _clipping: boolean = false;
    private _zSort: boolean = false;
    private _outOfBounds: number = 0;

    /**
     * The texture source to be displayed.
     */
    private _displayedTextureSource?: TextureSource = undefined;

    private _zContextUsage: number = 0;

    public _children?: ElementCore[] = undefined;

    private _hasRenderUpdates: number = 0;

    private _zIndexedChildren?: ElementCore[] = undefined;

    private _renderContext: ElementCoreContext = this._worldContext;

    private renderState: CoreRenderState;

    private _scissor?: number[] = undefined;

    // The ancestor ElementCore that defined the inherited shader. Undefined if none is active (default shader).
    private _shaderOwner?: ElementCore = undefined;

    // Counter while updating the tree order.
    private _updateTreeOrder: number = 0;

    // Texture corner point colors.
    private _colorUl: number = 0xffffffff;
    private _colorUr: number = 0xffffffff;
    private _colorBl: number = 0xffffffff;
    private _colorBr: number = 0xffffffff;

    // Internal coords.
    private _x: number = 0;
    private _y: number = 0;
    private _w: number = 0;
    private _h: number = 0;

    // Actual settings.
    private _sx: number = 0;
    private _sy: number = 0;
    private _sw: number = 0;
    private _sh: number = 0;

    // Active texture size.
    private _tw: number = 0;
    private _th: number = 0;

    // Defines which relative functions are enabled.
    private _relFuncFlags: number = 0;

    private _funcX?: RelativeFunction = undefined;
    private _funcY?: RelativeFunction = undefined;
    private _funcW?: RelativeFunction = undefined;
    private _funcH?: RelativeFunction = undefined;

    private _scaleX: number = 1;
    private _scaleY: number = 1;
    private _pivotX: number = 0.5;
    private _pivotY: number = 0.5;
    private _mountX: number = 0;
    private _mountY: number = 0;
    private _rotation: number = 0;

    private _alpha: number = 1;
    private _visible: boolean = true;

    // Texture clipping.
    public ulx: number = 0;
    public uly: number = 0;
    public brx: number = 1;
    public bry: number = 1;

    private _isRoot: boolean = false;

    private _zIndex: number = 0;
    private _forceZIndexContext: boolean = false;
    private _zParent?: ElementCore = undefined;

    /**
     * Iff true, during next zSort, this element should be 're-sorted' because either:
     * - zIndex did change
     * - zParent did change
     * - element was moved in the render tree
     */
    private _zIndexResort: boolean = false;

    private _shader?: Shader = undefined;

    // Element is rendered on another texture.
    private _renderToTextureEnabled: boolean = false;

    // Manages the render texture.
    private _texturizer?: ElementTexturizer = undefined;

    private _useRenderToTexture: boolean = false;

    private _boundsMargin?: number[];

    private _recBoundsMargin?: number[];

    private _withinBoundsMargin: boolean = false;

    private _viewport?: number[] = undefined;

    // If this element is out of viewport, the branch is also skipped in updating and rendering.
    private _clipbox: boolean = true;

    // The render function. _renderAdvanced is only used if necessary.
    public render: () => void = this._renderSimple;

    // Flex layouting if enabled.
    private _layout?: FlexNode = undefined;

    private _stashedTexCoords?: number[] = undefined;
    private _stashedColors?: number[] = undefined;

    constructor(element: Element) {
        this._element = element;

        this.context = element.stage.context;

        this.renderState = this.context.renderState;
    }

    getRenderContext(): ElementCoreContext {
        return this._renderContext;
    }

    get x() {
        return this._sx;
    }

    set x(v: number) {
        const dx = (v as number) - this._sx;
        if (dx) {
            this._sx = v as number;
            if (!this._funcX) {
                this._x += dx;
                this.updateLocalTranslateDelta(dx, 0);
            }
        }
    }

    get funcX() {
        return this._funcX;
    }

    set funcX(v: RelativeFunction | undefined) {
        if (this._funcX !== v) {
            if (v) {
                this._relFuncFlags |= 1;
                this._funcX = v;
            } else {
                this._disableFuncX();
            }
            if (this.hasFlexLayout()) {
                this.layout.forceLayout();
            } else {
                this._triggerRecalcTranslate();
            }
        }
    }

    _disableFuncX() {
        this._relFuncFlags = this._relFuncFlags & (0xffff - 1);
        this._funcX = undefined;
    }

    get y() {
        return this._sy;
    }

    set y(v: number) {
        const dy = (v as number) - this._sy;
        if (dy) {
            this._sy = v as number;
            if (!this._funcY) {
                this._y += dy;
                this.updateLocalTranslateDelta(0, dy);
            }
        }
    }

    get funcY() {
        return this._funcY;
    }

    set funcY(v: RelativeFunction | undefined) {
        if (this._funcY !== v) {
            if (v) {
                this._relFuncFlags |= 2;
                this._funcY = v;
            } else {
                this._disableFuncY();
            }
            if (this.hasFlexLayout()) {
                this.layout.forceLayout();
            } else {
                this._triggerRecalcTranslate();
            }
        }
    }

    _disableFuncY() {
        this._relFuncFlags = this._relFuncFlags & (0xffff - 2);
        this._funcY = undefined;
    }

    get w() {
        return this._sw;
    }

    set w(v: number) {
        if (this._sw !== v) {
            this._sw = v as number;
            this._updateBaseDimensions();
        }
    }

    get funcW() {
        return this._funcW;
    }

    set funcW(v) {
        if (this._funcW !== v) {
            if (v) {
                this._relFuncFlags |= 4;
                this._funcW = v;
            } else {
                this._disableFuncW();
            }
            this._updateBaseDimensions();
        }
    }

    _disableFuncW() {
        this._relFuncFlags = this._relFuncFlags & (0xffff - 4);
        this._funcW = undefined;
    }

    get h() {
        return this._sh;
    }

    set h(v: number) {
        if (this._sh !== v) {
            this._sh = v as number;
            this._updateBaseDimensions();
        }
    }

    get funcH() {
        return this._funcH;
    }

    set funcH(v) {
        if (this._funcH !== v) {
            if (v) {
                this._relFuncFlags |= 8;
                this._funcH = v;
            } else {
                this._disableFuncH();
            }
            this._updateBaseDimensions();
        }
    }

    _disableFuncH() {
        this._relFuncFlags = this._relFuncFlags & (0xffff - 8);
        this._funcH = undefined;
    }

    get scaleX() {
        return this._scaleX;
    }

    set scaleX(v) {
        if (this._scaleX !== v) {
            this._scaleX = v;
            this._updateLocalTransform();
        }
    }

    get scaleY() {
        return this._scaleY;
    }

    set scaleY(v) {
        if (this._scaleY !== v) {
            this._scaleY = v;
            this._updateLocalTransform();
        }
    }

    get scale() {
        return this.scaleX;
    }

    set scale(v) {
        if (this._scaleX !== v || this._scaleY !== v) {
            this._scaleX = v;
            this._scaleY = v;
            this._updateLocalTransform();
        }
    }

    get pivotX() {
        return this._pivotX;
    }

    set pivotX(v) {
        if (this._pivotX !== v) {
            this._pivotX = v;
            this._updateLocalTranslate();
        }
    }

    get pivotY() {
        return this._pivotY;
    }

    set pivotY(v) {
        if (this._pivotY !== v) {
            this._pivotY = v;
            this._updateLocalTranslate();
        }
    }

    get pivot() {
        return this._pivotX;
    }

    set pivot(v) {
        if (this._pivotX !== v || this._pivotY !== v) {
            this._pivotX = v;
            this._pivotY = v;
            this._updateLocalTranslate();
        }
    }

    get mountX() {
        return this._mountX;
    }

    set mountX(v) {
        if (this._mountX !== v) {
            this._mountX = v;
            this._updateLocalTranslate();
        }
    }

    get mountY() {
        return this._mountY;
    }

    set mountY(v) {
        if (this._mountY !== v) {
            this._mountY = v;
            this._updateLocalTranslate();
        }
    }

    get mount() {
        return this._mountX;
    }

    set mount(v) {
        if (this._mountX !== v || this._mountY !== v) {
            this._mountX = v;
            this._mountY = v;
            this._updateLocalTranslate();
        }
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(v) {
        if (this._rotation !== v) {
            this._rotation = v;
            this._updateLocalTransform();
        }
    }

    get alpha() {
        return this._alpha;
    }

    set alpha(v) {
        // Account for rounding errors.
        v = v > 1 ? 1 : v < 1e-14 ? 0 : v;
        if (this._alpha !== v) {
            const prev = this._alpha;
            this._alpha = v;
            this.updateLocalAlpha();
            if ((prev === 0) !== (v === 0)) {
                this._element._updateEnabledFlag();
            }
        }
    }

    get visible() {
        return this._visible;
    }

    set visible(v) {
        if (this._visible !== v) {
            this._visible = v;
            this.updateLocalAlpha();
            this._element._updateEnabledFlag();

            if (this.hasFlexLayout()) {
                this.layout.updateVisible();
            }
        }
    }

    _updateLocalTransform() {
        if (this._rotation !== 0 && this._rotation % (2 * Math.PI)) {
            // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
            const _sr = Math.sin(this._rotation);
            const _cr = Math.cos(this._rotation);

            this._setLocalTransform(_cr * this._scaleX, -_sr * this._scaleY, _sr * this._scaleX, _cr * this._scaleY);
        } else {
            this._setLocalTransform(this._scaleX, 0, 0, this._scaleY);
        }
        this._updateLocalTranslate();
    }

    _updateLocalTranslate() {
        this.updateLocalTranslate();
        this._triggerRecalcTranslate();
    }

    private updateLocalTranslate() {
        const pivotXMul = this._pivotX * this._w;
        const pivotYMul = this._pivotY * this._h;
        let px = this._x - (pivotXMul * this._localTa + pivotYMul * this._localTb) + pivotXMul;
        let py = this._y - (pivotXMul * this._localTc + pivotYMul * this._localTd) + pivotYMul;
        px -= this._mountX * this._w;
        py -= this._mountY * this._h;
        this._localPx = px;
        this._localPy = py;
    }

    private updateLocalTranslateDelta(dx: number, dy: number) {
        this._addLocalTranslate(dx, dy);
    }

    private updateLocalAlpha() {
        this._setLocalAlpha(this._visible ? this._alpha : 0);
    }

    hasUpdates() {
        return this._hasUpdates;
    }

    hasRenderUpdates() {
        return this._hasRenderUpdates > 0;
    }

    hasRenderTextureUpdates() {
        return this._hasRenderUpdates >= 3;
    }

    clearHasRenderUpdates() {
        this._hasRenderUpdates = 0;
    }

    /**
     * @param level - Level of updates:
     *  0: no updates
     *  1: re-invoke shader
     *  3: re-create render texture and re-invoke shader
     */
    setHasRenderUpdates(level: number) {
        if (this._worldContext.alpha) {
            // Ignore if 'world invisible'. Render updates will be reset to 3 for every element that becomes visible.
            let p: ElementCore | undefined = this as ElementCore;
            p!._hasRenderUpdates = Math.max(level, p!._hasRenderUpdates);
            while (true) {
                p = p!._parent;
                if (!p || p._hasRenderUpdates >= 3) {
                    break;
                }
                p._hasRenderUpdates = 3;
            }
        }
    }

    /**
     * Marks recalculation updates.
     * @param type - What needs to be recalculated
     *  1: alpha
     *  2: translate
     *  4: transform
     *  128: becomes visible
     *  256: flex layout updated
     */
    private setFlag(type: number) {
        this.flags |= type;

        this._setHasUpdates();

        // Any changes in descendants should trigger texture updates.
        if (this._parent) {
            this._parent.setHasRenderUpdates(3);
        }
    }

    _setHasUpdates() {
        let p = this as ElementCore | undefined;
        while (p && !p._hasUpdates) {
            p._hasUpdates = true;
            p = p._parent;
        }
    }

    getParent(): ElementCore | undefined {
        return this._parent;
    }

    private setParent(parent?: ElementCore) {
        if (parent !== this._parent) {
            const prevIsZContext = this.isZContext();
            const prevParent = this._parent;
            this._parent = parent;

            // Notify flex layout engine.
            if (this._layout || FlexNode.getActiveLayoutNode(parent)?.isFlexEnabled()) {
                this.layout.setParent(prevParent, parent);
            }

            if (prevParent) {
                // When elements are deleted, the render texture must be re-rendered.
                prevParent.setHasRenderUpdates(3);
            }

            this.setFlag(1 + 2 + 4);

            if (this._parent) {
                // Force parent to propagate hasUpdates flag.
                this._parent._setHasUpdates();
            }

            if (this._zIndex === 0) {
                this.setZParent(parent);
            } else {
                this.setZParent(parent ? parent.findZContext() : undefined);
            }

            if (prevIsZContext !== this.isZContext()) {
                if (!this.isZContext()) {
                    this.disableZContext();
                } else {
                    const prevZContext = prevParent ? prevParent.findZContext() : undefined;
                    this.enableZContext(prevZContext);
                }
            }

            // Tree order did change: even if zParent stays the same, we must resort.
            this._zIndexResort = true;
            if (this._zParent) {
                this._zParent.enableZSort();
            }

            if (!this._shader) {
                const newShaderOwner = parent && !parent._renderToTextureEnabled ? parent._shaderOwner : undefined;
                if (newShaderOwner !== this._shaderOwner) {
                    this.setHasRenderUpdates(1);
                    this._setShaderOwnerRecursive(newShaderOwner);
                }
            }
        }
    }

    private enableZSort(force = false) {
        if (!this._zSort && this._zContextUsage > 0) {
            this._zSort = true;
            if (force) {
                // ZSort must be done, even if this element is invisible.
                // This is done to prevent memory leaks when removing element from inactive render branches.
                this.context.forceZSort(this);
            }
        }
    }

    addChildAt(index: number, child: ElementCore) {
        if (!this._children) this._children = [];
        if (this._children.length === index) {
            this._children.push(child);
        } else {
            this._children.splice(index, 0, child);
        }
        child.setParent(this);
    }

    setChildAt(index: number, child: ElementCore) {
        if (!this._children) this._children = [];
        this._children[index].setParent(undefined);
        this._children[index] = child;
        child.setParent(this);
    }

    removeChildAt(index: number) {
        if (this._children) {
            const child = this._children[index];
            this._children.splice(index, 1);
            child.setParent(undefined);
        }
    }

    removeChildren() {
        if (this._children) {
            for (let i = 0, n = this._children.length; i < n; i++) {
                this._children[i].setParent(undefined);
            }

            this._children.splice(0);

            if (this._zIndexedChildren) {
                this._zIndexedChildren.splice(0);
            }
        }
    }

    syncChildren(removed: ElementCore[], added: ElementCore[], order: ElementCore[]) {
        this._children = order;
        for (let i = 0, n = removed.length; i < n; i++) {
            removed[i].setParent(undefined);
        }
        for (let i = 0, n = added.length; i < n; i++) {
            added[i].setParent(this);
        }
    }

    moveChild(fromIndex: number, toIndex: number) {
        if (this._children) {
            const c = this._children[fromIndex];
            this._children.splice(fromIndex, 1);
            this._children.splice(toIndex, 0, c);
        }

        // Tree order changed: must resort!
        this._zIndexResort = true;
        if (this._zParent) {
            this._zParent.enableZSort();
        }
    }

    private _setLocalTransform(a: number, b: number, c: number, d: number) {
        this.setFlag(4);
        this._localTa = a;
        this._localTb = b;
        this._localTc = c;
        this._localTd = d;

        // We also regard negative scaling as a complex case, so that we can optimize the non-complex case better.
        this._isComplex = b !== 0 || c !== 0 || a < 0 || d < 0;
    }

    private _addLocalTranslate(dx: number, dy: number) {
        this._localPx += dx;
        this._localPy += dy;
        this._triggerRecalcTranslate();
    }

    private _setLocalAlpha(a: number) {
        if (!this._worldContext.alpha && this._parent && this._parent._worldContext.alpha && a) {
            // Element is becoming visible. We need to force update.
            this.setFlag(1 + 128);
        } else {
            this.setFlag(1);
        }

        if (a < 1e-14) {
            // Tiny rounding errors may cause failing visibility tests.
            a = 0;
        }

        this._localAlpha = a;
    }

    setTextureDimensions(w: number, h: number, isEstimate: boolean = this._dimsUnknown) {
        // In case of an estimation, the update loop should perform different bound checks.
        this._dimsUnknown = isEstimate;
        if (this._tw !== w || this._th !== h) {
            this._tw = w;
            this._th = h;
            this._updateBaseDimensions();
        }
    }

    private _updateBaseDimensions() {
        if (this._funcW || this._funcH) {
            this._triggerRecalcTranslate();
        }

        const w = this._sw || this._tw;
        const h = this._sh || this._th;

        if (this.hasFlexLayout()) {
            // Notify layout.
            this.layout.updatedSourceW();
            this.layout.updatedSourceH();
        } else {
            if ((!this._funcW && this._w !== w) || (!this._funcH && this._h !== h)) {
                if (!this._funcW) {
                    this._w = w;
                }

                if (!this._funcH) {
                    this._h = h;
                }

                this.onDimensionsChanged();
            }
        }
    }

    setLayoutCoords(x: number, y: number) {
        if (this._x !== x || this._y !== y) {
            this._x = x;
            this._y = y;
            this._updateLocalTranslate();
        }
    }

    setLayoutDimensions(w: number, h: number) {
        if (this._w !== w || this._h !== h) {
            this._w = w;
            this._h = h;

            this.onDimensionsChanged();
        }
    }

    private onDimensionsChanged() {
        // Due to width/height change: update the translation vector.
        this._updateLocalTranslate();

        if (this._texturizer) {
            this._texturizer.releaseRenderTexture();
            this._texturizer.updateResultTexture();
        }

        this.element._onResize(this._w, this._h);
    }

    setTextureCoords(ulx: number, uly: number, brx: number, bry: number) {
        this.setHasRenderUpdates(3);

        this.ulx = ulx;
        this.uly = uly;
        this.brx = brx;
        this.bry = bry;
    }

    get displayedTextureSource(): TextureSource | undefined {
        return this._displayedTextureSource;
    }

    setDisplayedTextureSource(textureSource: TextureSource | undefined) {
        this.setHasRenderUpdates(3);
        this._displayedTextureSource = textureSource;
    }

    get isRoot(): boolean {
        return this._isRoot;
    }

    setupAsRoot() {
        // Use parent dummy.
        this._parent = new ElementCore(this._element);

        // After setting root, make sure it's updated.
        this._parent.w = this.context.stage.coordsWidth;
        this._parent.h = this.context.stage.coordsHeight;
        this._parent._hasRenderUpdates = 3;
        this._parent._hasUpdates = true;

        // Root is, and will always be, the primary zContext.
        this._isRoot = true;

        this.context.root = this;

        // Set scissor area of 'fake parent' to stage's viewport.
        this._parent._viewport = [0, 0, this.context.stage.coordsWidth, this.context.stage.coordsHeight];
        this._parent._scissor = this._parent._viewport;

        // When recBoundsMargin is undefined, the defaults are used (100 for all sides).
        this._parent._recBoundsMargin = undefined;

        this.setFlag(1 + 2 + 4);
    }

    private isAncestorOf(c: ElementCore) {
        let p: ElementCore | undefined = c as ElementCore;

        while (true) {
            p = p!._parent;
            if (!p) {
                return false;
            }
            if (this === p) return true;
        }
    }

    private isZContext(): boolean {
        return (
            this._forceZIndexContext ||
            this._renderToTextureEnabled ||
            this._zIndex !== 0 ||
            this._isRoot ||
            !this._parent
        );
    }

    private findZContext(): ElementCore {
        if (this.isZContext()) {
            return this;
        } else {
            return this._parent!.findZContext();
        }
    }

    private setZParent(newZParent?: ElementCore) {
        if (this._zParent !== newZParent) {
            if (this._zParent) {
                if (this._zIndex !== 0) {
                    this._zParent.decZContextUsage();
                }

                // We must filter out this item upon the next resort.
                this._zParent.enableZSort();
            }

            if (newZParent !== undefined) {
                const hadZContextUsage = newZParent._zContextUsage > 0;

                // @pre: new parent's children array has already been modified.
                if (this._zIndex !== 0) {
                    newZParent.incZContextUsage();
                }

                if (newZParent._zContextUsage > 0) {
                    if (!hadZContextUsage && this._parent === newZParent) {
                        // This child was already in the children list.
                        // Do not add double.
                    } else {
                        // Add new child to array.
                        newZParent._zIndexedChildren!.push(this);
                    }

                    // Order should be checked.
                    newZParent.enableZSort();
                }
            }

            this._zParent = newZParent;

            // Newly added element must be marked for resort.
            this._zIndexResort = true;
        }
    }

    private incZContextUsage() {
        this._zContextUsage++;
        if (this._zContextUsage === 1) {
            if (!this._zIndexedChildren) {
                this._zIndexedChildren = [];
            }
            if (this._children) {
                // Copy.
                for (let i = 0, n = this._children.length; i < n; i++) {
                    this._zIndexedChildren.push(this._children[i]);
                }
                // Initially, children are already sorted properly (tree order).
                this._zSort = false;
            }
        }
    }

    private decZContextUsage() {
        this._zContextUsage--;
        if (this._zContextUsage === 0) {
            this._zSort = false;
            this._zIndexedChildren!.splice(0);
        }
    }

    get zIndex(): number {
        return this._zIndex;
    }

    set zIndex(zIndex: number) {
        if (this._zIndex !== zIndex) {
            this.setHasRenderUpdates(1);

            let newZParent = this._zParent;

            const prevIsZContext = this.isZContext();
            if (zIndex === 0 && this._zIndex !== 0) {
                if (this._parent === this._zParent) {
                    if (this._zParent) {
                        this._zParent.decZContextUsage();
                    }
                } else {
                    newZParent = this._parent;
                }
            } else if (zIndex !== 0 && this._zIndex === 0) {
                newZParent = this._parent ? this._parent.findZContext() : undefined;
                if (newZParent === this._zParent) {
                    if (this._zParent) {
                        this._zParent.incZContextUsage();
                        this._zParent.enableZSort();
                    }
                }
            } else if (zIndex !== this._zIndex) {
                if (this._zParent && this._zParent._zContextUsage) {
                    this._zParent.enableZSort();
                }
            }

            if (newZParent !== this._zParent) {
                this.setZParent(undefined);
            }

            this._zIndex = zIndex;

            if (newZParent !== this._zParent) {
                this.setZParent(newZParent);
            }

            if (prevIsZContext !== this.isZContext()) {
                if (!this.isZContext()) {
                    this.disableZContext();
                } else {
                    const prevZContext = this._parent ? this._parent.findZContext() : undefined;
                    this.enableZContext(prevZContext);
                }
            }

            // Make sure that resort is done.
            this._zIndexResort = true;
            if (this._zParent) {
                this._zParent.enableZSort();
            }
        }
    }

    get forceZIndexContext() {
        return this._forceZIndexContext;
    }

    set forceZIndexContext(v) {
        this.setHasRenderUpdates(1);

        const prevIsZContext = this.isZContext();
        this._forceZIndexContext = v;

        if (prevIsZContext !== this.isZContext()) {
            if (!this.isZContext()) {
                this.disableZContext();
            } else {
                const prevZContext = this._parent ? this._parent.findZContext() : undefined;
                this.enableZContext(prevZContext);
            }
        }
    }

    private enableZContext(prevZContext?: ElementCore) {
        if (prevZContext && prevZContext._zContextUsage > 0) {
            // Transfer from upper z context to this z context.
            const results = this._getZIndexedDescs();
            results.forEach((c) => {
                if (this.isAncestorOf(c) && c._zIndex !== 0) {
                    c.setZParent(this);
                }
            });
        }
    }

    private _getZIndexedDescs() {
        const results: ElementCore[] = [];
        if (this._children) {
            for (let i = 0, n = this._children.length; i < n; i++) {
                this._children[i]._getZIndexedDescsRec(results);
            }
        }
        return results;
    }

    private _getZIndexedDescsRec(results: ElementCore[]) {
        if (this._zIndex) {
            results.push(this);
        } else if (this._children && !this.isZContext()) {
            for (let i = 0, n = this._children.length; i < n; i++) {
                this._children[i]._getZIndexedDescsRec(results);
            }
        }
    }

    private disableZContext() {
        // Transfer from this z context to upper z context.
        if (this._zContextUsage > 0) {
            const newZParent = this._parent ? this._parent.findZContext() : undefined;

            // Make sure that z-indexed children are up to date (old ones removed).
            if (this._zSort) {
                this.sortZIndexedChildren();
            }

            this._zIndexedChildren!.slice().forEach((c) => {
                if (c._zIndex !== 0) {
                    c.setZParent(newZParent);
                }
            });
        }
    }

    get colorUl() {
        return this._colorUl;
    }

    set colorUl(color) {
        if (this._colorUl !== color) {
            this.setHasRenderUpdates(this._displayedTextureSource ? 3 : 1);
            this._colorUl = color;
        }
    }

    get colorUr() {
        return this._colorUr;
    }

    set colorUr(color) {
        if (this._colorUr !== color) {
            this.setHasRenderUpdates(this._displayedTextureSource ? 3 : 1);
            this._colorUr = color;
        }
    }

    get colorBl() {
        return this._colorBl;
    }

    set colorBl(color) {
        if (this._colorBl !== color) {
            this.setHasRenderUpdates(this._displayedTextureSource ? 3 : 1);
            this._colorBl = color;
        }
    }

    get colorBr() {
        return this._colorBr;
    }

    set colorBr(color) {
        if (this._colorBr !== color) {
            this.setHasRenderUpdates(this._displayedTextureSource ? 3 : 1);
            this._colorBr = color;
        }
    }

    set onUpdate(f: ElementEventCallback | undefined) {
        this._onUpdate = f;
        this.setFlag(7);
    }

    get onUpdate() {
        return this._onUpdate;
    }

    set onAfterUpdate(f: ElementEventCallback | undefined) {
        this._onAfterUpdate = f;
        this.setFlag(7);
    }

    get onAfterUpdate() {
        return this._onUpdate;
    }

    set onAfterCalcs(f: ElementEventCallback | undefined) {
        this._onAfterCalcs = f;
        this.setFlag(7);
    }

    get onAfterCalcs() {
        return this._onUpdate;
    }

    get shader() {
        return this._shader;
    }

    set shader(v) {
        this.setHasRenderUpdates(1);

        const prevShader = this._shader;
        this._shader = v;
        if (!v && prevShader) {
            // Disabled shader.
            const newShaderOwner =
                this._parent && !this._parent._renderToTextureEnabled ? this._parent._shaderOwner : undefined;
            this._setShaderOwnerRecursive(newShaderOwner);
        } else if (v) {
            // Enabled shader.
            this._setShaderOwnerRecursive(this);
        }
    }

    get activeShader() {
        return this._shaderOwner ? this._shaderOwner.shader! : this.renderState.defaultShader;
    }

    get activeShaderOwner() {
        return this._shaderOwner;
    }

    get clipping() {
        return this._clipping;
    }

    set clipping(v) {
        if (this._clipping !== v) {
            this._clipping = v;

            // Force update of scissor by updating translate.
            // Alpha must also be updated because the scissor area may have been empty.
            this.setFlag(1 + 2);
        }
    }

    get clipbox() {
        return this._clipbox;
    }

    set clipbox(v) {
        // In case of out-of-bounds element, all children will also be ignored.
        // It will save us from executing the update/render loops for those.
        // The optimization will be used immediately during the next frame.
        this._clipbox = v;
    }

    private _setShaderOwnerRecursive(elementCore?: ElementCore) {
        this._shaderOwner = elementCore;

        if (this._children && !this._renderToTextureEnabled) {
            for (let i = 0, n = this._children.length; i < n; i++) {
                const c = this._children[i];
                if (!c._shader) {
                    c._setShaderOwnerRecursive(elementCore);
                    c._hasRenderUpdates = 3;
                }
            }
        }
    }

    private _setShaderOwnerChildrenRecursive(elementCore?: ElementCore) {
        if (this._children) {
            for (let i = 0, n = this._children.length; i < n; i++) {
                const c = this._children[i];
                if (!c._shader) {
                    c._setShaderOwnerRecursive(elementCore);
                    c._hasRenderUpdates = 3;
                }
            }
        }
    }

    private _hasRenderContext() {
        return this._renderContext !== this._worldContext;
    }

    get renderContext() {
        return this._renderContext;
    }

    public updateRenderToTextureEnabled() {
        // Enforce texturizer initialisation.
        const texturizer = this.texturizer;
        const v = texturizer.enabled;

        if (v) {
            this._enableRenderToTexture();
        } else {
            this._disableRenderToTexture();
            texturizer.releaseRenderTexture();
        }
    }

    private _enableRenderToTexture() {
        if (!this._renderToTextureEnabled) {
            const prevIsZContext = this.isZContext();

            this._renderToTextureEnabled = true;

            this._renderContext = new ElementCoreContext();

            // If render to texture is active, a new shader context is started.
            this._setShaderOwnerChildrenRecursive(undefined);

            if (!prevIsZContext) {
                // Render context forces z context.
                this.enableZContext(this._parent ? this._parent.findZContext() : undefined);
            }

            this.setHasRenderUpdates(3);

            // Make sure that the render coordinates get updated.
            this.setFlag(7);

            this.render = this._renderAdvanced;
        }
    }

    private _disableRenderToTexture() {
        if (this._renderToTextureEnabled) {
            this._renderToTextureEnabled = false;

            this._setShaderOwnerChildrenRecursive(this._shaderOwner);

            this._renderContext = this._worldContext;

            if (!this.isZContext()) {
                this.disableZContext();
            }

            // Make sure that the render coordinates get updated.
            this.setFlag(7);

            this.setHasRenderUpdates(3);

            this.render = this._renderSimple;
        }
    }

    public isWhite() {
        return (
            this._colorUl === 0xffffffff &&
            this._colorUr === 0xffffffff &&
            this._colorBl === 0xffffffff &&
            this._colorBr === 0xffffffff
        );
    }

    public hasSimpleTexCoords() {
        return this.ulx === 0 && this.uly === 0 && this.brx === 1 && this.bry === 1;
    }

    private _stashTexCoords() {
        this._stashedTexCoords = [this.ulx, this.uly, this.brx, this.bry];
        this.ulx = 0;
        this.uly = 0;
        this.brx = 1;
        this.bry = 1;
    }

    private _unstashTexCoords() {
        this.ulx = this._stashedTexCoords![0];
        this.uly = this._stashedTexCoords![1];
        this.brx = this._stashedTexCoords![2];
        this.bry = this._stashedTexCoords![3];
        this._stashedTexCoords = undefined;
    }

    private _stashColors() {
        this._stashedColors = [this._colorUl, this._colorUr, this._colorBr, this._colorBl];
        this._colorUl = 0xffffffff;
        this._colorUr = 0xffffffff;
        this._colorBr = 0xffffffff;
        this._colorBl = 0xffffffff;
    }

    private _unstashColors() {
        this._colorUl = this._stashedColors![0];
        this._colorUr = this._stashedColors![1];
        this._colorBr = this._stashedColors![2];
        this._colorBl = this._stashedColors![3];
        this._stashedColors = undefined;
    }

    isDisplayed() {
        return this._visible;
    }

    isVisible() {
        return this._localAlpha > 1e-14;
    }

    get outOfBounds() {
        return this._outOfBounds;
    }

    set boundsMargin(v) {
        /**
         *  undefined: inherit from parent.
         *  number[4]: specific margins: left, top, right, bottom.
         */
        this._boundsMargin = v ? v.slice() : undefined;

        // We force recalc in order to set all boundsMargin recursively during the next update.
        this._triggerRecalcTranslate();
    }

    get boundsMargin() {
        return this._boundsMargin;
    }

    private hasRelativeDimensionFunctions() {
        return this._relFuncFlags & 12;
    }

    public update(): void {
        // Inherit flags.
        this.flags |= this._parent!.updatedFlags & 135;

        if (this._layout && this._layout.isEnabled()) {
            const relativeDimsFlexRoot = this.isFlexLayoutRoot() && this.hasRelativeDimensionFunctions();
            if (this.flags & 256 || relativeDimsFlexRoot) {
                this._layout.layoutFlexTree();
            }
        } else if (this.flags & 2 && this._relFuncFlags) {
            this._applyRelativeDimFuncs();
        }

        if (this._onUpdate) {
            // Block all 'upwards' updates when changing things in this branch.
            this._hasUpdates = true;
            this._onUpdate({ element: this.element });
        }

        const pw = this._parent!._worldContext;
        const w = this._worldContext;
        const visible = pw.alpha && this._localAlpha;

        /**
         * We must update if:
         * - branch contains updates (even when invisible because it may contain z-indexed descendants)
         * - there are (inherited) updates and this branch is visible
         * - this branch becomes invisible (descs may be z-indexed so we must update all alpha values)
         */
        if (this._hasUpdates || (this.flags && visible) || (w.alpha && !visible)) {
            let recalc = this.flags;

            // Update world coords/alpha.
            if (recalc & 1) {
                if (!w.alpha && visible) {
                    // Becomes visible.
                    this._hasRenderUpdates = 3;
                }
                w.alpha = pw.alpha * this._localAlpha;

                if (w.alpha < 1e-14) {
                    // Tiny rounding errors may cause failing visibility tests.
                    w.alpha = 0;
                }
            }

            if (recalc & 6) {
                w.px = pw.px + this._localPx * pw.ta;
                w.py = pw.py + this._localPy * pw.td;
                if (pw.tb !== 0) w.px += this._localPy * pw.tb;
                if (pw.tc !== 0) w.py += this._localPx * pw.tc;
            }

            if (recalc & 4) {
                w.ta = this._localTa * pw.ta;
                w.tb = this._localTd * pw.tb;
                w.tc = this._localTa * pw.tc;
                w.td = this._localTd * pw.td;

                if (this._isComplex) {
                    w.ta += this._localTc * pw.tb;
                    w.tb += this._localTb * pw.ta;
                    w.tc += this._localTc * pw.td;
                    w.td += this._localTb * pw.tc;
                }
            }

            // Update render coords/alpha.
            const pr = this._parent!._renderContext;
            if (this._parent!._hasRenderContext()) {
                const init = this._renderContext === this._worldContext;
                if (init) {
                    // First render context build: make sure that it is fully initialized correctly.
                    // Otherwise, if we get into bounds later, the render context would not be initialized correctly.
                    this._renderContext = new ElementCoreContext();
                }

                const rc = this._renderContext;

                // Update world coords/alpha.
                if (init || recalc & 1) {
                    rc.alpha = pr.alpha * this._localAlpha;

                    if (rc.alpha < 1e-14) {
                        rc.alpha = 0;
                    }
                }

                if (init || recalc & 6) {
                    rc.px = pr.px + this._localPx * pr.ta;
                    rc.py = pr.py + this._localPy * pr.td;
                    if (pr.tb !== 0) rc.px += this._localPy * pr.tb;
                    if (pr.tc !== 0) rc.py += this._localPx * pr.tc;
                }

                if (init) {
                    // We set the recalc toggle, because we must make sure that the scissor is updated.
                    recalc |= 2;
                }

                if (init || recalc & 4) {
                    rc.ta = this._localTa * pr.ta;
                    rc.tb = this._localTd * pr.tb;
                    rc.tc = this._localTa * pr.tc;
                    rc.td = this._localTd * pr.td;

                    if (this._isComplex) {
                        rc.ta += this._localTc * pr.tb;
                        rc.tb += this._localTb * pr.ta;
                        rc.tc += this._localTc * pr.td;
                        rc.td += this._localTb * pr.tc;
                    }
                }
            } else {
                this._renderContext = this._worldContext;
            }

            if (this.context.updateTreeOrder === -1) {
                this.context.updateTreeOrder = this._updateTreeOrder + 1;
            } else {
                this._updateTreeOrder = this.context.updateTreeOrder++;
            }

            // Determine whether we must use a 'renderTexture'.
            const useRenderToTexture = this._renderToTextureEnabled && this._texturizer!.mustRenderToTexture();
            if (this._useRenderToTexture !== useRenderToTexture) {
                // Coords must be changed.
                this.flags |= 2 + 4;

                // Scissor may change: force update.
                recalc |= 2;

                if (!this._useRenderToTexture) {
                    // We must release the texture.
                    this._texturizer!.release();
                }
            }
            this._useRenderToTexture = useRenderToTexture;

            const r = this._renderContext;

            const bboxW = this._dimsUnknown ? 2048 : this._w;
            const bboxH = this._dimsUnknown ? 2048 : this._h;

            // Calculate a bbox for this element.
            let sx;
            let sy;
            let ex;
            let ey;
            const rComplex = r.tb !== 0 || r.tc !== 0 || r.ta < 0 || r.td < 0;
            if (rComplex) {
                sx = Math.min(0, bboxW * r.ta, bboxW * r.ta + bboxH * r.tb, bboxH * r.tb) + r.px;
                ex = Math.max(0, bboxW * r.ta, bboxW * r.ta + bboxH * r.tb, bboxH * r.tb) + r.px;
                sy = Math.min(0, bboxW * r.tc, bboxW * r.tc + bboxH * r.td, bboxH * r.td) + r.py;
                ey = Math.max(0, bboxW * r.tc, bboxW * r.tc + bboxH * r.td, bboxH * r.td) + r.py;
            } else {
                sx = r.px;
                ex = r.px + r.ta * bboxW;
                sy = r.py;
                ey = r.py + r.td * bboxH;
            }

            if (this._dimsUnknown && (rComplex || this._localTa < 1 || this._localTd < 1)) {
                // If we are dealing with a non-identity matrix, we must extend the bbox so that withinBounds and
                //  scissors will include the complete range of (positive) dimensions.
                const nx = this._x * pr.ta + this._y * pr.tb + pr.px;
                const ny = this._x * pr.tc + this._y * pr.td + pr.py;
                if (nx < sx) sx = nx;
                if (ny < sy) sy = ny;
                if (nx > ex) ex = nx;
                if (ny > ey) ey = ny;
            }

            if (recalc & 6 || !this._scissor /* initial */) {
                // Determine whether we must 'clip'.
                if (this._clipping && r.isSquare()) {
                    // If the parent renders to a texture, it's scissor should be ignored;
                    const area = this._parent!._useRenderToTexture ? this._parent!._viewport : this._parent!._scissor;
                    if (area) {
                        // Merge scissor areas.
                        const lx = Math.max(area[0], sx);
                        const ly = Math.max(area[1], sy);
                        this._scissor = [
                            lx,
                            ly,
                            Math.min(area[2] + area[0], ex) - lx,
                            Math.min(area[3] + area[1], ey) - ly,
                        ];
                    } else {
                        this._scissor = [sx, sy, ex - sx, ey - sy];
                    }
                } else {
                    // No clipping: reuse parent scissor.
                    this._scissor = this._parent!._useRenderToTexture
                        ? this._parent!._viewport
                        : this._parent!._scissor;
                }
            }

            // Calculate the outOfBounds margin.
            if (this._boundsMargin) {
                this._recBoundsMargin = this._boundsMargin;
            } else {
                this._recBoundsMargin = this._parent!._recBoundsMargin;
            }

            if (this._onAfterCalcs) {
                this._onAfterCalcs({ element: this.element });
                // After calcs may change render coords, scissor and/or recBoundsMargin.

                // Recalculate bbox.
                if (rComplex) {
                    sx = Math.min(0, bboxW * r.ta, bboxW * r.ta + bboxH * r.tb, bboxH * r.tb) + r.px;
                    ex = Math.max(0, bboxW * r.ta, bboxW * r.ta + bboxH * r.tb, bboxH * r.tb) + r.px;
                    sy = Math.min(0, bboxW * r.tc, bboxW * r.tc + bboxH * r.td, bboxH * r.td) + r.py;
                    ey = Math.max(0, bboxW * r.tc, bboxW * r.tc + bboxH * r.td, bboxH * r.td) + r.py;
                } else {
                    sx = r.px;
                    ex = r.px + r.ta * bboxW;
                    sy = r.py;
                    ey = r.py + r.td * bboxH;
                }

                if (this._dimsUnknown && (rComplex || this._localTa < 1 || this._localTb < 1)) {
                    const nx = this._x * pr.ta + this._y * pr.tb + pr.px;
                    const ny = this._x * pr.tc + this._y * pr.td + pr.py;
                    if (nx < sx) sx = nx;
                    if (ny < sy) sy = ny;
                    if (nx > ex) ex = nx;
                    if (ny > ey) ey = ny;
                }
            }

            if (this._parent!._outOfBounds === 2) {
                // Inherit parent out of boundsness.
                this._outOfBounds = 2;

                if (this._withinBoundsMargin) {
                    this._withinBoundsMargin = false;
                    this.element._disableWithinBoundsMargin();
                }
            } else {
                if (recalc & 6) {
                    // Recheck if element is out-of-bounds (all settings that affect this should enable recalc bit 2 or 4).
                    this._outOfBounds = 0;
                    let withinMargin = true;

                    // Offscreens are always rendered as long as the parent is within bounds.
                    if (!this._renderToTextureEnabled || !this._texturizer || !this._texturizer.renderOffscreen) {
                        const scissor = this._scissor!;
                        if (scissor && (scissor[2] <= 0 || scissor[3] <= 0)) {
                            // Empty scissor area.
                            this._outOfBounds = 2;
                        } else {
                            // Use bbox to check out-of-boundness.
                            if (
                                scissor[0] > ex ||
                                scissor[1] > ey ||
                                sx > scissor[0] + scissor[2] ||
                                sy > scissor[1] + scissor[3]
                            ) {
                                this._outOfBounds = 1;
                            }

                            if (this._outOfBounds) {
                                if (this._clipping || this._useRenderToTexture || (this._clipbox && bboxW && bboxH)) {
                                    this._outOfBounds = 2;
                                }
                            }
                        }

                        withinMargin = this._outOfBounds === 0;
                        if (!withinMargin) {
                            // Re-test, now with margins.
                            if (this._recBoundsMargin) {
                                withinMargin = !(
                                    ex < scissor[0] - this._recBoundsMargin[2] ||
                                    ey < scissor[1] - this._recBoundsMargin[3] ||
                                    sx > scissor[0] + scissor[2] + this._recBoundsMargin[0] ||
                                    sy > scissor[1] + scissor[3] + this._recBoundsMargin[1]
                                );
                            } else {
                                withinMargin = !(
                                    ex < scissor[0] - 100 ||
                                    ey < scissor[1] - 100 ||
                                    sx > scissor[0] + scissor[2] + 100 ||
                                    sy > scissor[1] + scissor[3] + 100
                                );
                            }
                            if (withinMargin && this._outOfBounds === 2) {
                                // Children must be visited because they may contain elements that are within margin, so must be visible.
                                this._outOfBounds = 1;
                            }
                        }
                    }

                    if (this._withinBoundsMargin !== withinMargin) {
                        this._withinBoundsMargin = withinMargin;

                        if (this._withinBoundsMargin) {
                            // This may update things (txLoaded events) in the element itself, but also in descendants and ancestors.

                            // Changes in ancestors should be executed during the next call of the stage update. But we must
                            // take care that the _recalc and _hasUpdates flags are properly registered. That's why we clear
                            // both before entering the children, and use _pRecalc to transfer inherited updates instead of
                            // _recalc directly.

                            // Changes in descendants are automatically executed within the current update loop, though we must
                            // take care to not update the hasUpdates flag unnecessarily in ancestors. We achieve this by making
                            // sure that the hasUpdates flag of this element is turned on, which blocks it for ancestors.
                            this._hasUpdates = true;

                            const savedRecalc = this.flags;
                            this.flags = 0;
                            this.element._enableWithinBoundsMargin();

                            if (this.flags) {
                                this.flags = savedRecalc | this.flags;

                                // This element needs to be re-updated now, because we want the dimensions (and other changes) to be updated.
                                return this.update();
                            }

                            this.flags = savedRecalc;
                        } else {
                            this.element._disableWithinBoundsMargin();
                        }
                    }
                }
            }

            if (this._useRenderToTexture) {
                // Set viewport necessary for children scissor calculation.
                if (this._viewport) {
                    this._viewport[2] = bboxW;
                    this._viewport[3] = bboxH;
                } else {
                    this._viewport = [0, 0, bboxW, bboxH];
                }
            }

            // Copy inheritable flags (except layout).
            this.updatedFlags = this.flags & 151;

            // Clear flags so that future updates are properly detected.
            this.flags = 0;
            this._hasUpdates = false;

            if (this._outOfBounds < 2) {
                if (this._useRenderToTexture) {
                    if (this._worldContext.isIdentity()) {
                        // Optimization.
                        // The world context is already identity: use the world context as render context to prevents the
                        // ancestors from having to update the render context.
                        this._renderContext = this._worldContext;
                    } else {
                        // Temporarily replace the render coord attribs by the identity matrix.
                        // This allows the children to calculate the render context.
                        this._renderContext = ElementCoreContext.IDENTITY;
                    }
                }

                if (this._children) {
                    for (let i = 0, n = this._children.length; i < n; i++) {
                        this._children[i].update();
                    }
                }

                if (this._useRenderToTexture) {
                    this._renderContext = r;
                }
            } else {
                if (this._children) {
                    for (let i = 0, n = this._children.length; i < n; i++) {
                        if (this._children[i]._hasUpdates) {
                            this._children[i].update();
                        } else {
                            // Make sure we don't lose the 'inherited' updates when they become active again.
                            this._children[i].flags |= this.updatedFlags;
                            this._children[i].updateOutOfBounds();
                        }
                    }
                }
            }

            if (this._onAfterUpdate) {
                this._onAfterUpdate({ element: this.element });
            }
        } else {
            if (this.context.updateTreeOrder === -1 || this._updateTreeOrder >= this.context.updateTreeOrder) {
                // If new tree order does not interfere with the current (gaps allowed) there's no need to traverse the branch.
                this.context.updateTreeOrder = -1;
            } else {
                this.updateTreeOrder();
            }
        }
    }

    _applyRelativeDimFuncs() {
        const layoutParent = this.getLayoutParent()!;
        if (this._relFuncFlags & 1) {
            const x = this._funcX!(layoutParent._w, layoutParent._h);
            if (x !== this._x) {
                this._localPx += x - this._x;
                this._x = x;
            }
        }
        if (this._relFuncFlags & 2) {
            const y = this._funcY!(layoutParent._w, layoutParent._h);
            if (y !== this._y) {
                this._localPy += y - this._y;
                this._y = y;
            }
        }

        let changedDims = false;
        if (this._relFuncFlags & 4) {
            const w = this._funcW!(layoutParent._w, layoutParent._h);
            if (w !== this._w) {
                this._w = w;
                changedDims = true;
            }
        }
        if (this._relFuncFlags & 8) {
            const h = this._funcH!(layoutParent._w, layoutParent._h);
            if (h !== this._h) {
                this._h = h;
                changedDims = true;
            }
        }

        if (changedDims) {
            this.onDimensionsChanged();
        }
    }

    private getLayoutParent() {
        let current: ElementCore = this.getParent()!;
        while (current.skipInLayout) {
            const parent = current.getParent();
            if (!parent) return current;
            current = parent;
        }
        return current;
    }

    updateOutOfBounds() {
        // Propagate outOfBounds flag to descendants (necessary because of z-indexing).
        // Invisible elements are not drawn anyway. When alpha is updated, so will _outOfBounds.
        if (this._outOfBounds !== 2 && this._renderContext.alpha > 0) {
            // Inherit parent out of boundsness.
            this._outOfBounds = 2;

            if (this._withinBoundsMargin) {
                this._withinBoundsMargin = false;
                this.element._disableWithinBoundsMargin();
            }

            if (this._children) {
                for (let i = 0, n = this._children.length; i < n; i++) {
                    this._children[i].updateOutOfBounds();
                }
            }
        }
    }

    updateTreeOrder() {
        if (this._localAlpha && this._outOfBounds !== 2) {
            this._updateTreeOrder = this.context.updateTreeOrder++;

            if (this._children) {
                for (let i = 0, n = this._children.length; i < n; i++) {
                    this._children[i].updateTreeOrder();
                }
            }
        }
    }

    _renderSimple() {
        this._hasRenderUpdates = 0;

        if (this._zSort) {
            this.sortZIndexedChildren();
        }

        if (this._outOfBounds < 2 && this._renderContext.alpha) {
            const renderState = this.renderState;

            if (this._outOfBounds === 0 && this._displayedTextureSource) {
                renderState.setShader(this.activeShader, this._shaderOwner);
                renderState.setScissor(this._scissor!);
                renderState.addElementCore(this);
            }

            // Also add children to the VBO.
            if (this._children) {
                if (this._zContextUsage) {
                    for (let i = 0, n = this._zIndexedChildren!.length; i < n; i++) {
                        this._zIndexedChildren![i].render();
                    }
                } else {
                    for (let i = 0, n = this._children.length; i < n; i++) {
                        if (this._children[i]._zIndex === 0) {
                            // If zIndex is set, this item already belongs to a zIndexedChildren array in one of the ancestors.
                            this._children[i].render();
                        }
                    }
                }
            }
        }
    }

    _renderAdvanced() {
        const hasRenderUpdates = this._hasRenderUpdates;

        // We must clear the hasRenderUpdates flag before rendering, because updating result textures in combination
        // with z-indexing may trigger render updates on a render branch that is 'half done'.
        // We need to ensure that the full render branch is marked for render updates, not only half (leading to freeze).
        this._hasRenderUpdates = 0;

        if (this._zSort) {
            this.sortZIndexedChildren();
        }

        if (this._outOfBounds < 2 && this._renderContext.alpha) {
            const renderState = this.renderState;

            let mustRenderChildren = true;
            let renderTextureInfo!: RenderTextureInfo;
            let prevRenderTextureInfo;
            if (this._useRenderToTexture) {
                if (this._w === 0 || this._h === 0) {
                    // Ignore this branch and don't draw anything.
                    return;
                } else if (!this._texturizer!.hasRenderTexture() || hasRenderUpdates >= 3) {
                    // Switch to default shader for building up the render texture.
                    renderState.setShader(renderState.defaultShader, this);

                    prevRenderTextureInfo = renderState.renderTextureInfo;

                    renderTextureInfo = {
                        renderTexture: undefined,
                        reusableTexture: undefined,
                        reusableRenderStateOffset: 0, // Set by CoreRenderState.
                        w: this._w,
                        h: this._h,
                        empty: true,
                        cleared: false,
                        ignore: false,
                        cache: false,
                    };

                    if (
                        this._texturizer!.hasResultTexture() ||
                        (!renderState.isCachingTexturizer && hasRenderUpdates < 3)
                    ) {
                        /**
                         * Normally, we cache render textures. But there are exceptions to preserve memory usage!
                         *
                         * The rule is, that caching for a specific render texture is only enabled if:
                         * - There is a result texture to be updated.
                         * - There were no render updates -within the contents- since last frame (ElementCore.hasRenderUpdates < 3)
                         * - AND there are no ancestors that are being cached during this frame (CoreRenderState.isCachingTexturizer)
                         *   If an ancestor is cached anyway, deeper caches are unlikely to be used. If the top level is to
                         *   change later while a lower one is not, that lower level will be cached instead at that instant.
                         *
                         * In some cases, this prevents having to cache all blur levels and stages, saving a huge amount
                         * of GPU memory!
                         *
                         * Especially when using multiple stacked layers of the same dimensions that are render-to-texture this will have a very
                         * noticable effect on performance as less render textures need to be allocated.
                         */
                        renderTextureInfo.cache = true;
                        renderState.isCachingTexturizer = true;
                    }

                    if (!this._texturizer!.hasResultTexture()) {
                        // We can already release the current texture to the pool, as it will be rebuild anyway.
                        // In case of multiple layers of 'filtering', this may save us from having to create one
                        //  render-to-texture layer.
                        // Notice that we don't do this when there is a result texture, as any other element may rely on
                        //  that result texture being filled.
                        this._texturizer!.releaseRenderTexture();
                    }

                    renderState.setRenderTextureInfo(renderTextureInfo);
                    renderState.setScissor(undefined);

                    if (this._displayedTextureSource) {
                        const r = this._renderContext;

                        // Use an identity context for drawing the displayed texture to the render texture.
                        this._renderContext = ElementCoreContext.IDENTITY;

                        // Add displayed texture source in local coordinates.
                        this.renderState.addElementCore(this);

                        this._renderContext = r;
                    }
                } else {
                    mustRenderChildren = false;
                }
            } else {
                if (this._outOfBounds === 0 && this._displayedTextureSource) {
                    renderState.setShader(this.activeShader, this._shaderOwner);
                    renderState.setScissor(this._scissor);
                    this.renderState.addElementCore(this);
                }
            }

            // Also add children to the VBO.
            if (mustRenderChildren && this._children) {
                if (this._zContextUsage) {
                    for (let i = 0, n = this._zIndexedChildren!.length; i < n; i++) {
                        this._zIndexedChildren![i].render();
                    }
                } else {
                    for (let i = 0, n = this._children.length; i < n; i++) {
                        if (this._children[i]._zIndex === 0) {
                            // If zIndex is set, this item already belongs to a zIndexedChildren array in one of the ancestors.
                            this._children[i].render();
                        }
                    }
                }
            }

            if (this._useRenderToTexture) {
                let updateResultTexture = false;
                if (mustRenderChildren) {
                    // Finished refreshing renderTexture.
                    renderState.finishedRenderTexture();

                    // If nothing was rendered, we store a flag in the texturizer and prevent unnecessary
                    //  render-to-texture and filtering.
                    this._texturizer!.empty = renderTextureInfo.empty;

                    if (renderTextureInfo.empty) {
                        // We ignore empty render textures and do not draw the final quad.

                        // The following cleans up memory and enforces that the result texture is also cleared.
                        this._texturizer!.releaseRenderTexture();
                    } else if (renderTextureInfo.reusableTexture) {
                        // If nativeTexture is set, we can reuse that directly instead of creating a new render texture.
                        this._texturizer!.reuseTextureAsRenderTexture(renderTextureInfo.reusableTexture);

                        renderTextureInfo.ignore = true;
                    } else {
                        if (this._texturizer!.renderTextureReused) {
                            // Quad operations must be written to a render texture actually owned.
                            this._texturizer!.releaseRenderTexture();
                        }
                        // Just create the render texture.
                        renderTextureInfo.renderTexture = this._texturizer!.getRenderTexture();
                    }

                    // Restore the parent's render texture.
                    renderState.setRenderTextureInfo(prevRenderTextureInfo);

                    updateResultTexture = true;
                }

                if (!this._texturizer!.empty) {
                    const resultTexture = this._texturizer!.getResultTexture();
                    if (updateResultTexture) {
                        if (resultTexture) {
                            // Logging the update frame can be handy.
                            resultTexture.updateFrame = this.element.stage.frameCounter;
                        }
                        this._texturizer!.updateResultTexture();
                    }

                    if (!this._texturizer!.renderOffscreen) {
                        // Render result texture to the actual render target.
                        renderState.setShader(this.activeShader, this._shaderOwner);
                        renderState.setScissor(this._scissor);

                        // If no render texture info is set, the cache can be reused.
                        const cache = !renderTextureInfo || renderTextureInfo.cache;

                        renderState.setTexturizer(this._texturizer!, cache);
                        this._stashTexCoords();
                        if (!this._texturizer!.colorize) this._stashColors();
                        this.renderState.addElementCore(this);
                        if (!this._texturizer!.colorize) this._unstashColors();
                        this._unstashTexCoords();
                        renderState.setTexturizer(undefined, false);
                    }
                }
            }

            if (renderTextureInfo && renderTextureInfo.cache) {
                // Allow siblings to cache.
                renderState.isCachingTexturizer = false;
            }
        }
    }

    get zSort() {
        return this._zSort;
    }

    sortZIndexedChildren() {
        /**
         * We want to avoid resorting everything. Instead, we do a single pass of the full array:
         * - filtering out elements with a different zParent than this (were removed)
         * - filtering out, but also gathering (in a temporary array) the elements that have zIndexResort flag
         * - then, finally, we merge-sort both the new array and the 'old' one
         * - element may have been added 'double', so when merge-sorting also check for doubles.
         * - if the old one is larger (in size) than it should be, splice off the end of the array.
         */

        const n = this._zIndexedChildren!.length;
        let ptr = 0;
        const a = this._zIndexedChildren!;

        // Notice that items may occur multiple times due to z-index changing.
        const b = [];
        for (let i = 0; i < n; i++) {
            if (a[i]._zParent === this) {
                if (a[i]._zIndexResort) {
                    b.push(a[i]);
                } else {
                    if (ptr !== i) {
                        a[ptr] = a[i];
                    }
                    ptr++;
                }
            }
        }

        const m = b.length;
        if (m) {
            for (let j = 0; j < m; j++) {
                b[j]._zIndexResort = false;
            }

            b.sort(ElementCore.sortZIndexedChildren);
            const amount = ptr;
            if (!amount) {
                ptr = 0;
                let j = 0;
                do {
                    a[ptr++] = b[j++];
                } while (j < m);

                if (a.length > ptr) {
                    // Slice old (unnecessary) part off array.
                    a.splice(ptr);
                }
            } else {
                // Merge-sort arrays;
                ptr = 0;
                let i = 0;
                let j = 0;
                const mergeResult: ElementCore[] = [];
                do {
                    const v =
                        a[i]._zIndex === b[j]._zIndex
                            ? a[i]._updateTreeOrder - b[j]._updateTreeOrder
                            : a[i]._zIndex - b[j]._zIndex;

                    const add = v > 0 ? b[j++] : a[i++];

                    if (ptr === 0 || mergeResult[ptr - 1] !== add) {
                        mergeResult[ptr++] = add;
                    }

                    if (i >= amount) {
                        do {
                            const elementCore = b[j++];
                            if (ptr === 0 || mergeResult[ptr - 1] !== elementCore) {
                                mergeResult[ptr++] = elementCore;
                            }
                        } while (j < m);
                        break;
                    } else if (j >= m) {
                        do {
                            const elementCore = a[i++];
                            if (ptr === 0 || mergeResult[ptr - 1] !== elementCore) {
                                mergeResult[ptr++] = elementCore;
                            }
                        } while (i < amount);
                        break;
                    }
                } while (true);

                this._zIndexedChildren = mergeResult;
            }
        } else {
            if (a.length > ptr) {
                // Slice old (unnecessary) part off array.
                a.splice(ptr);
            }
        }

        this._zSort = false;
    }

    get localTa() {
        return this._localTa;
    }

    get localTb() {
        return this._localTb;
    }

    get localTc() {
        return this._localTc;
    }

    get localTd() {
        return this._localTd;
    }

    get element() {
        return this._element;
    }

    get renderUpdates() {
        return this._hasRenderUpdates;
    }

    get texturizer() {
        if (!this._texturizer) {
            this._texturizer = new ElementTexturizer(this);
        }
        return this._texturizer;
    }

    getCornerPoints() {
        const w = this._worldContext;

        return [
            w.px,
            w.py,
            w.px + this._w * w.ta,
            w.py + this._w * w.tc,
            w.px + this._w * w.ta + this._h * w.tb,
            w.py + this._w * w.tc + this._h * w.td,
            w.px + this._h * w.tb,
            w.py + this._h * w.td,
        ];
    }

    getRenderTextureCoords(relX: number, relY: number) {
        const r = this._renderContext;
        return [r.px + r.ta * relX + r.tb * relY, r.py + r.tc * relX + r.td * relY];
    }

    getAbsoluteCoords(relX: number, relY: number) {
        const w = this._renderContext;
        return [w.px + w.ta * relX + w.tb * relY, w.py + w.tc * relX + w.td * relY];
    }

    get skipInLayout(): boolean {
        return this._layout ? this._layout.skip : false;
    }

    set skipInLayout(v: boolean) {
        if (this.skipInLayout !== v) {
            // Force an update as absolute layout may be affected (on itself or on layout children).
            this._triggerRecalcTranslate();
            this.layout.skip = v;
        }
    }

    get layout(): FlexNode {
        this._ensureLayout();
        return this._layout!;
    }

    hasLayout(): boolean {
        return !!this._layout;
    }

    getLayout(): FlexNode {
        return this.layout;
    }

    enableFlexLayout() {
        this._ensureLayout();
    }

    private _ensureLayout() {
        if (!this._layout) {
            this._layout = new FlexNode(this);
        }
    }

    disableFlexLayout() {
        this._triggerRecalcTranslate();
    }

    hasFlexLayout() {
        return this._layout && this._layout.isEnabled();
    }

    private isFlexLayoutRoot() {
        return this._layout && this._layout.isLayoutRoot();
    }

    getFlexContainer(): FlexContainer | undefined {
        return this.layout.isFlexEnabled() ? this.layout.flex : undefined;
    }

    getFlexItem(): FlexItem | undefined {
        return this.layout.flexItem;
    }

    triggerLayout() {
        this.setFlag(256);
    }

    _triggerRecalcTranslate() {
        this.setFlag(2);
    }

    public getRenderWidth() {
        return this._w;
    }

    public getRenderHeight() {
        return this._h;
    }

    public isWithinBoundsMargin(): boolean {
        return this._withinBoundsMargin;
    }

    get parent() {
        return this._parent;
    }

    hasTexturizer(): boolean {
        return !!this._texturizer;
    }

    getChildren(): ElementCore[] | undefined {
        return this._children;
    }

    getSourceFuncX() {
        return this._funcX;
    }

    getSourceFuncY() {
        return this._funcY;
    }

    getSourceFuncW() {
        return this._funcW;
    }

    getSourceFuncH() {
        return this._funcH;
    }

    static sortZIndexedChildren(a: ElementCore, b: ElementCore) {
        return a._zIndex === b._zIndex ? a._updateTreeOrder - b._updateTreeOrder : a._zIndex - b._zIndex;
    }

    getSourceX() {
        return this._sx;
    }

    getSourceY() {
        return this._sy;
    }

    getSourceW() {
        // If no source width is specified, the texture width is automatically used.
        return this._sw || this._tw;
    }

    getSourceH() {
        return this._sh || this._th;
    }

    getLayoutX() {
        return this._x;
    }

    getLayoutY() {
        return this._y;
    }

    getLayoutW() {
        return this._w;
    }

    getLayoutH() {
        return this._h;
    }

    convertWorldCoordsToLocal(worldX: number, worldY: number): number[] {
        const wc = this._worldContext;
        worldX = worldX - wc.px;
        worldY = worldY - wc.py;
        if (wc.isIdentity()) {
            return [worldX, worldY];
        } else if (wc.isSquare()) {
            return [worldX / wc.ta, worldY / wc.td];
        } else {
            // Solve linear system of equations by substitution.
            const tcTa = wc.tc / wc.ta;
            const iy = (worldY - tcTa * worldX) / (wc.td - wc.tb * tcTa);
            const ix = (worldX - wc.tb * iy) / wc.ta;
            return [ix, iy];
        }
    }

    public isCoordsWithinElement(localOffsetX: number, localOffsetY: number) {
        return localOffsetX >= 0 && localOffsetY >= 0 && localOffsetX < this._w && localOffsetY < this._h;
    }

    private getCoordinatesOrigin(): ElementCore {
        const parent = this._parent!;
        if (!parent) {
            return this;
        } else if (parent._useRenderToTexture) {
            return parent;
        } else {
            return parent.getCoordinatesOrigin();
        }
    }

    private isWorldCoordinatesInScissor(worldX: number, worldY: number) {
        const s = this._scissor;
        if (s) {
            const renderRoot = this.getCoordinatesOrigin();
            const [rx, ry] = renderRoot.convertWorldCoordsToLocal(worldX, worldY);

            if (rx < s[0] || ry < s[1] || rx >= s[0] + s[2] || ry >= s[1] + s[3]) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    /**
     * @pre element core must be up-to-date (update method called).
     */
    gatherElementsAtCoordinates(worldX: number, worldY: number, results: ElementCoordinatesInfo[]) {
        let withinBounds = false;

        if (!this._renderContext.alpha) {
            return;
        }

        const [offsetX, offsetY] = this.convertWorldCoordsToLocal(worldX, worldY);

        // Make coords relative to world context.
        withinBounds = this.isCoordsWithinElement(offsetX, offsetY);

        if (withinBounds && this.zIndex !== 0) {
            // We must make sure that the not yet visited ancestors do not clip out this texture.
            // renderToTexture is no problem as it creates a new z context so must already be checked.
            // clipping is a possible problem, so we must check the scissor.
            if (!this.isWorldCoordinatesInScissor(worldX, worldY)) {
                withinBounds = false;
            }
        }

        if (withinBounds) {
            results.push({ offsetX, offsetY, element: this.element });
        }

        // When the render context is not square, clipping is ignored while rendering.
        const useClipping = this._useRenderToTexture || (this._clipping && this._renderContext.isSquare());
        const mustRecurse = withinBounds || !useClipping;

        if (this._children && mustRecurse) {
            if (this._zContextUsage) {
                for (let i = 0, n = this._zIndexedChildren!.length; i < n; i++) {
                    this._zIndexedChildren![i].gatherElementsAtCoordinates(worldX, worldY, results);
                }
            } else {
                for (let i = 0, n = this._children.length; i < n; i++) {
                    if (this._children[i]._zIndex === 0) {
                        // If zIndex is set, this item already belongs to a zIndexedChildren array in one of the ancestors.
                        this._children[i].gatherElementsAtCoordinates(worldX, worldY, results);
                    }
                }
            }
        }
    }

    checkWithinBounds() {
        this.setFlag(6);
    }
}

export type ElementCoordinatesInfo<DATA = any> = {
    offsetX: number;
    offsetY: number;
    element: Element<DATA>;
};

export type RelativeFunction = (parentW: number, parentH: number) => number;
