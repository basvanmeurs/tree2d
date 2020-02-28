import FlexLayouter from "./FlexLayouter";
import FlexNode from "../FlexNode";

export default class ItemCoordinatesUpdater {
    private layout: FlexLayouter;
    private isReverse: boolean;
    private horizontalPaddingOffset: number;
    private verticalPaddingOffset: number;

    constructor(layout: FlexLayouter) {
        this.layout = layout;
        this.isReverse = this.flexContainer.reverse;
        this.horizontalPaddingOffset = this.flexContainer.getHorizontalPaddingOffset();
        this.verticalPaddingOffset = this.flexContainer.getVerticalPaddingOffset();
    }

    private get flexContainer() {
        return this.layout.container;
    }

    finalize() {
        const parentFlex = this.layout.getParentFlexContainer();
        if (parentFlex) {
            // We must update it from the parent to set padding offsets and reverse position.
            const updater = new ItemCoordinatesUpdater(parentFlex.layout);
            updater.finalizeItemAndChildren(this.flexContainer.node);
        } else {
            this.finalizeRoot();
            this.finalizeItems();
        }
    }

    private finalizeRoot() {
        const item = this.flexContainer.node;
        const x = item.getAxisLayoutPos(true);
        const y = item.getAxisLayoutPos(false);
        let w = item.getAxisLayoutSize(true);
        let h = item.getAxisLayoutSize(false);

        w += this.flexContainer.getHorizontalPadding();
        h += this.flexContainer.getVerticalPadding();

        item.clearRecalcFlag();

        item.setLayout(x, y, w, h);
    }

    private finalizeItems() {
        const items = this.layout.items;
        for (let i = 0, n = items.length; i < n; i++) {
            const item = items[i];
            const validCache = this.validateItemCache(item);

            // Notice that we must also finalize a cached item, as it's coordinates may have changed.
            this.finalizeItem(item);

            if (!validCache) {
                this.finalizeItemChildren(item);
            }
        }
    }

    private validateItemCache(item: FlexNode) {
        if (item.recalc === 0) {
            if (item.isFlexEnabled()) {
                const layout = item.flex!.layout;

                const dimensionsMatchPreviousResult =
                    item.w === item.subject.getLayoutW() && item.h === item.subject.getLayoutH();
                if (dimensionsMatchPreviousResult) {
                    // Cache is valid.
                    return true;
                } else {
                    const crossAxisSize = layout.crossAxisSize;
                    layout.performResizeMainAxis(layout.mainAxisSize);
                    layout.performResizeCrossAxis(crossAxisSize);
                }
            }
        }
        return false;
    }

    private finalizeItemAndChildren(item: FlexNode) {
        this.finalizeItem(item);
        this.finalizeItemChildren(item);
    }

    private finalizeItem(item: FlexNode) {
        if (this.isReverse) {
            this.reverseMainAxisLayoutPos(item);
        }

        let x = item.getAxisLayoutPos(true);
        let y = item.getAxisLayoutPos(false);
        let w = item.getAxisLayoutSize(true);
        let h = item.getAxisLayoutSize(false);

        x += this.horizontalPaddingOffset;
        y += this.verticalPaddingOffset;

        const flex = item.flex;
        if (flex) {
            w += flex.getHorizontalPadding();
            h += flex.getVerticalPadding();
        }

        x += item.getHorizontalMarginOffset();
        y += item.getVerticalMarginOffset();

        item.clearRecalcFlag();
        item.setLayout(x, y, w, h);
    }

    private finalizeItemChildren(item: FlexNode) {
        const flex = item.flex;
        if (flex) {
            const updater = new ItemCoordinatesUpdater(flex.layout);
            updater.finalizeItems();
        }
    }

    private reverseMainAxisLayoutPos(item: FlexNode) {
        const endPos =
            item.flexItem!._getMainAxisLayoutPos() + item.flexItem!._getMainAxisLayoutSizeWithPaddingAndMargin();
        const reversedPos = this.layout.mainAxisSize - endPos;
        item.flexItem!._setMainAxisLayoutPos(reversedPos);
    }
}
