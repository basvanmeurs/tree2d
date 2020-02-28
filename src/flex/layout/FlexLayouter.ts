import ContentAligner from "./ContentAligner";
import FlexUtils from "../FlexUtils.js";
import LineLayouter from "./LineLayouter";
import ItemCoordinatesUpdater from "./ItemCoordinatesUpdater";
import FlexContainer from "../FlexContainer";
import FlexTarget from "../FlexTarget";

/**
 * Layouts a flex container (and descendants).
 */
export default class FlexLayouter {
    private _lineLayouter: LineLayouter = new LineLayouter(this);

    private _resizingMainAxis: boolean = false;
    private _resizingCrossAxis: boolean = false;

    private _cachedMainAxisSizeAfterLayout: number = 0;
    private _cachedCrossAxisSizeAfterLayout: number = 0;

    private _shrunk: boolean = false;

    private _totalCrossAxisSize: any;

    constructor(public _flexContainer: FlexContainer) {}

    get shrunk() {
        return this._shrunk;
    }

    get recalc() {
        return this.item.recalc;
    }

    layoutTree() {
        const isSubTree = !!this.item.flexParent;
        if (isSubTree) {
            // Use the dimensions set by the parent flex tree.
            this._updateSubTreeLayout();
        } else {
            this.updateTreeLayout();
        }
        this.updateItemCoords();
    }

    updateTreeLayout() {
        if (this.recalc) {
            this._performUpdateLayoutTree();
        } else {
            this._performUpdateLayoutTreeFromCache();
        }
    }

    _performUpdateLayoutTree() {
        this._setInitialAxisSizes();
        this._layoutAxes();
        this._refreshLayoutCache();
    }

    _refreshLayoutCache() {
        this._cachedMainAxisSizeAfterLayout = this.mainAxisSize;
        this._cachedCrossAxisSizeAfterLayout = this.crossAxisSize;
    }

    _performUpdateLayoutTreeFromCache() {
        const sizeMightHaveChanged = this.item.funcW || this.item.funcH;
        if (sizeMightHaveChanged) {
            // Update after all.
            this.item.enableLocalRecalcFlag();
            this._performUpdateLayoutTree();
        } else {
            this.mainAxisSize = this._cachedMainAxisSizeAfterLayout;
            this.crossAxisSize = this._cachedCrossAxisSizeAfterLayout;
        }
    }

    updateItemCoords() {
        const updater = new ItemCoordinatesUpdater(this);
        updater.finalize();
    }

    _updateSubTreeLayout() {
        // The dimensions of this container are guaranteed not to have changed.
        // That's why we can safely 'reuse' those and re-layout the contents.
        const crossAxisSize = this.crossAxisSize;
        this._layoutMainAxis();
        this.performResizeCrossAxis(crossAxisSize);
    }

    _setInitialAxisSizes() {
        if (this.item.isFlexItemEnabled()) {
            if (this.item.flexItem) {
                this.item.flexItem._resetLayoutSize();
            }
        } else {
            this.mainAxisSize = this._getMainAxisBasis();
            this.crossAxisSize = this._getCrossAxisBasis();
        }
        this._resizingMainAxis = false;
        this._resizingCrossAxis = false;
        this._shrunk = false;
    }

    _layoutAxes() {
        this._layoutMainAxis();
        this._layoutCrossAxis();
    }

    /**
     * @pre mainAxisSize should exclude padding.
     */
    _layoutMainAxis() {
        this._layoutLines();
        this._fitMainAxisSizeToContents();
    }

    _layoutLines() {
        this._lineLayouter.layoutLines();
    }

    get _lines() {
        return this._lineLayouter.lines;
    }

    _fitMainAxisSizeToContents() {
        if (!this._resizingMainAxis) {
            if (this.isMainAxisFitToContents()) {
                this.mainAxisSize = this._lineLayouter.mainAxisContentSize;
            }
        }
    }

    /**
     * @pre crossAxisSize should exclude padding.
     */
    _layoutCrossAxis() {
        const aligner = new ContentAligner(this);
        aligner.init();
        this._totalCrossAxisSize = aligner.totalCrossAxisSize;
        this._fitCrossAxisSizeToContents();
        aligner.align();
    }

    _fitCrossAxisSizeToContents() {
        if (!this._resizingCrossAxis) {
            if (this.isCrossAxisFitToContents()) {
                this.crossAxisSize = this._totalCrossAxisSize;
            }
        }
    }

    isWrapping() {
        return this._flexContainer.wrap;
    }

    isAxisFitToContents(horizontal: boolean) {
        if (this._horizontal === horizontal) {
            return this.isMainAxisFitToContents();
        } else {
            return this.isCrossAxisFitToContents();
        }
    }

    isMainAxisFitToContents() {
        return !this.isWrapping() && !this._hasFixedMainAxisBasis();
    }

    isCrossAxisFitToContents() {
        return !this._hasFixedCrossAxisBasis();
    }

    _hasFixedMainAxisBasis() {
        return !FlexUtils.isZeroAxisSize(this.item, this._horizontal);
    }

    _hasFixedCrossAxisBasis() {
        return !FlexUtils.isZeroAxisSize(this.item, !this._horizontal);
    }

    getAxisMinSize(horizontal: boolean) {
        if (this._horizontal === horizontal) {
            return this._getMainAxisMinSize();
        } else {
            return this._getCrossAxisMinSize();
        }
    }

    _getMainAxisMinSize() {
        return this._lineLayouter.mainAxisMinSize;
    }

    _getCrossAxisMinSize() {
        return this._lineLayouter.crossAxisMinSize;
    }

    resizeMainAxis(size: number) {
        if (this.mainAxisSize !== size) {
            if (this.recalc > 0) {
                this.performResizeMainAxis(size);
            } else {
                if (this._checkValidCacheMainAxisResize(size)) {
                    this.mainAxisSize = size;
                    this._fitCrossAxisSizeToContents();
                } else {
                    // Cache miss.
                    this.item.enableLocalRecalcFlag();
                    this.performResizeMainAxis(size);
                }
            }
        }
    }

    _checkValidCacheMainAxisResize(size: number) {
        const isFinalMainAxisSize = size === this.subjectMainAxisSize;
        if (isFinalMainAxisSize) {
            return true;
        }
        const canIgnoreCacheMiss = !this.isCrossAxisFitToContents();

        // Allow other main axis resizes and check if final resize matches the subject main axis size
        //  (ItemCoordinatesUpdater).
        return canIgnoreCacheMiss;
    }

    performResizeMainAxis(size: number) {
        this._shrunk = size < this.mainAxisSize;

        this.mainAxisSize = size;

        this._resizingMainAxis = true;
        this._layoutAxes();
        this._resizingMainAxis = false;
    }

    resizeCrossAxis(size: number) {
        if (this.crossAxisSize !== size) {
            if (this.recalc > 0) {
                this.performResizeCrossAxis(size);
            } else {
                this.crossAxisSize = size;
            }
        }
    }

    performResizeCrossAxis(size: number) {
        this.crossAxisSize = size;

        this._resizingCrossAxis = true;
        this._layoutCrossAxis();
        this._resizingCrossAxis = false;
    }

    get subjectMainAxisSize() {
        return this._horizontal ? this.item.subject.getLayoutW() : this.item.subject.getLayoutH();
    }

    get subjectCrossAxisSize() {
        return this._horizontal ? this.item.subject.getLayoutH() : this.item.subject.getLayoutW();
    }

    getParentFlexContainer() {
        return this.item.isFlexItemEnabled() ? this.item.flexItem!.ctr : undefined;
    }

    _getHorizontalPadding() {
        return FlexUtils.getTotalPadding(this.item, true);
    }

    _getVerticalPadding() {
        return FlexUtils.getTotalPadding(this.item, false);
    }

    _getHorizontalPaddingOffset() {
        return FlexUtils.getPaddingOffset(this.item, true);
    }

    _getVerticalPaddingOffset() {
        return FlexUtils.getPaddingOffset(this.item, false);
    }

    _getMainAxisBasis() {
        return FlexUtils.getRelAxisSize(this.item, this._horizontal);
    }

    _getCrossAxisBasis() {
        return FlexUtils.getRelAxisSize(this.item, !this._horizontal);
    }

    get _horizontal() {
        return this._flexContainer.horizontal;
    }

    get _reverse() {
        return this._flexContainer.reverse;
    }

    get item() {
        return this._flexContainer.item;
    }

    get items(): FlexTarget[] {
        return this.item.items;
    }

    get resizingMainAxis() {
        return this._resizingMainAxis;
    }

    get resizingCrossAxis() {
        return this._resizingCrossAxis;
    }

    get numberOfItems() {
        return this.items.length;
    }

    get mainAxisSize() {
        return FlexUtils.getAxisLayoutSize(this.item, this._horizontal);
    }

    set mainAxisSize(v) {
        FlexUtils.setAxisLayoutSize(this.item, this._horizontal, v);
    }

    get crossAxisSize() {
        return FlexUtils.getAxisLayoutSize(this.item, !this._horizontal);
    }

    set crossAxisSize(v) {
        FlexUtils.setAxisLayoutSize(this.item, !this._horizontal, v);
    }
}
