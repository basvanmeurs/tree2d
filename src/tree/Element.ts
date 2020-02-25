/**
 * Render tree node.
 * Copyright Metrological, 2017
 */

import ElementCore, { FunctionH, FunctionW, FunctionX, FunctionY } from "./core/ElementCore";
import Base from "./Base";

import Utils from "./Utils";
import Shader from "./Shader";

class Element {
    private static id: number = 1;

    public readonly stage: Stage;

    private readonly __id: number = Element.id++;

    private readonly __core: ElementCore;

    private __ref?: string;

    // An element is attached if it is a descendant of the stage root.
    private __attached: boolean = false;

    // An element is enabled when it is attached and it is visible (worldAlpha > 0).
    private __enabled: boolean = false;

    // An element is active when it is enabled and it is within bounds.
    private __active: boolean = false;

    private __parent?: Element;

    // The texture that is currently set.
    private __texture?: Texture;

    // The currently displayed texture. May differ from this.texture while loading.
    private __displayedTexture?: Texture;

    // Contains the child elements.
    private __childList?: ElementChildList;

    private listeners?: ElementListeners;

    constructor(stage: Stage) {
        this.stage = stage;

        this.__core = new ElementCore(this);
    }

    private getListeners(): ElementListeners {
        if (!this.listeners) {
            this.listeners = new ElementListeners();
        }
        return this.listeners;
    }

    get id(): number {
        return this.__id;
    }

    set ref(ref: string | undefined) {
        if (this.__ref !== ref) {
            if (this.__ref !== undefined) {
                if (this.__parent !== undefined) {
                    this.__parent._children.clearRef(this.__ref);
                }
            }

            this.__ref = ref;

            if (this.__ref) {
                if (this.__parent) {
                    this.__parent._children.setRef(this.__ref, this);
                }
            }
        }
    }

    get ref(): string | undefined {
        return this.__ref;
    }

    get core(): ElementCore {
        return this.__core;
    }

    setAsRoot(): void {
        this.__core.setAsRoot();
        this._updateAttachedFlag();
        this._updateEnabledFlag();
    }

    get isRoot(): boolean {
        return this.__core.isRoot;
    }

    _setParent(parent: Element) {
        if (this.__parent === parent) return;

        this.__parent = parent;

        this._updateAttachedFlag();
        this._updateEnabledFlag();

        if (this.isRoot && parent) {
            this._throwError("Root should not be added as a child! Results are unspecified!");
        }
    }

    get attached(): boolean {
        return this.__attached;
    }

    get enabled(): boolean {
        return this.__enabled;
    }

    get active(): boolean {
        return this.__active;
    }

    private _isAttached(): boolean {
        return this.__parent ? this.__parent.__attached : this.isRoot;
    }

    private _isEnabled(): boolean {
        return this.__core.visible && this.__core.alpha > 0 && (this.__parent ? this.__parent.__enabled : this.isRoot);
    }

    private _isActive(): boolean {
        return this._isEnabled() && this.isWithinBoundsMargin();
    }

    protected _updateAttachedFlag(): void {
        const newAttached = this._isAttached();
        if (this.__attached !== newAttached) {
            this.__attached = newAttached;

            if (newAttached) {
                this._onSetup();
            }

            const children = this._children.get();
            if (children) {
                const m = children.length;
                if (m > 0) {
                    for (let i = 0; i < m; i++) {
                        children[i]._updateAttachedFlag();
                    }
                }
            }

            if (newAttached) {
                this._onAttach();
            } else {
                this._onDetach();
            }
        }
    }

    public _updateEnabledFlag(): void {
        const newEnabled = this._isEnabled();
        if (this.__enabled !== newEnabled) {
            if (newEnabled) {
                this._onEnabled();
                this._setEnabledFlag();
            } else {
                this._onDisabled();
                this._unsetEnabledFlag();
            }

            const children = this._children.get();
            if (children) {
                const m = children.length;
                if (m > 0) {
                    for (let i = 0; i < m; i++) {
                        children[i]._updateEnabledFlag();
                    }
                }
            }
        }
    }

    private _setEnabledFlag(): void {
        this.__enabled = true;

        // Force re-check of texture because dimensions might have changed (cutting).
        this._updateTextureDimensions();
        this._updateTextureCoords();

        if (this.__texture) {
            this.__texture.addElement(this);
        }

        if (this.isWithinBoundsMargin()) {
            this._setActiveFlag();
        }

        if (this.__core.shader) {
            this.__core.shader.addElement(this.__core);
        }
    }

    private _unsetEnabledFlag(): void {
        if (this.__active) {
            this._unsetActiveFlag();
        }

        if (this.__texture) {
            this.__texture.removeElement(this);
        }

        if (this.__core.shader) {
            this.__core.shader.removeElement(this.__core);
        }

        this.__enabled = false;
    }

    private _setActiveFlag(): void {
        this.__active = true;

        // This must happen before enabling the texture, because it may already be loaded or load directly.
        if (this.__texture) {
            this.__texture.incActiveCount();
        }

        if (this.__texture) {
            this._enableTexture();
        }
        this._onActive();
    }

    private _unsetActiveFlag(): void {
        if (this.__texture) {
            this.__texture.decActiveCount();
        }

        this.__active = false;
        if (this.__texture) {
            this._disableTexture();
        }

        if (this._hasTexturizer()) {
            this.texturizer.deactivate();
        }

        this._onInactive();
    }

    public set onSetup(v: Function | undefined) {
        this.getListeners().onSetup = v;
    }

    protected _onSetup(): void {
        if (this.listeners && this.listeners.onSetup) {
            this.listeners.onSetup(this);
        }
    }

    public set onAttach(v: Function | undefined) {
        this.getListeners().onAttach = v;
    }

    protected _onAttach(): void {
        if (this.listeners && this.listeners.onAttach) {
            this.listeners.onAttach(this);
        }
    }

    public set onDetach(v: Function | undefined) {
        this.getListeners().onDetach = v;
    }

    protected _onDetach(): void {
        if (this.listeners && this.listeners.onDetach) {
            this.listeners.onDetach(this);
        }
    }

    public set onEnabled(v: Function | undefined) {
        this.getListeners().onEnabled = v;
    }

    protected _onEnabled(): void {
        if (this.listeners && this.listeners.onEnabled) {
            this.listeners.onEnabled(this);
        }
    }

    public set onDisabled(v: Function | undefined) {
        this.getListeners().onDisabled = v;
    }

    protected _onDisabled(): void {
        if (this.listeners && this.listeners.onDisabled) {
            this.listeners.onDisabled(this);
        }
    }

    public set onActive(v: Function | undefined) {
        this.getListeners().onActive = v;
    }

    protected _onActive(): void {
        if (this.listeners && this.listeners.onActive) {
            this.listeners.onActive(this);
        }
    }

    public set onInactive(v: Function | undefined) {
        this.getListeners().onInactive = v;
    }

    protected _onInactive(): void {
        if (this.listeners && this.listeners.onInactive) {
            this.listeners.onInactive(this);
        }
    }

    public set onTextureError(v: Function | undefined) {
        this.getListeners().onTextureError = v;
    }

    protected _onTextureError(loadError: any, source: any): void {
        if (this.listeners && this.listeners.onTextureError) {
            this.listeners.onTextureError(this, loadError, source);
        }
    }

    public set onTextureLoaded(v: Function | undefined) {
        this.getListeners().onTextureLoaded = v;
    }

    protected _onTextureLoaded(texture: Texture): void {
        if (this.listeners && this.listeners.onTextureLoaded) {
            this.listeners.onTextureLoaded(this, texture);
        }
    }

    public set onTextureUnloaded(v: Function | undefined) {
        this.getListeners().onTextureUnloaded = v;
    }

    protected _onTextureUnloaded(texture: Texture): void {
        if (this.listeners && this.listeners.onTextureUnloaded) {
            this.listeners.onTextureUnloaded(this, texture);
        }
    }

    public set onResize(v: Function | undefined) {
        this.getListeners().onResize = v;
    }

    public _onResize(w: number, h: number): void {
        if (this.listeners && this.listeners.onResize) {
            this.listeners.onResize(this, w, h);
        }
    }

    get renderWidth(): number {
        return this.__core.getRenderWidth();
    }

    get renderHeight(): number {
        return this.__core.getRenderHeight();
    }

    get finalX(): number {
        return this.__core.x;
    }

    get finalY(): number {
        return this.__core.y;
    }

    get finalW(): number {
        return this.__core.w;
    }

    get finalH(): number {
        return this.__core.h;
    }

    textureIsLoaded(): boolean {
        return this.__texture && this.__texture.isLoaded();
    }

    loadTexture(): void {
        if (this.__texture) {
            this.__texture.load();

            if (!this.__texture.isUsed() || !this._isEnabled()) {
                // As this element is invisible, loading the texture will have no effect on the dimensions of this element.
                // To help the developers, automatically update the dimensions.
                this._updateTextureDimensions();
            }
        }
    }

    private _enableTextureError(): void {
        // txError event should automatically be re-triggered when a element becomes active.
        const loadError = this.__texture!.loadError;
        if (loadError) {
            this._onTextureError(loadError, this.__texture!._source);
        }
    }

    private _enableTexture(): void {
        if (this.__texture!.isLoaded()) {
            this._setDisplayedTexture(this.__texture);
        } else {
            // We don't want to retain the old image as it wasn't visible anyway.
            this._setDisplayedTexture(undefined);

            this._enableTextureError();
        }
    }

    private _disableTexture(): void {
        // We disable the displayed texture because, when the texture changes while invisible, we should use that w, h,
        // mw, mh for checking within bounds.
        this._setDisplayedTexture(undefined);
    }

    get texture(): Texture | undefined {
        return this.__texture;
    }

    set texture(v: Texture | undefined) {
        let texture;
        if (!v) {
            texture = undefined;
        } else {
            if (v.isTexture) {
                texture = v;
            } else if (v instanceof TextureSource) {
                texture = new SourceTexture(this.stage);
                texture.textureSource = v;
            } else {
                console.error("Please specify a texture type.");
                return;
            }
        }

        const prevTexture = this.__texture;
        if (texture !== prevTexture) {
            this.__texture = texture as Texture;

            if (this.__texture) {
                if (this.__enabled) {
                    this.__texture.addElement(this);

                    if (this.isWithinBoundsMargin()) {
                        if (this.__texture.isLoaded()) {
                            this._setDisplayedTexture(this.__texture);
                        } else {
                            this._enableTextureError();
                        }
                    }
                }
            } else {
                // Make sure that current texture is cleared when the texture is explicitly set to undefined.
                this._setDisplayedTexture(undefined);
            }

            if (prevTexture && prevTexture !== this.__displayedTexture) {
                prevTexture.removeElement(this);
            }

            this._updateTextureDimensions();
        }
    }

    get displayedTexture(): Texture | undefined {
        return this.__displayedTexture;
    }

    private _setDisplayedTexture(v: Texture | undefined) {
        const prevTexture = this.__displayedTexture;

        if (prevTexture && v !== prevTexture) {
            if (this.__texture !== prevTexture) {
                // The old displayed texture is deprecated.
                prevTexture.removeElement(this);
            }
        }

        const prevSource = this.__core.displayedTextureSource ? this.__core.displayedTextureSource : undefined;
        const sourceChanged = (v ? v._source : undefined) !== prevSource;

        this.__displayedTexture = v;
        this._updateTextureDimensions();

        if (this.__displayedTexture) {
            if (sourceChanged) {
                // We don't need to reference the displayed texture because it was already referenced (this.texture === this.displayedTexture).
                this._updateTextureCoords();
                this.__core.setDisplayedTextureSource(this.__displayedTexture._source);
            }
        } else {
            this.__core.setDisplayedTextureSource(undefined);
        }

        if (sourceChanged) {
            if (this.__displayedTexture) {
                this._onTextureLoaded(this.__displayedTexture);
            } else if (prevTexture) {
                this._onTextureUnloaded(prevTexture);
            }
        }
    }

    onTextureSourceLoaded(): void {
        // This function is called when element is enabled, but we only want to set displayed texture for active elements.
        if (this.active) {
            // We may be dealing with a texture reloading, so we must force update.
            this._setDisplayedTexture(this.__texture);
        }
    }

    onTextureSourceLoadError(loadError: any): void {
        this._onTextureError(loadError, this.__texture!._source);
    }

    forceRenderUpdate(): void {
        this.__core.setHasRenderUpdates(3);
    }

    onDisplayedTextureClippingChanged(): void {
        this._updateTextureDimensions();
        this._updateTextureCoords();
    }

    onPrecisionChanged(): void {
        this._updateTextureDimensions();
    }

    private _updateTextureDimensions(): void {
        let w = 0,
            h = 0;
        if (this.__displayedTexture) {
            w = this.__displayedTexture.getRenderWidth();
            h = this.__displayedTexture.getRenderHeight();
        } else if (this.__texture) {
            // Texture already loaded, but not yet updated (probably because this element is not active).
            w = this.__texture.getRenderWidth();
            h = this.__texture.getRenderWidth();
        }

        let unknownSize = false;
        if (!w || !h) {
            if (!this.__displayedTexture && this.__texture) {
                // We use a 'max width' replacement instead in the ElementCore calcs.
                // This makes sure that it is able to determine withinBounds.
                w = w || this.__texture.mw;
                h = h || this.__texture.mh;

                if ((!w || !h) && this.__texture.isAutosizeTexture()) {
                    unknownSize = true;
                }
            }
        }

        this.__core.setTextureDimensions(w, h, unknownSize);
    }

    private _updateTextureCoords(): void {
        if (this.displayedTexture && this.displayedTexture._source) {
            const displayedTexture = this.displayedTexture;
            const displayedTextureSource = this.displayedTexture._source;

            let tx1 = 0,
                ty1 = 0,
                tx2 = 1.0,
                ty2 = 1.0;
            if (displayedTexture.clipping) {
                // Apply texture clipping.
                const w = displayedTextureSource.getRenderWidth();
                const h = displayedTextureSource.getRenderHeight();
                let iw, ih, rw, rh;
                iw = 1 / w;
                ih = 1 / h;

                if (displayedTexture.pw) {
                    rw = displayedTexture.pw * iw;
                } else {
                    rw = (w - displayedTexture.px) * iw;
                }

                if (displayedTexture.ph) {
                    rh = displayedTexture.ph * ih;
                } else {
                    rh = (h - displayedTexture.py) * ih;
                }

                iw *= displayedTexture.px;
                ih *= displayedTexture.py;

                tx1 = iw;
                ty1 = ih;
                tx2 = tx2 * rw + iw;
                ty2 = ty2 * rh + ih;

                tx1 = Math.max(0, tx1);
                ty1 = Math.max(0, ty1);
                tx2 = Math.min(1, tx2);
                ty2 = Math.min(1, ty2);
            }

            this.__core.setTextureCoords(tx1, ty1, tx2, ty2);
        }
    }

    getCornerPoints(): number[] {
        return this.__core.getCornerPoints();
    }

    getByRef(ref: string) {
        return this.childList.getByRef(ref);
    }

    getLocationString(): string {
        const i = this.__parent ? this.__parent._children.getIndex(this) : "R";
        let str = this.__parent ? this.__parent.getLocationString() : "";
        if (this.ref) {
            str += ":[" + i + "]" + this.ref;
        } else {
            str += ":[" + i + "]#" + this.id;
        }
        return str;
    }

    toString() {
        const obj = this.getSettings();
        return Element.getPrettyString(obj, "");
    }

    static getPrettyString(obj: any, indent: string) {
        const children = obj.children;
        delete obj.children;

        // Convert singular json settings object.
        const colorKeys = ["color", "colorUl", "colorUr", "colorBl", "colorBr"];
        let str = JSON.stringify(obj, function(k, v) {
            if (colorKeys.indexOf(k) !== -1) {
                return "COLOR[" + v.toString(16) + "]";
            }
            return v;
        });
        str = str.replace(/"COLOR\[([a-f0-9]{1,8})\]"/g, "0x$1");

        if (children) {
            let childStr = "";
            if (Utils.isObjectLiteral(children)) {
                const refs = Object.keys(children);
                childStr = "";
                for (let i = 0, n = refs.length; i < n; i++) {
                    childStr += `\n${indent}  "${refs[i]}":`;
                    delete children[refs[i]].ref;
                    childStr += Element.getPrettyString(children[refs[i]], indent + "  ") + (i < n - 1 ? "," : "");
                }
                const isEmpty = str === "{}";
                str = str.substr(0, str.length - 1) + (isEmpty ? "" : ",") + childStr + "\n" + indent + "}";
            } else {
                const n = children.length;
                childStr = "[";
                for (let i = 0; i < n; i++) {
                    childStr += Element.getPrettyString(children[i], indent + "  ") + (i < n - 1 ? "," : "") + "\n";
                }
                childStr += indent + "]}";
                const isEmpty = str === "{}";
                str = str.substr(0, str.length - 1) + (isEmpty ? "" : ",") + '"children":\n' + indent + childStr + "}";
            }
        }

        return str;
    }

    getSettings(): any {
        const settings = this.getNonDefaults();

        const children = this._children.get();
        if (children) {
            const n = children.length;
            if (n) {
                const childArray = [];
                let missing = false;
                for (let i = 0; i < n; i++) {
                    childArray.push(children[i].getSettings());
                    missing = missing || !children[i].ref;
                }

                if (!missing) {
                    settings.children = {};
                    childArray.forEach(child => {
                        settings.children[child.ref] = child;
                    });
                } else {
                    settings.children = childArray;
                }
            }
        }

        settings.id = this.id;

        return settings;
    }

    getNonDefaults(): any {
        const settings: any = {};

        if (this.constructor !== Element) {
            settings.type = this.constructor.name;
        }

        if (this.__ref) {
            settings.ref = this.__ref;
        }

        if (this.x !== 0) settings.x = this.x;
        if (this.y !== 0) settings.y = this.y;
        if (this.w !== 0) settings.w = this.w;
        if (this.h !== 0) settings.h = this.h;

        if (this.scaleX === this.scaleY) {
            if (this.scaleX !== 1) settings.scale = this.scaleX;
        } else {
            if (this.scaleX !== 1) settings.scaleX = this.scaleX;
            if (this.scaleY !== 1) settings.scaleY = this.scaleY;
        }

        if (this.pivotX === this.pivotY) {
            if (this.pivotX !== 0.5) settings.pivot = this.pivotX;
        } else {
            if (this.pivotX !== 0.5) settings.pivotX = this.pivotX;
            if (this.pivotY !== 0.5) settings.pivotY = this.pivotY;
        }

        if (this.mountX === this.mountY) {
            if (this.mountX !== 0) settings.mount = this.mountX;
        } else {
            if (this.mountX !== 0) settings.mountX = this.mountX;
            if (this.mountY !== 0) settings.mountY = this.mountY;
        }

        if (this.alpha !== 1) settings.alpha = this.alpha;

        if (!this.visible) settings.visible = false;

        if (this.rotation !== 0) settings.rotation = this.rotation;

        if (this.colorUl === this.colorUr && this.colorBl === this.colorBr && this.colorUl === this.colorBl) {
            if (this.colorUl !== 0xffffffff) settings.color = this.colorUl.toString(16);
        } else {
            if (this.colorUl !== 0xffffffff) settings.colorUl = this.colorUl.toString(16);
            if (this.colorUr !== 0xffffffff) settings.colorUr = this.colorUr.toString(16);
            if (this.colorBl !== 0xffffffff) settings.colorBl = this.colorBl.toString(16);
            if (this.colorBr !== 0xffffffff) settings.colorBr = this.colorBr.toString(16);
        }

        if (this.zIndex) settings.zIndex = this.zIndex;

        if (this.forceZIndexContext) settings.forceZIndexContext = true;

        if (this.clipping) settings.clipping = this.clipping;

        if (!this.clipbox) settings.clipbox = this.clipbox;

        if (this.__texture) {
            const tnd = this.__texture.getNonDefaults();
            if (Object.keys(tnd).length) {
                settings.texture = tnd;
            }
        }

        if (this._hasTexturizer()) {
            if (this.texturizer.enabled) {
                settings.renderToTexture = this.texturizer.enabled;
            }
            if (this.texturizer.lazy) {
                settings.renderToTextureLazy = this.texturizer.lazy;
            }
            if (this.texturizer.colorize) {
                settings.colorizeResultTexture = this.texturizer.colorize;
            }
            if (this.texturizer.renderOffscreen) {
                settings.renderOffscreen = this.texturizer.renderOffscreen;
            }
        }

        return settings;
    }

    isWithinBoundsMargin() {
        return this.__core.isWithinBoundsMargin();
    }

    _enableWithinBoundsMargin() {
        // Iff enabled, this toggles the active flag.
        if (this.__enabled) {
            this._setActiveFlag();
        }
    }

    _disableWithinBoundsMargin() {
        // Iff active, this toggles the active flag.
        if (this.__active) {
            this._unsetActiveFlag();
        }
    }

    set boundsMargin(v: number[] | undefined) {
        if (!Array.isArray(v) && v !== undefined) {
            throw new Error(
                "boundsMargin should be an array of left-top-right-bottom values or undefined (inherit margin)"
            );
        }
        this.__core.boundsMargin = v;
    }

    get boundsMargin() {
        return this.__core.boundsMargin;
    }

    get x(): number | FunctionX {
        return this.__core.offsetX;
    }

    set x(v: number | FunctionX) {
        this.__core.offsetX = v;
    }

    get y(): number | FunctionY {
        return this.__core.offsetY;
    }

    set y(v: number | FunctionY) {
        this.__core.offsetY = v;
    }

    get w(): number | FunctionW {
        return this.__core.offsetW;
    }

    set w(v) {
        this.__core.offsetW = v;
    }

    get h(): number | FunctionH {
        return this.__core.offsetH;
    }

    set h(v) {
        this.__core.offsetH = v;
    }

    get scaleX() {
        return this.__core.scaleX;
    }

    set scaleX(v) {
        this.__core.scaleX = v;
    }

    get scaleY() {
        return this.__core.scaleY;
    }

    set scaleY(v) {
        this.__core.scaleY = v;
    }

    get scale() {
        return this.__core.scale;
    }

    set scale(v) {
        this.__core.scale = v;
    }

    get pivotX() {
        return this.__core.pivotX;
    }

    set pivotX(v) {
        this.__core.pivotX = v;
    }

    get pivotY() {
        return this.__core.pivotY;
    }

    set pivotY(v) {
        this.__core.pivotY = v;
    }

    get pivot() {
        return this.__core.pivot;
    }

    set pivot(v) {
        this.__core.pivot = v;
    }

    get mountX() {
        return this.__core.mountX;
    }

    set mountX(v) {
        this.__core.mountX = v;
    }

    get mountY() {
        return this.__core.mountY;
    }

    set mountY(v) {
        this.__core.mountY = v;
    }

    get mount() {
        return this.__core.mount;
    }

    set mount(v) {
        this.__core.mount = v;
    }

    get rotation() {
        return this.__core.rotation;
    }

    set rotation(v) {
        this.__core.rotation = v;
    }

    get alpha() {
        return this.__core.alpha;
    }

    set alpha(v) {
        this.__core.alpha = v;
    }

    get visible() {
        return this.__core.visible;
    }

    set visible(v) {
        this.__core.visible = v;
    }

    get colorUl() {
        return this.__core.colorUl;
    }

    set colorUl(v) {
        this.__core.colorUl = v;
    }

    get colorUr() {
        return this.__core.colorUr;
    }

    set colorUr(v) {
        this.__core.colorUr = v;
    }

    get colorBl() {
        return this.__core.colorBl;
    }

    set colorBl(v) {
        this.__core.colorBl = v;
    }

    get colorBr() {
        return this.__core.colorBr;
    }

    set colorBr(v) {
        this.__core.colorBr = v;
    }

    get color() {
        return this.__core.colorUl;
    }

    set color(v) {
        if (this.colorUl !== v || this.colorUr !== v || this.colorBl !== v || this.colorBr !== v) {
            this.colorUl = v;
            this.colorUr = v;
            this.colorBl = v;
            this.colorBr = v;
        }
    }

    get colorTop() {
        return this.colorUl;
    }

    set colorTop(v) {
        if (this.colorUl !== v || this.colorUr !== v) {
            this.colorUl = v;
            this.colorUr = v;
        }
    }

    get colorBottom() {
        return this.colorBl;
    }

    set colorBottom(v) {
        if (this.colorBl !== v || this.colorBr !== v) {
            this.colorBl = v;
            this.colorBr = v;
        }
    }

    get colorLeft() {
        return this.colorUl;
    }

    set colorLeft(v) {
        if (this.colorUl !== v || this.colorBl !== v) {
            this.colorUl = v;
            this.colorBl = v;
        }
    }

    get colorRight() {
        return this.colorUr;
    }

    set colorRight(v) {
        if (this.colorUr !== v || this.colorBr !== v) {
            this.colorUr = v;
            this.colorBr = v;
        }
    }

    get zIndex() {
        return this.__core.zIndex;
    }
    set zIndex(v) {
        this.__core.zIndex = v;
    }

    get forceZIndexContext() {
        return this.__core.forceZIndexContext;
    }
    set forceZIndexContext(v) {
        this.__core.forceZIndexContext = v;
    }

    get clipping() {
        return this.__core.clipping;
    }
    set clipping(v) {
        this.__core.clipping = v;
    }

    get clipbox() {
        return this.__core.clipbox;
    }
    set clipbox(v) {
        this.__core.clipbox = v;
    }

    get _children(): ElementChildList {
        if (!this.__childList) {
            this.__childList = new ElementChildList(this);
        }
        return this.__childList;
    }

    get childList() {
        if (!this._allowChildrenAccess()) {
            this._throwError("Direct access to children is not allowed in " + this.getLocationString());
        }
        return this._children;
    }

    hasChildren() {
        return this._allowChildrenAccess() && this.__childList && this.__childList.length > 0;
    }

    _allowChildrenAccess() {
        return true;
    }

    get children() {
        return this.childList.get();
    }

    set children(children) {
        this.childList.patch(children);
    }

    get p() {
        return this.__parent;
    }

    get parent() {
        return this.__parent;
    }

    get src() {
        if (this.texture && this.texture instanceof ImageTexture) {
            return this.texture._src;
        } else {
            return undefined;
        }
    }

    set src(v) {
        const texture = new ImageTexture(this.stage);
        texture.src = v;
        this.texture = texture;
    }

    set mw(v: number) {
        if (this.texture) {
            this.texture.mw = v;
            this._updateTextureDimensions();
        } else {
            this._throwError("Please set mw after setting a texture.");
        }
    }

    set mh(v: number) {
        if (this.texture) {
            this.texture.mh = v;
            this._updateTextureDimensions();
        } else {
            this._throwError("Please set mh after setting a texture.");
        }
    }

    get rect() {
        return this.texture === this.stage.rectangleTexture;
    }

    set rect(v) {
        if (v) {
            this.texture = this.stage.rectangleTexture;
        } else {
            this.texture = undefined;
        }
    }

    enableTextTexture() {
        if (!this.texture || !(this.texture instanceof TextTexture)) {
            this.texture = (new TextTexture(this.stage)) as any;

            if (this.texture && !this.texture.w && !this.texture.h) {
                // Inherit dimensions from element.
                // This allows userland to set dimensions of the Element and then later specify the text.
                this.texture.w = this.core.w;
                this.texture.h = this.core.h;
            }
        }
        return this.texture;
    }

    set onUpdate(f: Function) {
        this.__core.onUpdate = f;
    }

    set onAfterCalcs(f: Function) {
        this.__core.onAfterCalcs = f;
    }

    set onAfterUpdate(f: Function) {
        this.__core.onAfterUpdate = f;
    }

    forceUpdate() {
        // Make sure that the update loop is run.
        this.__core._setHasUpdates();
    }

    get shader(): Shader | undefined {
        return this.__core.shader;
    }

    set shader(shader: Shader | undefined) {
        if (this.__enabled && this.__core.shader) {
            this.__core.shader.removeElement(this.__core);
        }

        this.__core.shader = shader;

        if (this.__enabled && this.__core.shader) {
            this.__core.shader.addElement(this.__core);
        }
    }

    _hasTexturizer() {
        return this.__core.hasTexturizer();
    }

    get renderToTexture() {
        return this.rtt;
    }

    set renderToTexture(v) {
        this.rtt = v;
    }

    get rtt() {
        return this._hasTexturizer() && this.texturizer.enabled;
    }

    set rtt(v) {
        this.texturizer.enabled = v;
    }

    get rttLazy() {
        return this._hasTexturizer() && this.texturizer.lazy;
    }

    set rttLazy(v) {
        this.texturizer.lazy = v;
    }

    get renderOffscreen() {
        return this._hasTexturizer() && this.texturizer.renderOffscreen;
    }

    set renderOffscreen(v) {
        this.texturizer.renderOffscreen = v;
    }

    get colorizeResultTexture() {
        return this._hasTexturizer() && this.texturizer.colorize;
    }

    set colorizeResultTexture(v) {
        this.texturizer.colorize = v;
    }

    getTexture() {
        return this.texturizer._getTextureSource();
    }

    get texturizer(): ElementTexturizer {
        return this.__core.texturizer;
    }

    _throwError(message: string) {
        throw new Error(this.constructor.name + " (" + this.getLocationString() + "): " + message);
    }

    // @todo: flexbox stuff.
}

import Texture from "./Texture";
import ImageTexture from "../textures/ImageTexture";
import TextTexture from "../textures/TextTexture";
import SourceTexture from "../textures/SourceTexture";
import ElementChildList from "./ElementChildList";
import Stage from "./Stage";
import ElementTexturizer from "./core/ElementTexturizer";
import ElementListeners from "./ElementListeners";
import TextureSource from "./TextureSource";

export default Element;
