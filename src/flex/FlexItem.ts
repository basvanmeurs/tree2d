import FlexUtils from "./FlexUtils.js";
import FlexContainer, { AlignItemsMode } from "./FlexContainer";
import FlexTarget from "./FlexTarget";

export default class FlexItem {
    public static readonly SHRINK_AUTO = -1;

    _ctr?: FlexContainer;
    _item: FlexTarget;

    _grow: number = 0;
    _shrink: number = FlexItem.SHRINK_AUTO;
    _alignSelf?: AlignItemsMode;

    _minWidth: number = 0;
    _minHeight: number = 0;

    _maxWidth: number = 0;
    _maxHeight: number = 0;

    _marginLeft: number = 0;
    _marginTop: number = 0;
    _marginRight: number = 0;
    _marginBottom: number = 0;

    constructor(item: FlexTarget) {
        this._item = item;
    }

    get item() {
        return this._item;
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
        if (this.item.isFlexEnabled()) {
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
        this._item.forceLayout(true, false);
    }

    get minHeight() {
        return this._minHeight;
    }

    set minHeight(v) {
        this._minHeight = Math.max(0, v);
        this._item.forceLayout(false, true);
    }

    get maxWidth() {
        return this._maxWidth;
    }

    set maxWidth(v) {
        this._maxWidth = Math.max(0, v);
        this._item.forceLayout(true, false);
    }

    get maxHeight() {
        return this._maxHeight;
    }

    set maxHeight(v) {
        this._maxHeight = Math.max(0, v);
        this._item.forceLayout(false, true);
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

    _changed() {
        if (this.ctr) this.ctr._changedContents();
    }

    set ctr(v: FlexContainer | undefined) {
        this._ctr = v;
    }

    get ctr(): FlexContainer | undefined {
        return this._ctr;
    }

    _resetLayoutSize() {
        this._resetHorizontalAxisLayoutSize();
        this._resetVerticalAxisLayoutSize();
    }

    _resetCrossAxisLayoutSize() {
        if (this.ctr!.horizontal) {
            this._resetVerticalAxisLayoutSize();
        } else {
            this._resetHorizontalAxisLayoutSize();
        }
    }

    _resetHorizontalAxisLayoutSize() {
        let w = FlexUtils.getRelAxisSize(this.item, true);
        if (this._minWidth) {
            w = Math.max(this._minWidth, w);
        }
        if (this._maxWidth) {
            w = Math.min(this._maxWidth, w);
        }
        FlexUtils.setAxisLayoutSize(this.item, true, w);
    }

    _resetVerticalAxisLayoutSize() {
        let h = FlexUtils.getRelAxisSize(this.item, false);
        if (this._minHeight) {
            h = Math.max(this._minHeight, h);
        }
        if (this._maxHeight) {
            h = Math.min(this._maxHeight, h);
        }
        FlexUtils.setAxisLayoutSize(this.item, false, h);
    }

    _getCrossAxisMinSizeSetting() {
        return this._getMinSizeSetting(!this.ctr!.horizontal);
    }

    _getCrossAxisMaxSizeSetting() {
        return this._getMaxSizeSetting(!this.ctr!.horizontal);
    }

    _getMainAxisMaxSizeSetting() {
        return this._getMaxSizeSetting(this.ctr!.horizontal);
    }

    _getMinSizeSetting(horizontal: boolean) {
        if (horizontal) {
            return this._minWidth;
        } else {
            return this._minHeight;
        }
    }

    _getMaxSizeSetting(horizontal: boolean) {
        if (horizontal) {
            return this._maxWidth;
        } else {
            return this._maxHeight;
        }
    }

    _getMainAxisMinSize() {
        return FlexUtils.getAxisMinSize(this.item, this.ctr!.horizontal);
    }

    _getCrossAxisMinSize() {
        return FlexUtils.getAxisMinSize(this.item, !this.ctr!.horizontal);
    }

    _getMainAxisLayoutSize() {
        return FlexUtils.getAxisLayoutSize(this.item, this.ctr!.horizontal);
    }

    _getMainAxisLayoutPos() {
        return FlexUtils.getAxisLayoutPos(this.item, this.ctr!.horizontal);
    }

    _setMainAxisLayoutPos(pos: number) {
        return FlexUtils.setAxisLayoutPos(this.item, this.ctr!.horizontal, pos);
    }

    _setCrossAxisLayoutPos(pos: number) {
        return FlexUtils.setAxisLayoutPos(this.item, !this.ctr!.horizontal, pos);
    }

    _getCrossAxisLayoutSize() {
        return FlexUtils.getAxisLayoutSize(this.item, !this.ctr!.horizontal);
    }

    _resizeCrossAxis(size: number) {
        return FlexUtils.resizeAxis(this.item, !this.ctr!.horizontal, size);
    }

    _resizeMainAxis(size: number) {
        return FlexUtils.resizeAxis(this.item, this.ctr!.horizontal, size);
    }

    _getMainAxisPadding() {
        return FlexUtils.getTotalPadding(this.item, this.ctr!.horizontal);
    }

    _getCrossAxisPadding() {
        return FlexUtils.getTotalPadding(this.item, !this.ctr!.horizontal);
    }

    _getMainAxisMargin() {
        return FlexUtils.getTotalMargin(this.item, this.ctr!.horizontal);
    }

    _getCrossAxisMargin() {
        return FlexUtils.getTotalMargin(this.item, !this.ctr!.horizontal);
    }

    _getHorizontalMarginOffset() {
        return FlexUtils.getMarginOffset(this.item, true);
    }

    _getVerticalMarginOffset() {
        return FlexUtils.getMarginOffset(this.item, false);
    }

    _getMainAxisMinSizeWithPaddingAndMargin() {
        return this._getMainAxisMinSize() + this._getMainAxisPadding() + this._getMainAxisMargin();
    }

    _getCrossAxisMinSizeWithPaddingAndMargin() {
        return this._getCrossAxisMinSize() + this._getCrossAxisPadding() + this._getCrossAxisMargin();
    }

    _getMainAxisLayoutSizeWithPaddingAndMargin() {
        return this._getMainAxisLayoutSize() + this._getMainAxisPadding() + this._getMainAxisMargin();
    }

    _getCrossAxisLayoutSizeWithPaddingAndMargin() {
        return this._getCrossAxisLayoutSize() + this._getCrossAxisPadding() + this._getCrossAxisMargin();
    }

    _hasFixedCrossAxisSize() {
        return !FlexUtils.isZeroAxisSize(this.item, !this.ctr!.horizontal);
    }

    _hasRelCrossAxisSize() {
        return !!(this.ctr!.horizontal ? this.item.funcH : this.item.funcW);
    }
}
