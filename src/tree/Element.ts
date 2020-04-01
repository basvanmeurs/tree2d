/**
 * Render tree node.
 * Copyright Metrological, 2017
 * Copyright Bas van Meurs, 2020
 */

import ElementCore, { FunctionH, FunctionW, FunctionX, FunctionY } from "./core/ElementCore";
import Texture from "./Texture";
import ImageTexture from "../textures/ImageTexture";
import TextTexture from "../textures/text/TextTexture";
import ElementChildList from "./ElementChildList";
import Stage from "./Stage";
import ElementTexturizer from "./core/ElementTexturizer";
import ElementListeners, {
    ElementEventCallback,
    ElementResizeEventCallback,
    ElementTextureErrorEventCallback,
    ElementTextureEventCallback,
} from "./ElementListeners";
import { AlignContentMode, AlignItemsMode, FlexDirection, JustifyContentMode } from "flexbox.js";

import Utils from "./Utils";
import Shader from "./Shader";

class Element<DATA = any> {
    private static id: number = 1;

    public readonly stage: Stage;

    private readonly id: number = Element.id++;

    private readonly _core: ElementCore;

    private _ref?: string;

    // An element is attached if it is a descendant of the stage root.
    private _attached: boolean = false;

    // An element is enabled when it is attached and it is visible (worldAlpha > 0).
    private _enabled: boolean = false;

    // An element is active when it is enabled and it is within bounds.
    private _active: boolean = false;

    private _parent?: Element;

    // The texture that is currently set.
    private _texture?: Texture;

    // The currently displayed texture. May differ from this.texture while loading.
    private _displayedTexture?: Texture;

    // Contains the child elements.
    private _childList?: ElementChildList;

    private listeners?: ElementListeners;

    // Custom data
    public data?: DATA;

    constructor(stage: Stage) {
        this.stage = stage;

        this._core = new ElementCore(this);
    }

    private getListeners(): ElementListeners {
        if (!this.listeners) {
            this.listeners = new ElementListeners();
        }
        return this.listeners;
    }

    set ref(ref: string | undefined) {
        if (this._ref !== ref) {
            if (this._ref !== undefined) {
                if (this._parent !== undefined) {
                    this._parent._children.clearRef(this._ref);
                }
            }

            this._ref = ref;

            if (this._ref) {
                if (this._parent) {
                    this._parent._children.setRef(this._ref, this);
                }
            }
        }
    }

    get ref(): string | undefined {
        return this._ref;
    }

    get core(): ElementCore {
        return this._core;
    }

    setAsRoot(): void {
        this._core.setupAsRoot();
        this._updateAttachedFlag();
        this._updateEnabledFlag();
    }

    get isRoot(): boolean {
        return this._core.isRoot;
    }

    _setParent(parent: Element | undefined) {
        if (this._parent === parent) return;

        this._parent = parent;

        this._updateAttachedFlag();
        this._updateEnabledFlag();

        if (this.isRoot && parent) {
            this._throwError("Root should not be added as a child! Results are unspecified!");
        }
    }

    get attached(): boolean {
        return this._attached;
    }

    get enabled(): boolean {
        return this._enabled;
    }

    get active(): boolean {
        return this._active;
    }

    private _isAttached(): boolean {
        return this._parent ? this._parent._attached : this.isRoot;
    }

    private _isEnabled(): boolean {
        return this._core.visible && this._core.alpha > 0 && (this._parent ? this._parent._enabled : this.isRoot);
    }

    private _isActive(): boolean {
        return this._isEnabled() && this.isWithinBoundsMargin();
    }

    protected _updateAttachedFlag(): void {
        const newAttached = this._isAttached();
        if (this._attached !== newAttached) {
            this._attached = newAttached;

            if (newAttached) {
                this._onSetup();
            }

            const children = this._children.getItems();
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
        if (this._enabled !== newEnabled) {
            if (newEnabled) {
                this._onEnabled();
                this._setEnabledFlag();
            } else {
                this._onDisabled();
                this._unsetEnabledFlag();
            }

            const children = this._children.getItems();
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
        this._enabled = true;

        // Force re-check of texture because dimensions might have changed (cutting).
        this._updateTextureDimensions();
        this.updateTextureCoords();

        if (this._texture) {
            this._texture.addElement(this);
        }

        if (this.isWithinBoundsMargin()) {
            this._setActiveFlag();
        }

        if (this._core.shader) {
            this._core.shader.addElement(this._core);
        }
    }

    private _unsetEnabledFlag(): void {
        if (this._active) {
            this._unsetActiveFlag();
        }

        if (this._texture) {
            this._texture.removeElement(this);
        }

        if (this._core.shader) {
            this._core.shader.removeElement(this._core);
        }

        this._enabled = false;
    }

    private _setActiveFlag(): void {
        this._active = true;

        // This must happen before enabling the texture, because it may already be loaded or load directly.
        if (this._texture) {
            this._texture.incActiveCount();
        }

        if (this._texture) {
            this._enableTexture();
        }
        this._onActive();
    }

    private _unsetActiveFlag(): void {
        if (this._texture) {
            this._texture.decActiveCount();
        }

        this._active = false;
        if (this._texture) {
            this._disableTexture();
        }

        if (this._hasTexturizer()) {
            this.texturizer.deactivate();
        }

        this._onInactive();
    }

    public set onSetup(v: ElementEventCallback | undefined) {
        this.getListeners().onSetup = v;
    }

    public get onSetup() {
        return this.getListeners().onSetup;
    }

    protected _onSetup(): void {
        if (this.listeners && this.listeners.onSetup) {
            this.listeners.onSetup(this);
        }
    }

    public set onAttach(v: ElementEventCallback | undefined) {
        this.getListeners().onAttach = v;
    }

    public get onAttach() {
        return this.getListeners().onAttach;
    }

    protected _onAttach(): void {
        if (this.listeners && this.listeners.onAttach) {
            this.listeners.onAttach(this);
        }
    }

    public set onDetach(v: ElementEventCallback | undefined) {
        this.getListeners().onDetach = v;
    }

    public get onDetach() {
        return this.getListeners().onDetach;
    }

    protected _onDetach(): void {
        if (this.listeners && this.listeners.onDetach) {
            this.listeners.onDetach(this);
        }
    }

    public set onEnabled(v: ElementEventCallback | undefined) {
        this.getListeners().onEnabled = v;
    }

    public get onEnabled() {
        return this.getListeners().onEnabled;
    }

    protected _onEnabled(): void {
        if (this.listeners && this.listeners.onEnabled) {
            this.listeners.onEnabled(this);
        }
    }

    public set onDisabled(v: ElementEventCallback | undefined) {
        this.getListeners().onDisabled = v;
    }

    public get onDisabled() {
        return this.getListeners().onDisabled;
    }

    protected _onDisabled(): void {
        if (this.listeners && this.listeners.onDisabled) {
            this.listeners.onDisabled(this);
        }
    }

    public set onActive(v: ElementEventCallback | undefined) {
        this.getListeners().onActive = v;
    }

    public get onActive() {
        return this.getListeners().onActive;
    }

    protected _onActive(): void {
        if (this.listeners && this.listeners.onActive) {
            this.listeners.onActive(this);
        }
    }

    public set onInactive(v: ElementEventCallback | undefined) {
        this.getListeners().onInactive = v;
    }

    public get onInactive() {
        return this.getListeners().onInactive;
    }

    protected _onInactive(): void {
        if (this.listeners && this.listeners.onInactive) {
            this.listeners.onInactive(this);
        }
    }

    public set onTextureError(v: ElementTextureErrorEventCallback | undefined) {
        this.getListeners().onTextureError = v;
    }

    public get onTextureError() {
        return this.getListeners().onTextureError;
    }

    protected _onTextureError(loadError: Error, texture: Texture): void {
        if (this.listeners && this.listeners.onTextureError) {
            this.listeners.onTextureError(this, texture, loadError);
        }
    }

    public set onTextureLoaded(v: ElementTextureEventCallback | undefined) {
        this.getListeners().onTextureLoaded = v;
    }

    public get onTextureLoaded() {
        return this.getListeners().onTextureLoaded;
    }

    protected _onTextureLoaded(texture: Texture): void {
        if (this.listeners && this.listeners.onTextureLoaded) {
            this.listeners.onTextureLoaded(this, texture);
        }
    }

    public set onTextureUnloaded(v: ElementTextureEventCallback | undefined) {
        this.getListeners().onTextureUnloaded = v;
    }

    public get onTextureUnloaded() {
        return this.getListeners().onTextureUnloaded;
    }

    protected _onTextureUnloaded(texture: Texture): void {
        if (this.listeners && this.listeners.onTextureUnloaded) {
            this.listeners.onTextureUnloaded(this, texture);
        }
    }

    public set onResize(v: ElementResizeEventCallback | undefined) {
        this.getListeners().onResize = v;
    }

    public get onResize() {
        return this.getListeners().onResize;
    }

    public _onResize(w: number, h: number): void {
        if (this.listeners && this.listeners.onResize) {
            this.listeners.onResize(this, w, h);
        }
    }

    get renderWidth(): number {
        return this._core.getRenderWidth();
    }

    get renderHeight(): number {
        return this._core.getRenderHeight();
    }

    get layoutX(): number {
        return this._core.getLayoutX();
    }

    get layoutY(): number {
        return this._core.getLayoutY();
    }

    get layoutW(): number {
        return this._core.getLayoutW();
    }

    get layoutH(): number {
        return this._core.getLayoutH();
    }

    textureIsLoaded(): boolean {
        return this._texture ? this._texture.isLoaded() : false;
    }

    loadTexture(): void {
        if (this._texture) {
            this._texture.load();

            if (!this._texture.isUsed() || !this._isEnabled()) {
                // As this element is invisible, loading the texture will have no effect on the dimensions of this element.
                // To help the developers, automatically update the dimensions.
                this._updateTextureDimensions();
            }
        }
    }

    private _enableTextureError(): void {
        // txError event should automatically be re-triggered when a element becomes active.
        const loadError = this._texture!.loadError;
        if (loadError) {
            this._onTextureError(loadError, this._texture!);
        }
    }

    private _enableTexture(): void {
        if (this._texture!.isLoaded()) {
            this.setDisplayedTexture(this._texture);
        } else {
            // We don't want to retain the old image as it wasn't visible anyway.
            this.setDisplayedTexture(undefined);

            this._enableTextureError();
        }
    }

    private _disableTexture(): void {
        // We disable the displayed texture because, when the texture changes while invisible, we should use that w, h,
        // mw, mh for checking within bounds.
        this.setDisplayedTexture(undefined);
    }

    get texture(): Texture | undefined {
        return this._texture;
    }

    set texture(v: Texture | undefined) {
        let texture;
        if (!v) {
            texture = undefined;
        } else {
            texture = v;
        }

        const prevTexture = this._texture;
        if (texture !== prevTexture) {
            this._texture = texture as Texture;

            if (this._texture) {
                if (this._enabled) {
                    this._texture.addElement(this);

                    if (this.isWithinBoundsMargin()) {
                        if (this._texture.isLoaded()) {
                            this.setDisplayedTexture(this._texture);
                        } else {
                            this._enableTextureError();
                        }
                    }
                }
            } else {
                // Make sure that current texture is cleared when the texture is explicitly set to undefined.
                this.setDisplayedTexture(undefined);
            }

            if (prevTexture && prevTexture !== this._displayedTexture) {
                prevTexture.removeElement(this);
            }

            this._updateTextureDimensions();
        }
    }

    get displayedTexture(): Texture | undefined {
        return this._displayedTexture;
    }

    setDisplayedTexture(v: Texture | undefined) {
        const prevTexture = this._displayedTexture;

        if (prevTexture && v !== prevTexture) {
            if (this._texture !== prevTexture) {
                // The old displayed texture is deprecated.
                prevTexture.removeElement(this);
            }
        }

        const prevSource = this._core.displayedTextureSource ? this._core.displayedTextureSource : undefined;
        const sourceChanged = (v ? v.getSource() : undefined) !== prevSource;

        this._displayedTexture = v;
        this._updateTextureDimensions();

        if (this._displayedTexture) {
            if (sourceChanged) {
                // We don't need to reference the displayed texture because it was already referenced (this.texture === this.displayedTexture).
                this.updateTextureCoords();
                this._core.setDisplayedTextureSource(this._displayedTexture.getSource());
            }
        } else {
            this._core.setDisplayedTextureSource(undefined);
        }

        if (sourceChanged) {
            if (this._displayedTexture) {
                this._onTextureLoaded(this._displayedTexture);
            } else if (prevTexture) {
                this._onTextureUnloaded(prevTexture);
            }
        }
    }

    onTextureSourceLoaded(): void {
        // This function is called when element is enabled, but we only want to set displayed texture for active elements.
        if (this.active) {
            // We may be dealing with a texture reloading, so we must force update.
            this.setDisplayedTexture(this._texture);
        }
    }

    onTextureSourceLoadError(loadError: Error): void {
        this._onTextureError(loadError, this._texture!);
    }

    forceRenderUpdate(): void {
        this._core.setHasRenderUpdates(3);
    }

    onDisplayedTextureClippingChanged(): void {
        this._updateTextureDimensions();
        this.updateTextureCoords();
    }

    onPixelRatioChanged(): void {
        this._updateTextureDimensions();
    }

    _updateTextureDimensions(): void {
        let w = 0;
        let h = 0;
        if (this._displayedTexture) {
            w = this._displayedTexture.getRenderWidth();
            h = this._displayedTexture.getRenderHeight();
        } else if (this._texture) {
            // Texture already loaded, but not yet updated (probably because this element is not active).
            w = this._texture.getRenderWidth();
            h = this._texture.getRenderWidth();
        }

        let unknownSize = false;
        if (!w || !h) {
            if (!this._displayedTexture && this._texture) {
                // We use a 'max width' replacement instead in the ElementCore calcs.
                // This makes sure that it is able to determine withinBounds.
                w = w || this._texture.mw;
                h = h || this._texture.mh;

                if ((!w || !h) && this._texture.isAutosizeTexture()) {
                    unknownSize = true;
                }
            }
        }

        this._core.setTextureDimensions(w, h, unknownSize);
    }

    public updateTextureCoords(): void {
        if (this.displayedTexture) {
            const displayedTexture = this.displayedTexture;
            const displayedTextureSource = this.displayedTexture.getSource();

            if (displayedTextureSource) {
                let tx1 = 0;
                let ty1 = 0;
                let tx2 = 1.0;
                let ty2 = 1.0;
                if (displayedTexture.hasClipping()) {
                    // Apply texture clipping.
                    const w = displayedTextureSource.getRenderWidth();
                    const h = displayedTextureSource.getRenderHeight();
                    let iw;
                    let ih;
                    let rw;
                    let rh;
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

                this._core.setTextureCoords(tx1, ty1, tx2, ty2);
            }
        }
    }

    getCornerPoints(): number[] {
        return this._core.getCornerPoints();
    }

    getByRef(ref: string) {
        return this.childList.getByRef(ref);
    }

    getLocationString(): string {
        const i = this._parent ? this._parent._children.getIndex(this) : "R";
        let str = this._parent ? this._parent.getLocationString() : "";
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
        let str = JSON.stringify(obj, (k: string, v: number): string | number => {
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

        const children = this._children.getItems();
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
                    childArray.forEach((child) => {
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

        if (this._ref) {
            settings.ref = this._ref;
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

        if (this._texture) {
            const tnd = this._texture.getNonDefaults();
            if (Object.keys(tnd).length) {
                settings.texture = tnd;
            }
        }

        if (this._hasTexturizer()) {
            if (this.texturizer.enabled) {
                settings.renderToTexture = this.texturizer.enabled;
            }
            if (this.texturizer.lazy) {
                settings.renderToTextureLazy = true;
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
        return this._core.isWithinBoundsMargin();
    }

    _enableWithinBoundsMargin() {
        // Iff enabled, this toggles the active flag.
        if (this._enabled) {
            this._setActiveFlag();
        }
    }

    _disableWithinBoundsMargin() {
        // Iff active, this toggles the active flag.
        if (this._active) {
            this._unsetActiveFlag();
        }
    }

    set boundsMargin(v: number[] | undefined) {
        if (!Array.isArray(v) && v !== undefined) {
            throw new Error(
                "boundsMargin should be an array of left-top-right-bottom values or undefined (inherit margin)",
            );
        }
        this._core.boundsMargin = v;
    }

    get boundsMargin() {
        return this._core.boundsMargin;
    }

    get x(): number | FunctionX {
        return this._core.x;
    }

    set x(v: number | FunctionX) {
        this._core.x = v;
    }

    get y(): number | FunctionY {
        return this._core.y;
    }

    set y(v: number | FunctionY) {
        this._core.y = v;
    }

    get w(): number | FunctionW {
        return this._core.w;
    }

    set w(v) {
        this._core.w = v;
    }

    get h(): number | FunctionH {
        return this._core.h;
    }

    set h(v) {
        this._core.h = v;
    }

    get scaleX() {
        return this._core.scaleX;
    }

    set scaleX(v) {
        this._core.scaleX = v;
    }

    get scaleY() {
        return this._core.scaleY;
    }

    set scaleY(v) {
        this._core.scaleY = v;
    }

    get scale() {
        return this._core.scale;
    }

    set scale(v) {
        this._core.scale = v;
    }

    get pivotX() {
        return this._core.pivotX;
    }

    set pivotX(v) {
        this._core.pivotX = v;
    }

    get pivotY() {
        return this._core.pivotY;
    }

    set pivotY(v) {
        this._core.pivotY = v;
    }

    get pivot() {
        return this._core.pivot;
    }

    set pivot(v) {
        this._core.pivot = v;
    }

    get mountX() {
        return this._core.mountX;
    }

    set mountX(v) {
        this._core.mountX = v;
    }

    get mountY() {
        return this._core.mountY;
    }

    set mountY(v) {
        this._core.mountY = v;
    }

    get mount() {
        return this._core.mount;
    }

    set mount(v) {
        this._core.mount = v;
    }

    get rotation() {
        return this._core.rotation;
    }

    set rotation(v) {
        this._core.rotation = v;
    }

    get alpha() {
        return this._core.alpha;
    }

    set alpha(v) {
        this._core.alpha = v;
    }

    get visible() {
        return this._core.visible;
    }

    set visible(v) {
        this._core.visible = v;
    }

    get colorUl() {
        return this._core.colorUl;
    }

    set colorUl(v) {
        this._core.colorUl = v;
    }

    get colorUr() {
        return this._core.colorUr;
    }

    set colorUr(v) {
        this._core.colorUr = v;
    }

    get colorBl() {
        return this._core.colorBl;
    }

    set colorBl(v) {
        this._core.colorBl = v;
    }

    get colorBr() {
        return this._core.colorBr;
    }

    set colorBr(v) {
        this._core.colorBr = v;
    }

    get color() {
        return this._core.colorUl;
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
        return this._core.zIndex;
    }
    set zIndex(v) {
        this._core.zIndex = v;
    }

    get forceZIndexContext() {
        return this._core.forceZIndexContext;
    }
    set forceZIndexContext(v) {
        this._core.forceZIndexContext = v;
    }

    get clipping() {
        return this._core.clipping;
    }
    set clipping(v) {
        this._core.clipping = v;
    }

    get clipbox() {
        return this._core.clipbox;
    }
    set clipbox(v) {
        this._core.clipbox = v;
    }

    get _children(): ElementChildList {
        if (!this._childList) {
            this._childList = new ElementChildList(this);
        }
        return this._childList;
    }

    get childList() {
        if (!this._allowChildrenAccess()) {
            this._throwError("Direct access to children is not allowed in " + this.getLocationString());
        }
        return this._children;
    }

    hasChildren() {
        return this._allowChildrenAccess() && this._childList && this._childList.length > 0;
    }

    _allowChildrenAccess() {
        return true;
    }

    get children() {
        return this.childList.getItems();
    }

    set children(items: Element[]) {
        this.childList.setItems(items);
    }

    get p() {
        return this._parent;
    }

    get parent() {
        return this._parent;
    }

    get src() {
        if (this.texture && this.texture instanceof ImageTexture) {
            return this.texture.src;
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
            this._throwError("Set mw after setting a texture.");
        }
    }

    get mw() {
        return this.texture ? this.texture.mw : 0;
    }

    set mh(v: number) {
        if (this.texture) {
            this.texture.mh = v;
            this._updateTextureDimensions();
        } else {
            this._throwError("Set mh after setting a texture.");
        }
    }

    get mh() {
        return this.texture ? this.texture.mh : 0;
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
            this.texture = new TextTexture(this.stage) as any;

            if (this.texture && !this.texture.w && !this.texture.h) {
                // Inherit dimensions from element.
                // This allows userland to set dimensions of the Element and then later specify the text.
                this.texture.w = this.core.getSourceW();
                this.texture.h = this.core.getSourceH();
            }
        }
        return this.texture;
    }

    set onUpdate(f: ElementEventCallback | undefined) {
        this._core.onUpdate = f;
    }

    get onUpdate() {
        return this._core.onUpdate;
    }

    set onAfterCalcs(f: ElementEventCallback | undefined) {
        this._core.onAfterCalcs = f;
    }

    get onAfterCalcs() {
        return this._core.onAfterCalcs;
    }

    set onAfterUpdate(f: ElementEventCallback | undefined) {
        this._core.onAfterUpdate = f;
    }

    get onAfterUpdate() {
        return this._core.onAfterUpdate;
    }

    forceUpdate() {
        // Make sure that the update loop is run.
        this._core._setHasUpdates();
    }

    get shader(): Shader | undefined {
        return this._core.shader;
    }

    set shader(shader: Shader | undefined) {
        if (this._enabled && this._core.shader) {
            this._core.shader.removeElement(this._core);
        }

        this._core.shader = shader;

        if (this._enabled && this._core.shader) {
            this._core.shader.addElement(this._core);
        }
    }

    _hasTexturizer() {
        return this._core.hasTexturizer();
    }

    get renderToTexture() {
        return this._hasTexturizer() && this.texturizer.enabled;
    }

    set renderToTexture(v) {
        this.texturizer.enabled = v;
    }

    get renderLazy() {
        return this._hasTexturizer() && this.texturizer.lazy;
    }

    set renderLazy(v) {
        this.texturizer.lazy = v;
    }

    get renderOffscreen() {
        return this._hasTexturizer() && this.texturizer.renderOffscreen;
    }

    set renderOffscreen(v) {
        this.texturizer.renderOffscreen = v;
    }

    get renderColorize() {
        return this._hasTexturizer() && this.texturizer.colorize;
    }

    set renderColorize(v) {
        this.texturizer.colorize = v;
    }

    getTexture() {
        return this.texturizer._getTextureSource();
    }

    get texturizer(): ElementTexturizer {
        return this._core.texturizer;
    }

    _throwError(message: string) {
        throw new Error(this.constructor.name + " (" + this.getLocationString() + "): " + message);
    }

    private get _flex() {
        return this._core.layout.flex;
    }

    private get _flexItem() {
        return this._core.layout.flexItem;
    }

    set flex(v: boolean) {
        this._flex.enabled = v;
    }

    get flex() {
        return this._flex.enabled;
    }

    set flexDirection(v: FlexDirection) {
        this._flex.direction = v;
    }

    get flexDirection() {
        return this._flex.direction;
    }

    set flexWrap(v: boolean) {
        this._flex.wrap = v;
    }

    get flexWrap() {
        return this._flex.wrap;
    }

    set flexAlignItems(v: AlignItemsMode) {
        this._flex.alignItems = v;
    }

    get flexAlignItems() {
        return this._flex.alignItems;
    }

    set flexJustifyContent(v: JustifyContentMode) {
        this._flex.justifyContent = v;
    }

    get flexJustifyContent() {
        return this._flex.justifyContent;
    }

    set flexAlignContent(v: AlignContentMode) {
        this._flex.alignContent = v;
    }

    get flexAlignContent() {
        return this._flex.alignContent;
    }

    set flexItem(v: boolean) {
        this._flexItem.enabled = v;
    }

    get flexItem() {
        return this._flexItem.enabled;
    }

    set flexGrow(v: number) {
        this._flexItem.grow = v;
    }

    get flexGrow() {
        return this._flexItem.grow;
    }

    set flexShrink(v: number) {
        this._flexItem.shrink = v;
    }

    get flexShrink() {
        return this._flexItem.shrink;
    }

    set flexAlignSelf(v: AlignItemsMode | undefined) {
        this._flexItem.alignSelf = v;
    }

    get flexAlignSelf() {
        return this._flexItem.alignSelf;
    }

    set padding(v: number) {
        this._flex.padding = v;
    }

    get padding() {
        return this._flex.padding;
    }

    set paddingLeft(v: number) {
        this._flex.paddingLeft = v;
    }

    get paddingLeft() {
        return this._flex.paddingLeft;
    }

    set paddingRight(v: number) {
        this._flex.paddingRight = v;
    }

    get paddingRight() {
        return this._flex.paddingRight;
    }

    set paddingTop(v: number) {
        this._flex.paddingTop = v;
    }

    get paddingTop() {
        return this._flex.paddingTop;
    }

    set paddingBottom(v: number) {
        this._flex.paddingBottom = v;
    }

    get paddingBottom() {
        return this._flex.paddingBottom;
    }

    set margin(v: number) {
        this._flexItem.margin = v;
    }

    get margin() {
        return this._flexItem.margin;
    }

    set marginLeft(v: number) {
        this._flexItem.marginLeft = v;
    }

    get marginLeft() {
        return this._flexItem.marginLeft;
    }

    set marginRight(v: number) {
        this._flexItem.marginRight = v;
    }

    get marginRight() {
        return this._flexItem.marginRight;
    }

    set marginTop(v: number) {
        this._flexItem.marginTop = v;
    }

    get marginTop() {
        return this._flexItem.marginTop;
    }

    set marginBottom(v: number) {
        this._flexItem.marginBottom = v;
    }

    get marginBottom() {
        return this._flexItem.marginBottom;
    }

    set minWidth(v: number) {
        this._flexItem.minWidth = v;
    }

    get minWidth() {
        return this._flexItem.minWidth;
    }

    set maxWidth(v: number) {
        this._flexItem.maxWidth = v;
    }

    get maxWidth() {
        return this._flexItem.maxWidth;
    }

    set minHeight(v: number) {
        this._flexItem.minHeight = v;
    }

    get minHeight() {
        return this._flexItem.minHeight;
    }

    set maxHeight(v: number) {
        this._flexItem.maxHeight = v;
    }

    get maxHeight() {
        return this._flexItem.maxHeight;
    }
}

export default Element;
