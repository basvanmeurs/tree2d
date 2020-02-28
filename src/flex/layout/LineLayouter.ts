import LineLayout from "./line/LineLayout";
import FlexLayouter from "./FlexLayouter";
import FlexNode from "../FlexNode";

/**
 * Distributes items over layout lines.
 */
export default class LineLayouter {

    private mainAxisMinSize?: number;
    private crossAxisMinSize?: number;
    private mainAxisContentSize: number = 0;
    private lines?: LineLayout[];
    private curMainAxisPos: number = 0;
    private mainAxisSize: number = 0;
    private maxMainAxisPos: number = 0;

    constructor(private _layout: FlexLayouter) {}

    layoutLines() {
        this.setup();
        const items = this._layout.items;
        const wrap = this._layout.isWrapping();

        let startIndex = 0;
        let i;
        const n = items.length;
        for (i = 0; i < n; i++) {
            const item = items[i];

            this.layoutFlexItem(item);

            // Get predicted main axis size.
            const itemMainAxisSize = item.flexItem!._getMainAxisLayoutSizeWithPaddingAndMargin();

            if (wrap && i > startIndex) {
                const isOverflowing = this.curMainAxisPos + itemMainAxisSize > this.mainAxisSize;
                if (isOverflowing) {
                    this.layoutLine(startIndex, i - 1);
                    this.curMainAxisPos = 0;
                    startIndex = i;
                }
            }

            this.addToMainAxisPos(itemMainAxisSize);
        }

        if (startIndex < i) {
            this.layoutLine(startIndex, i - 1);
        }
    }

    private setup() {
        this.mainAxisSize = this._layout.mainAxisSize;
        this.curMainAxisPos = 0;
        this.maxMainAxisPos = 0;
        this.lines = [];

        this.mainAxisMinSize = undefined;
        this.crossAxisMinSize = undefined;
        this.mainAxisContentSize = 0;
    }

    private layoutFlexItem(item: FlexNode) {
        if (item.isFlexEnabled()) {
            item.flexLayout!.updateTreeLayout();
        } else {
            item.flexItem!._resetLayoutSize();
        }
    }

    private addToMainAxisPos(itemMainAxisSize: number) {
        this.curMainAxisPos += itemMainAxisSize;
        if (this.curMainAxisPos > this.maxMainAxisPos) {
            this.maxMainAxisPos = this.curMainAxisPos;
        }
    }

    private layoutLine(startIndex: number, endIndex: number) {
        const availableSpace = this.getAvailableMainAxisLayoutSpace();
        const line = new LineLayout(this._layout, startIndex, endIndex, availableSpace);
        line.performLayout();
        this.lines!.push(line);

        if (this.mainAxisContentSize === 0 || this.curMainAxisPos > this.mainAxisContentSize) {
            this.mainAxisContentSize = this.curMainAxisPos;
        }
    }

    private getAvailableMainAxisLayoutSpace() {
        if (!this._layout.isResizingMainAxis() && this._layout.isMainAxisFitToContents()) {
            return 0;
        } else {
            return this.mainAxisSize - this.curMainAxisPos;
        }
    }

    private calcCrossAxisMinSize() {
        let crossAxisMinSize = 0;
        const items = this._layout.items;
        for (let i = 0, n = items.length; i < n; i++) {
            const item = items[i];
            const itemCrossAxisMinSize = item.flexItem!._getCrossAxisMinSizeWithPaddingAndMargin();
            crossAxisMinSize = Math.max(crossAxisMinSize, itemCrossAxisMinSize);
        }
        return crossAxisMinSize;
    }

    private calcMainAxisMinSize() {
        const lines = this.lines!;
        if (lines.length === 1) {
            return lines[0].getMainAxisMinSize();
        } else {
            // Wrapping lines: specified width is used as min width (in accordance to W3C flexbox).
            return this._layout.mainAxisSize;
        }
    }

    getLines(): LineLayout[] {
        return this.lines!;
    }

    getMainAxisMinSize(): number {
        if (this.mainAxisMinSize === undefined) {
            this.mainAxisMinSize = this.calcMainAxisMinSize();
        }
        return this.mainAxisMinSize;
    }

    getCrossAxisMinSize(): number {
        if (this.crossAxisMinSize === undefined) {
            this.crossAxisMinSize = this.calcCrossAxisMinSize();
        }
        return this.crossAxisMinSize;
    }

    getMainAxisContentSize() {
        return this.mainAxisContentSize;
    }


}
