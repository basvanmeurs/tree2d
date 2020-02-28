import FlexContainer, { AlignItemsMode } from "./FlexContainer";
import FlexNode from "./FlexNode";

export default class FlexItem {
    public static readonly SHRINK_AUTO = -1;

    public container?: FlexContainer;

    private _grow: number = 0;
    private _shrink: number = FlexItem.SHRINK_AUTO;
    private _alignSelf?: AlignItemsMode;

    private _minWidth: number = 0;
    private _minHeight: number = 0;

    private _maxWidth: number = 0;
    private _maxHeight: number = 0;

    private _marginLeft: number = 0;
    private _marginTop: number = 0;
    private _marginRight: number = 0;
    private _marginBottom: number = 0;

    private _enabled: boolean = true;

    constructor(public readonly node: FlexNode) {}

    public getContainer() {
        return this.container;
    }

    public setContainer(c: FlexContainer | undefined) {
        this.container = c;
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(v: boolean) {
        if (v !== this._enabled) {
            const prevFlexParent = this.node.flexParent;
            this._enabled = v;
            this.node.restoreLayoutIfNonFlex();
            if (prevFlexParent) {
                prevFlexParent.changedChildren();
            }
            const newFlexParent = this.node.flexParent;
            if (newFlexParent) {
                newFlexParent.changedChildren();
            }
        }
    }

    get grow() {
        return this._grow;
    }

    set grow(v: number) {
        if (this._grow === v) return;

        this._grow = v;

        this._changed();
    }

    set shrink(v: number) {
        if (this._shrink === v) return;

        this._shrink = v;

        this._changed();
    }

    get shrink() {
        if (this._shrink === FlexItem.SHRINK_AUTO) {
            return this._getDefaultShrink();
        }
        return this._shrink;
    }

    _getDefaultShrink() {
        if (this.node.isFlexEnabled()) {
            return 1;
        } else {
            // All non-flex containers are absolutely positioned items with fixed dimensions, and by default not shrinkable.
            return 0;
        }
    }

    get alignSelf(): AlignItemsMode | undefined {
        return this._alignSelf;
    }

    set alignSelf(v: AlignItemsMode | undefined) {
        if (this._alignSelf === v) return;

        if (v === undefined) {
            this._alignSelf = undefined;
        } else {
            this._alignSelf = v;
        }

        this._changed();
    }

    get minWidth() {
        return this._minWidth;
    }

    set minWidth(v) {
        this._minWidth = Math.max(0, v);
        this.node.forceLayout(true, false);
    }

    get minHeight() {
        return this._minHeight;
    }

    set minHeight(v) {
        this._minHeight = Math.max(0, v);
        this.node.forceLayout(false, true);
    }

    get maxWidth() {
        return this._maxWidth;
    }

    set maxWidth(v) {
        this._maxWidth = Math.max(0, v);
        this.node.forceLayout(true, false);
    }

    get maxHeight() {
        return this._maxHeight;
    }

    set maxHeight(v) {
        this._maxHeight = Math.max(0, v);
        this.node.forceLayout(false, true);
    }

    /**
     * @note margins behave slightly different than in HTML with regard to shrinking.
     * In HTML, (outer) margins can be removed when shrinking. In this engine, they will not shrink at all.
     */
    set margin(v) {
        this.marginLeft = v;
        this.marginTop = v;
        this.marginRight = v;
        this.marginBottom = v;
    }

    get margin() {
        return this.marginLeft;
    }

    set marginLeft(v) {
        this._marginLeft = v;
        this._changed();
    }

    get marginLeft() {
        return this._marginLeft;
    }

    set marginTop(v) {
        this._marginTop = v;
        this._changed();
    }

    get marginTop() {
        return this._marginTop;
    }

    set marginRight(v) {
        this._marginRight = v;
        this._changed();
    }

    get marginRight() {
        return this._marginRight;
    }

    set marginBottom(v) {
        this._marginBottom = v;
        this._changed();
    }

    get marginBottom() {
        return this._marginBottom;
    }

    private _changed() {
        if (this.container) this.container.changedContents();
    }

    resetLayoutSize() {
        this.resetHorizontalAxisLayoutSize();
        this.resetVerticalAxisLayoutSize();
    }

    resetCrossAxisLayoutSize() {
        if (this.horizontal) {
            this.resetVerticalAxisLayoutSize();
        } else {
            this.resetHorizontalAxisLayoutSize();
        }
    }

    private resetHorizontalAxisLayoutSize() {
        let w = this.node.getRelAxisSize(true);
        if (this._minWidth) {
            w = Math.max(this._minWidth, w);
        }
        if (this._maxWidth) {
            w = Math.min(this._maxWidth, w);
        }
        this.node.setAxisLayoutSize(true, w);
    }

    private resetVerticalAxisLayoutSize() {
        let h = this.node.getRelAxisSize(false);
        if (this._minHeight) {
            h = Math.max(this._minHeight, h);
        }
        if (this._maxHeight) {
            h = Math.min(this._maxHeight, h);
        }
        this.node.setAxisLayoutSize(false, h);
    }

    getCrossAxisMinSizeSetting() {
        return this.getMinSizeSetting(!this.horizontal);
    }

    getCrossAxisMaxSizeSetting() {
        return this.getMaxSizeSetting(!this.horizontal);
    }

    getMainAxisMaxSizeSetting() {
        return this.getMaxSizeSetting(this.horizontal);
    }

    getMinSizeSetting(horizontal: boolean) {
        if (horizontal) {
            return this._minWidth;
        } else {
            return this._minHeight;
        }
    }

    getMaxSizeSetting(horizontal: boolean) {
        if (horizontal) {
            return this._maxWidth;
        } else {
            return this._maxHeight;
        }
    }

    private get horizontal() {
        return this.container!.horizontal;
    }
    
    getMainAxisMinSize() {
        return this.node.getAxisMinSize(this.horizontal);
    }

    getCrossAxisMinSize() {
        return this.node.getAxisMinSize(!this.horizontal);
    }

    getMainAxisLayoutSize() {
        return this.node.getAxisLayoutSize(this.horizontal);
    }

    getMainAxisLayoutPos() {
        return this.node.getAxisLayoutPos(this.horizontal);
    }

    setMainAxisLayoutPos(pos: number) {
        return this.node.setAxisLayoutPos(this.horizontal, pos);
    }

    setCrossAxisLayoutPos(pos: number) {
        return this.node.setAxisLayoutPos(!this.horizontal, pos);
    }

    getCrossAxisLayoutSize() {
        return this.node.getAxisLayoutSize(!this.horizontal);
    }

    resizeCrossAxis(size: number) {
        return this.node.resizeAxis(!this.horizontal, size);
    }

    resizeMainAxis(size: number) {
        return this.node.resizeAxis(this.horizontal, size);
    }

    private getMainAxisPadding() {
        return this.node.getTotalPadding(this.horizontal);
    }

    getCrossAxisPadding() {
        return this.node.getTotalPadding(!this.horizontal);
    }

    getMainAxisMargin() {
        return this.node.getTotalMargin(this.horizontal);
    }

    getCrossAxisMargin() {
        return this.node.getTotalMargin(!this.horizontal);
    }

    getMainAxisMinSizeWithPaddingAndMargin() {
        return this.getMainAxisMinSize() + this.getMainAxisPadding() + this.getMainAxisMargin();
    }

    getCrossAxisMinSizeWithPaddingAndMargin() {
        return this.getCrossAxisMinSize() + this.getCrossAxisPadding() + this.getCrossAxisMargin();
    }

    getMainAxisLayoutSizeWithPaddingAndMargin() {
        return this.getMainAxisLayoutSize() + this.getMainAxisPadding() + this.getMainAxisMargin();
    }

    getCrossAxisLayoutSizeWithPaddingAndMargin() {
        return this.getCrossAxisLayoutSize() + this.getCrossAxisPadding() + this.getCrossAxisMargin();
    }

    hasFixedCrossAxisSize() {
        return !this.node.isZeroAxisSize(!this.horizontal);
    }

    hasRelCrossAxisSize() {
        return !!(this.horizontal ? this.node.sourceFuncH : this.node.sourceFuncW);
    }
}
