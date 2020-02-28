import SpacingCalculator from "./SpacingCalculator";
import FlexLayouter from "./FlexLayouter";

export default class ContentAligner {

    private totalCrossAxisSize: number = 0;

    constructor(private layout: FlexLayouter) {
        this.init();
    }

    private init() {
        this.totalCrossAxisSize = this.calcTotalCrossAxisSize();
    }

    private get lines() {
        return this.layout.getLines()!;
    }

    align() {
        const crossAxisSize = this.layout.crossAxisSize;
        const remainingSpace = crossAxisSize - this.totalCrossAxisSize;

        const { spacingBefore, spacingBetween } = this.getSpacing(remainingSpace);

        const lines = this.lines;

        const mode = this.layout.container.alignContent;
        let growSize = 0;
        if (mode === "stretch" && lines.length && remainingSpace > 0) {
            growSize = remainingSpace / lines.length;
        }

        let currentPos = spacingBefore;
        for (let i = 0, n = lines.length; i < n; i++) {
            const crossAxisLayoutOffset = currentPos;
            const aligner = lines[i].createItemAligner();

            const finalCrossAxisLayoutSize = lines[i].crossAxisLayoutSize + growSize;

            aligner.setCrossAxisLayoutSize(finalCrossAxisLayoutSize);
            aligner.setCrossAxisLayoutOffset(crossAxisLayoutOffset);

            aligner.align();

            if (aligner.getRecursiveResizeOccured()) {
                lines[i].setItemPositions();
            }

            currentPos += finalCrossAxisLayoutSize;
            currentPos += spacingBetween;
        }
    }

    getTotalCrossAxisSize() {
        return this.totalCrossAxisSize;
    }

    private calcTotalCrossAxisSize() {
        const lines = this.lines;
        let total = 0;
        for (let i = 0, n = lines.length; i < n; i++) {
            const line = lines[i];
            total += line.crossAxisLayoutSize;
        }
        return total;
    }

    private getSpacing(remainingSpace: number) {
        const mode = this.layout.container.alignContent;
        const numberOfItems = this.lines.length;
        return SpacingCalculator.getSpacing(mode, numberOfItems, remainingSpace);
    }
}
