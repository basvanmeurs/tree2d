import { FunctionW } from "../../../src/tree/core/ElementCore";

const Utils = lng.Utils;
const Base = lng.Base;
const FlexTarget = lng.FlexTarget;

export default class Target {
    constructor() {
        this._children = [];

        this._parent = null;

        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;

        this._sx = 0;
        this._sy = 0;
        this._sw = 0;
        this._sh = 0;

        this._optFlags = 0;

        this._funcX = null;
        this._funcY = null;
        this._funcW = null;
        this._funcH = null;

        this._visible = true;

        /**
         * @type FlexTarget
         */
        this._layout = undefined;

        this._recalc = 0;
        this._hasUpdates = false;

        // Will contain the expected layout result while unit testing.
        this.r = [];
    }

    getChildren() {
        return this._children;
    }

    get layout() {
        this._ensureLayout();
        return this._layout;
    }

    getLayout() {
        return this.layout;
    }

    get flex() {
        return this._layout ? this._layout.flex : null;
    }

    set flex(v) {
        if (v === undefined) {
            if (this._layout) {
                this.layout.setEnabled(false);
            }
        } else {
            this.layout.setEnabled(true);
            Target.patch(this.layout.flex, v);
        }
    }

    static patch(obj, settings) {
        for (const [key, value] of Object.entries(settings)) {
            obj[key] = value;
        }
    }

    get flexItem() {
        return this._layout ? this._layout.flexItem : null;
    }

    set flexItem(v) {
        if (v === false) {
            if (this._layout) {
                this.layout.setItemEnabled(false);
            }
        } else {
            this.layout.setItemEnabled(true);
            Target.patch(this.layout.flexItem, v);
        }
    }

    enableFlexLayout() {
        this._ensureLayout();
    }

    _ensureLayout() {
        if (!this._layout) {
            this._layout = new FlexTarget(this);
        }
    }

    disableFlexLayout() {
        this._triggerRecalcTranslate();
    }

    hasFlexLayout() {
        return this._layout && this._layout.isEnabled();
    }

    triggerLayout() {
        this._setRecalc(256);
    }

    _triggerRecalcTranslate() {
        this._setRecalc(2);
    }

    _setRecalc(type) {
        this._recalc |= type;
        this._setHasUpdates();
    }

    _setHasUpdates() {
        let p = this;
        while (p && !p._hasUpdates) {
            p._hasUpdates = true;
            p = p._parent;
        }
    }

    update() {
        if (this._recalc & 256) {
            this._layout.layoutFlexTree();
        }

        if (this._optFlags && !this.hasFlexLayout()) {
            if (this._optFlags & 1) {
                const x = this._funcX(this._parent.w);
                if (x !== this._x) {
                    this._x = x;
                    this._recalc |= 2;
                }
            }
            if (this._optFlags & 2) {
                const y = this._funcY(this._parent.h);
                if (y !== this._y) {
                    this._y = y;
                    this._recalc |= 2;
                }
            }
            if (this._optFlags & 4) {
                const w = this._funcW(this._parent.w);
                if (w !== this._w) {
                    this._w = w;
                    this._recalc |= 2;
                }
            }
            if (this._optFlags & 8) {
                const h = this._funcH(this._parent.h);
                if (h !== this._h) {
                    this._h = h;
                    this._recalc |= 2;
                }
            }
        }

        if (this._hasUpdates) {
            this._recalc = 0;
            this._hasUpdates = false;
            const children = this._children;
            if (children) {
                for (let i = 0, n = children.length; i < n; i++) {
                    children[i].update();
                }
            }
        }
    }

    get x() {
        if (this._funcX) {
            return this._funcX;
        } else {
            return this._sx;
        }
    }

    set x(v) {
        if (Utils.isFunction(v)) {
            this.funcX = v;
        } else {
            this._disableFuncX();
            const dx = v - this._sx;
            this._sx = v;

            // No recalc is necessary because the layout offset can be updated directly.
            this._x += dx;
        }
    }

    getFuncX() {
        return this._optFlags & 1 ? this._funcX : null;
    }

    set funcX(v) {
        if (this._funcX !== v) {
            this._optFlags |= 1;
            this._funcX = v;
            this._x = 0;
            if (this.hasFlexLayout()) {
                this._layout.forceLayout();
            } else {
                this._triggerRecalcTranslate();
            }
        }
    }

    _disableFuncX() {
        this._optFlags = this._optFlags & (0xffff - 1);
        this._funcX = null;
    }

    get y() {
        if (this._funcY) {
            return this._funcY;
        } else {
            return this._sy;
        }
    }

    set y(v) {
        if (Utils.isFunction(v)) {
            this.funcY = v;
        } else {
            this._disableFuncY();
            const dy = v - this._sy;
            if (dy) {
                this._sy = v;

                // No recalc is necessary because the layout offset can be updated directly.
                this._y += dy;
            }
        }
    }

    getFuncY() {
        return this._optFlags & 2 ? this._funcY : null;
    }

    set funcY(v) {
        if (this._funcY !== v) {
            this._optFlags |= 2;
            this._funcY = v;
            this._y = 0;
            if (this.hasFlexLayout()) {
                this._layout.forceLayout();
            } else {
                this._triggerRecalcTranslate();
            }
        }
    }

    _disableFuncY() {
        this._optFlags = this._optFlags & (0xffff - 2);
        this._funcY = null;
    }

    get w() {
        if (this._funcW) {
            return this._funcW;
        } else {
            return this._sw;
        }
    }

    set w(v) {
        if (Utils.isFunction(v)) {
            this.funcW = v;
        } else {
            this.disableFuncW();
            if (this._sw !== v) {
                this._sw = v;
                if (this.hasFlexLayout()) {
                    this._layout.updatedSourceW();
                } else {
                    this._triggerRecalcTranslate();
                }
            }
        }
    }

    get h() {
        return this._h;
    }

    set h(v) {
        if (Utils.isFunction(v)) {
            this.funcH = v;
        } else {
            this.disableFuncH();
            if (this._sh !== v) {
                this._sh = v;
                if (this.hasFlexLayout()) {
                    this._layout.updatedSourceH();
                } else {
                    this._triggerRecalcTranslate();
                }
            }
        }
    }

    getFuncW() {
        return this._optFlags & 4 ? this._funcW : null;
    }

    set funcW(v) {
        if (this._funcW !== v) {
            this._optFlags |= 4;
            this._funcW = v;
            if (this.hasFlexLayout()) {
                this.layout.updatedSourceW();
            } else {
                this._w = 0;
                this._triggerRecalcTranslate();
            }
        }
    }

    disableFuncW() {
        this._optFlags = this._optFlags & (0xffff - 4);
        this._funcW = null;
    }

    getFuncH() {
        return this._optFlags & 8 ? this._funcH : null;
    }

    set funcH(v) {
        if (this._funcH !== v) {
            this._optFlags |= 8;
            this._funcH = v;
            if (this.hasFlexLayout()) {
                this.layout.updatedSourceH();
            } else {
                this._h = 0;
                this._triggerRecalcTranslate();
            }
        }
    }

    disableFuncH() {
        this._optFlags = this._optFlags & (0xffff - 8);
        this._funcH = null;
    }

    getParent() {
        return this._parent;
    }

    setParent(p) {
        if (this._parent !== p) {
            const prevParent = this._parent;
            this._parent = p;
            if (this._layout || (p && p.isFlexContainer())) {
                this.layout.setParent(prevParent, p);
            }

            if (prevParent) {
                prevParent._triggerRecalcTranslate();
            }
            if (p) {
                p._triggerRecalcTranslate();
            }
        }
    }

    set children(v) {
        const children = v.map(o => {
            if (Utils.isObjectLiteral(o)) {
                const c = new Target();
                Target.patch(c, o);
                return c;
            } else {
                return o;
            }
        });

        this._children = children;

        children.forEach(child => {
            child.setParent(this);
        });
    }

    get children() {
        return this._children;
    }

    addChildAt(index, child) {
        if (!this._children) this._children = [];
        this._children.splice(index, 0, child);
        child.setParent(this);
    }

    removeChildAt(index) {
        const child = this._children[index];
        this._children.splice(index, 1);
        child.setParent(null);
    }

    setLayoutCoords(x, y) {
        if (this._x !== x || this._y !== y) {
            this._x = x;
            this._y = y;
            this._triggerRecalcTranslate();
        }
    }

    setLayoutDimensions(w, h) {
        if (this._w !== w || this._h !== h) {
            this._w = w;
            this._h = h;

            this._triggerRecalcTranslate();
        }
    }

    set visible(v) {
        if (this._visible !== v) {
            this._visible = v;
            if (this.hasFlexLayout()) {
                this.layout.updateVisible(v);
            }
        }
    }

    isVisible() {
        return this._visible;
    }

    toJson() {
        const json = {
            w: this.getLayoutW(),
            h: this.getLayoutH(),
            x: this.getLayoutX(),
            y: this.getLayoutY(),
            layout: [this._x, this._y, this._w, this._h].join(" "),
            r: this.r ? this.r.join(" ") : undefined,
            flex: this._layout && this._layout.flex ? Target.flexToJson(this._layout.flex) : false,
            flexItem: this._layout && this._layout.flexItem ? Target.flexToJson(this._layout.flexItem) : false,
            children: this._children.map(c => c.toJson())
        };
        if (!json.r) {
            delete json.r;
        }
        return json;
    }

    static flexToJson(flex) {
        return {
            direction: flex.direction,
            alignItems: flex.alignItems,
            alignContent: flex.alignContent,
            justifyContent: flex.justifyContent
        };
    }

    static flexItemToJson(flexItem) {
        return {
            grow: flexItem.grow,
            shrink: flexItem.shrink,
            alignSelf: flexItem.alignSelf
        };
    }

    toString() {
        const obj = this.toJson();
        return JSON.stringify(obj, null, 2);
    }

    getLocationString() {
        const i = this._parent ? this._parent._children.indexOf(this) : "R";
        let str = this._parent ? this._parent.getLocationString() : "";
        str += "[" + i + "]";
        return str;
    }

    getSourceX() {
        return this._sx;
    }

    getSourceY() {
        return this._sy;
    }

    getSourceW() {
        return this._sw;
    }

    getSourceH() {
        return this._sh;
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
}
