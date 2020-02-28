import LineLayout from "./line/LineLayout";
import FlexLayouter from "./FlexLayouter";
import FlexNode from "../FlexNode";

/**
 * Distributes items over layout lines.
 */
export default class LineLayouter {
    private _mainAxisMinSize: number = -1;
    private _crossAxisMinSize: number = -1;
    private _mainAxisContentSize: number = 0;
    private _lines?: LineLayout[];
    private _curMainAxisPos: number = 0;
    private _mainAxisSize: number = 0;
    private _maxMainAxisPos: number = 0;

    constructor(private _layout: FlexLayouter) {}

    get lines() {
        return this._lines;
    }

    get mainAxisMinSize() {
        if (this._mainAxisMinSize === -1) {
            this._mainAxisMinSize = this._getMainAxisMinSize();
        }
        return this._mainAxisMinSize;
    }

    get crossAxisMinSize() {
        if (this._crossAxisMinSize === -1) {
            this._crossAxisMinSize = this._getCrossAxisMinSize();
        }
        return this._crossAxisMinSize;
    }

    get mainAxisContentSize() {
        return this._mainAxisContentSize;
    }

    layoutLines() {
        this._setup();
        const items = this._layout.items;
        const wrap = this._layout.isWrapping();

        let startIndex = 0;
        let i;
        const n = items.length;
        for (i = 0; i < n; i++) {
            const item = items[i];

            this._layoutFlexItem(item);

            // Get predicted main axis size.
            const itemMainAxisSize = item.flexItem!._getMainAxisLayoutSizeWithPaddingAndMargin();

            if (wrap && i > startIndex) {
                const isOverflowing = this._curMainAxisPos + itemMainAxisSize > this._mainAxisSize;
                if (isOverflowing) {
                    this._layoutLine(startIndex, i - 1);
                    this._curMainAxisPos = 0;
                    startIndex = i;
                }
            }

            this._addToMainAxisPos(itemMainAxisSize);
        }

        if (startIndex < i) {
            this._layoutLine(startIndex, i - 1);
        }
    }

    _layoutFlexItem(item: FlexNode) {
        if (item.isFlexEnabled()) {
            item.flexLayout!.updateTreeLayout();
        } else {
            item.flexItem!._resetLayoutSize();
        }
    }

    _setup() {
        this._mainAxisSize = this._layout.mainAxisSize;
        this._curMainAxisPos = 0;
        this._maxMainAxisPos = 0;
        this._lines = [];

        this._mainAxisMinSize = -1;
        this._crossAxisMinSize = -1;
        this._mainAxisContentSize = 0;
    }

    _addToMainAxisPos(itemMainAxisSize: number) {
        this._curMainAxisPos += itemMainAxisSize;
        if (this._curMainAxisPos > this._maxMainAxisPos) {
            this._maxMainAxisPos = this._curMainAxisPos;
        }
    }

    _layoutLine(startIndex: number, endIndex: number) {
        const availableSpace = this._getAvailableMainAxisLayoutSpace();
        const line = new LineLayout(this._layout, startIndex, endIndex, availableSpace);
        line.performLayout();
        this._lines!.push(line);

        if (this._mainAxisContentSize === 0 || this._curMainAxisPos > this._mainAxisContentSize) {
            this._mainAxisContentSize = this._curMainAxisPos;
        }
    }

    _getAvailableMainAxisLayoutSpace() {
        if (!this._layout.isResizingMainAxis() && this._layout.isMainAxisFitToContents()) {
            return 0;
        } else {
            return this._mainAxisSize - this._curMainAxisPos;
        }
    }

    _getCrossAxisMinSize() {
        let crossAxisMinSize = 0;
        const items = this._layout.items;
        for (let i = 0, n = items.length; i < n; i++) {
            const item = items[i];
            const itemCrossAxisMinSize = item.flexItem!._getCrossAxisMinSizeWithPaddingAndMargin();
            crossAxisMinSize = Math.max(crossAxisMinSize, itemCrossAxisMinSize);
        }
        return crossAxisMinSize;
    }

    _getMainAxisMinSize() {
        const lines = this._lines!;
        if (lines.length === 1) {
            return lines[0].getMainAxisMinSize();
        } else {
            // Wrapping lines: specified width is used as min width (in accordance to W3C flexbox).
            return this._layout.mainAxisSize;
        }
    }
}
