import FlexNode from "../FlexNode";

export default class FlexUtils {


    static resizeAxis(item: FlexNode, horizontal: boolean, size: number) {
        if (item.isFlexEnabled()) {
            const isMainAxis = item.flex!.horizontal === horizontal;
            if (isMainAxis) {
                item.flex!.layout.resizeMainAxis(size);
            } else {
                item.flex!.layout.resizeCrossAxis(size);
            }
        } else {
            item.setAxisLayoutSize(horizontal, size);
        }
    }

    static getPaddingOffset(item: FlexNode, horizontal: boolean) {
        if (item.isFlexEnabled()) {
            const flex = item.flex!;
            if (horizontal) {
                return flex.paddingLeft;
            } else {
                return flex.paddingTop;
            }
        } else {
            return 0;
        }
    }

    static getMarginOffset(item: FlexNode, horizontal: boolean) {
        const flexItem = item.flexItem!;
        if (flexItem) {
            if (horizontal) {
                return flexItem.marginLeft;
            } else {
                return flexItem.marginTop;
            }
        } else {
            return 0;
        }
    }

    static getTotalMargin(item: FlexNode, horizontal: boolean) {
        const flexItem = item.flexItem!;
        if (flexItem) {
            if (horizontal) {
                return flexItem.marginRight + flexItem.marginLeft;
            } else {
                return flexItem.marginTop + flexItem.marginBottom;
            }
        } else {
            return 0;
        }
    }
}
