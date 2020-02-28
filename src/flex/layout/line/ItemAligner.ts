import LineLayout from "./LineLayout";
import { AlignItemsMode } from "../../FlexContainer";
import FlexNode from "../../FlexNode";
import FlexItem from "../../FlexItem";

export default class ItemAligner {
    private crossAxisLayoutSize: number = 0;
    private crossAxisLayoutOffset: number = 0;
    private alignItemsSetting?: AlignItemsMode;
    private recursiveResizeOccured: boolean = false;
    private isCrossAxisFitToContents: boolean = false;

    constructor(private _line: LineLayout) {}

    get _layout() {
        return this._line.getLayout();
    }

    get _flexContainer() {
        return this._layout.container;
    }

    setCrossAxisLayoutSize(size: number) {
        this.crossAxisLayoutSize = size;
    }

    setCrossAxisLayoutOffset(offset: number) {
        this.crossAxisLayoutOffset = offset;
    }

    align() {
        this.alignItemsSetting = this._flexContainer.alignItems;

        this.isCrossAxisFitToContents = this._layout.isAxisFitToContents(!this._flexContainer.horizontal);

        this.recursiveResizeOccured = false;
        const items = this._line.items;
        for (let i = this._line.startIndex; i <= this._line.endIndex; i++) {
            const item = items[i];
            this._alignItem(item);
        }
    }

    getRecursiveResizeOccured() {
        return this.recursiveResizeOccured;
    }

    _alignItem(item: FlexNode) {
        const flexItem = item.flexItem!;
        let align = flexItem.alignSelf || this.alignItemsSetting;

        if (align === "stretch" && this._preventStretch(flexItem)) {
            align = "flex-start";
        }

        if (align !== "center" && !this.isCrossAxisFitToContents) {
            if (flexItem._hasRelCrossAxisSize()) {
                // As cross axis size might have changed, we need to recalc the relative flex item's size.
                flexItem._resetCrossAxisLayoutSize();
            }
        }

        switch (align) {
            case "flex-start":
                this._alignItemFlexStart(flexItem);
                break;
            case "flex-end":
                this._alignItemFlexEnd(flexItem);
                break;
            case "center":
                this._alignItemFlexCenter(flexItem);
                break;
            case "stretch":
                this._alignItemStretch(flexItem);
                break;
        }
    }

    _alignItemFlexStart(flexItem: FlexItem) {
        flexItem._setCrossAxisLayoutPos(this.crossAxisLayoutOffset);
    }

    _alignItemFlexEnd(flexItem: FlexItem) {
        const itemCrossAxisSize = flexItem._getCrossAxisLayoutSizeWithPaddingAndMargin();
        flexItem._setCrossAxisLayoutPos(this.crossAxisLayoutOffset + (this.crossAxisLayoutSize - itemCrossAxisSize));
    }

    _alignItemFlexCenter(flexItem: FlexItem) {
        const itemCrossAxisSize = flexItem._getCrossAxisLayoutSizeWithPaddingAndMargin();
        const center = (this.crossAxisLayoutSize - itemCrossAxisSize) / 2;
        flexItem._setCrossAxisLayoutPos(this.crossAxisLayoutOffset + center);
    }

    _alignItemStretch(flexItem: FlexItem) {
        flexItem._setCrossAxisLayoutPos(this.crossAxisLayoutOffset);

        const mainAxisLayoutSizeBeforeResize = flexItem._getMainAxisLayoutSize();
        let size = this.crossAxisLayoutSize - flexItem._getCrossAxisMargin() - flexItem._getCrossAxisPadding();

        const crossAxisMinSizeSetting = flexItem._getCrossAxisMinSizeSetting();
        if (crossAxisMinSizeSetting > 0) {
            size = Math.max(size, crossAxisMinSizeSetting);
        }

        const crossAxisMaxSizeSetting = flexItem._getCrossAxisMaxSizeSetting();
        const crossAxisMaxSizeSettingEnabled = crossAxisMaxSizeSetting > 0;
        if (crossAxisMaxSizeSettingEnabled) {
            size = Math.min(size, crossAxisMaxSizeSetting);
        }

        flexItem._resizeCrossAxis(size);
        const mainAxisLayoutSizeAfterResize = flexItem._getMainAxisLayoutSize();

        const recursiveResize = mainAxisLayoutSizeAfterResize !== mainAxisLayoutSizeBeforeResize;
        if (recursiveResize) {
            // Recursive resize can happen when this flex item has the opposite direction than the container
            // and is wrapping and auto-sizing. Due to item/content stretching the main axis size of the flex
            // item may decrease. If it does so, we must re-justify-content the complete line.
            // Notice that we don't account for changes to the (if autosized) main axis size caused by recursive
            // resize, which may cause the container's main axis to not shrink to the contents properly.
            // This is by design, because if we had re-run the main axis layout, we could run into issues such
            // as slow layout or endless loops.
            this.recursiveResizeOccured = true;
        }
    }

    _preventStretch(flexItem: FlexItem) {
        const hasFixedCrossAxisSize = flexItem._hasFixedCrossAxisSize();
        const forceStretch = flexItem.alignSelf === "stretch";
        return hasFixedCrossAxisSize && !forceStretch;
    }
}
