import ContentAligner from "./ContentAligner";
import LineLayouter from "./LineLayouter";
import ItemCoordinatesUpdater from "./ItemCoordinatesUpdater";
import FlexContainer from "../FlexContainer";
import FlexNode from "../FlexNode";

/**
 * Layouts a flex container (and descendants).
 */
export default class FlexLayouter {
    private lineLayouter: LineLayouter = new LineLayouter(this);

    private resizingMainAxis: boolean = false;
    private resizingCrossAxis: boolean = false;

    private cachedMainAxisSizeAfterLayout: number = 0;
    private cachedCrossAxisSizeAfterLayout: number = 0;

    private shrunk: boolean = false;

    private totalCrossAxisSize: number;

    constructor(public container: FlexContainer) {}

    layoutTree() {
        if (this.isSubTree()) {
            // This can occur if only a part of the flex hierarchy needs to be updated.
            this.updateSubTreeLayout();
        } else {
            this.updateTreeLayout();
        }
        this.updateItemCoords();
    }

    private isSubTree() {
        return !!this.item.flexParent;
    }

    updateTreeLayout() {
        if (this.recalc) {
            this.performUpdateLayoutTree();
        } else {
            this.performUpdateLayoutTreeFromCache();
        }
    }

    private performUpdateLayoutTree() {
        this.initializeAxisSizes();
        this.layoutAxes();
        this.setLayoutCache();
    }

    private setLayoutCache() {
        this.cachedMainAxisSizeAfterLayout = this.mainAxisSize;
        this.cachedCrossAxisSizeAfterLayout = this.crossAxisSize;
    }

    private performUpdateLayoutTreeFromCache() {
        const sizeMightHaveChanged = this.item.sourceFuncW || this.item.sourceFuncH;
        if (sizeMightHaveChanged) {
            // Update after all.
            this.item.enableLocalRecalcFlag();
            this.performUpdateLayoutTree();
        } else {
            this.mainAxisSize = this.cachedMainAxisSizeAfterLayout;
            this.crossAxisSize = this.cachedCrossAxisSizeAfterLayout;
        }
    }

    updateItemCoords() {
        const updater = new ItemCoordinatesUpdater(this);
        updater.finalize();
    }

    private updateSubTreeLayout() {
        // The dimensions of this container are guaranteed not to have changed.
        // That's why we can safely 'reuse' those and re-layout the contents.
        const crossAxisSize = this.crossAxisSize;
        this.layoutMainAxis();
        this.performResizeCrossAxis(crossAxisSize);
    }

    private initializeAxisSizes() {
        if (this.item.isFlexItemEnabled()) {
            if (this.item.flexItem) {
                this.item.flexItem._resetLayoutSize();
            }
        } else {
            this.mainAxisSize = this.getMainAxisBasis();
            this.crossAxisSize = this.getCrossAxisBasis();
        }
        this.resizingMainAxis = false;
        this.resizingCrossAxis = false;
        this.shrunk = false;
    }

    private layoutAxes() {
        this.layoutMainAxis();
        this.layoutCrossAxis();
    }

    private layoutMainAxis() {
        this.lineLayouter.layoutLines();
        this.fitMainAxisSizeToContents();
    }

    getLines() {
        return this.lineLayouter.lines;
    }

    private fitMainAxisSizeToContents() {
        if (!this.resizingMainAxis) {
            if (this.isMainAxisFitToContents()) {
                this.mainAxisSize = this.lineLayouter.mainAxisContentSize;
            }
        }
    }

    private layoutCrossAxis() {
        const aligner = new ContentAligner(this);
        this.totalCrossAxisSize = aligner.getTotalCrossAxisSize();
        this.fitCrossAxisSizeToContents();
        aligner.align();
    }

    private fitCrossAxisSizeToContents() {
        if (!this.resizingCrossAxis) {
            if (this.isCrossAxisFitToContents()) {
                this.crossAxisSize = this.totalCrossAxisSize;
            }
        }
    }

    isWrapping() {
        return this.container.wrap;
    }

    isAxisFitToContents(horizontal: boolean) {
        if (this.horizontal === horizontal) {
            return this.isMainAxisFitToContents();
        } else {
            return this.isCrossAxisFitToContents();
        }
    }

    isMainAxisFitToContents() {
        return !this.isWrapping() && !this.hasFixedMainAxisBasis();
    }

    isCrossAxisFitToContents() {
        return !this.hasFixedCrossAxisBasis();
    }

    private hasFixedMainAxisBasis() {
        return !this.item.isZeroAxisSize(this.horizontal);
    }

    private hasFixedCrossAxisBasis() {
        return !this.item.isZeroAxisSize(!this.horizontal);
    }

    getAxisMinLineSize(horizontal: boolean) {
        if (this.horizontal === horizontal) {
            return this.lineLayouter.mainAxisMinSize;
        } else {
            return this.lineLayouter.crossAxisMinSize;
        }
    }

    resizeMainAxis(size: number) {
        if (this.mainAxisSize !== size) {
            if (this.recalc > 0) {
                this.performResizeMainAxis(size);
            } else {
                if (this.checkValidCacheMainAxisResize(size)) {
                    this.mainAxisSize = size;
                    this.fitCrossAxisSizeToContents();
                } else {
                    // Cache miss.
                    this.item.enableLocalRecalcFlag();
                    this.performResizeMainAxis(size);
                }
            }
        }
    }

    private checkValidCacheMainAxisResize(size: number) {
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
        this.shrunk = size < this.mainAxisSize;

        this.mainAxisSize = size;

        this.resizingMainAxis = true;
        this.layoutAxes();
        this.resizingMainAxis = false;
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

        this.resizingCrossAxis = true;
        this.layoutCrossAxis();
        this.resizingCrossAxis = false;
    }

    private get subjectMainAxisSize() {
        return this.horizontal ? this.item.subject.getLayoutW() : this.item.subject.getLayoutH();
    }

    getParentFlexContainer() {
        return this.item.isFlexItemEnabled() ? this.item.flexItem!.ctr : undefined;
    }

    private getMainAxisBasis() {
        return this.item.getRelAxisSize(this.horizontal);
    }

    private getCrossAxisBasis() {
        return this.item.getRelAxisSize(!this.horizontal);
    }

    get horizontal() {
        return this.container.horizontal;
    }

    get reverse() {
        return this.container.reverse;
    }

    get item() {
        return this.container.node;
    }

    get items(): FlexNode[] {
        return this.item.items;
    }

    isResizingMainAxis() {
        return this.resizingMainAxis;
    }

    isResizingCrossAxis() {
        return this.resizingCrossAxis;
    }

    get mainAxisSize() {
        return this.item.getAxisLayoutSize(this.horizontal);
    }

    set mainAxisSize(v) {
        this.item.setAxisLayoutSize(this.horizontal, v);
    }

    get crossAxisSize() {
        return this.item.getAxisLayoutSize(!this.horizontal);
    }

    set crossAxisSize(v) {
        this.item.setAxisLayoutSize(!this.horizontal, v);
    }

    hasShrunk() {
        return this.shrunk;
    }

    get recalc() {
        return this.item.recalc;
    }


}
