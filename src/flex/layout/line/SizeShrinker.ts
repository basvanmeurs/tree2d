import LineLayout from "./LineLayout";

export default class SizeShrinker {
    private amountRemaining: number = 0;
    private shrunkSize: number = 0;

    constructor(private line: LineLayout) {}

    shrink(amount: number) {
        this.shrunkSize = 0;

        this.amountRemaining = amount;
        let totalShrinkAmount = this.getTotalShrinkAmount();
        if (totalShrinkAmount) {
            const items = this.line.items;
            do {
                const amountPerShrink = this.amountRemaining / totalShrinkAmount;
                for (let i = this.line.startIndex; i <= this.line.endIndex; i++) {
                    const item = items[i];
                    const flexItem = item.flexItem!;
                    const shrinkAmount = flexItem.shrink;
                    const isShrinkableItem = shrinkAmount > 0;
                    if (isShrinkableItem) {
                        let shrink = shrinkAmount * amountPerShrink;
                        const minSize = flexItem.getMainAxisMinSize();
                        const size = flexItem.getMainAxisLayoutSize();
                        if (size > minSize) {
                            const maxShrink = size - minSize;
                            const isFullyShrunk = shrink >= maxShrink;
                            if (isFullyShrunk) {
                                shrink = maxShrink;

                                // Destribute remaining amount over the other flex items.
                                totalShrinkAmount -= shrinkAmount;
                            }

                            const finalSize = size - shrink;
                            flexItem.resizeMainAxis(finalSize);

                            this.shrunkSize += shrink;
                            this.amountRemaining -= shrink;

                            if (Math.abs(this.amountRemaining) < 10e-6) {
                                return;
                            }
                        }
                    }
                }
            } while (totalShrinkAmount && Math.abs(this.amountRemaining) > 10e-6);
        }
    }

    private getTotalShrinkAmount() {
        let total = 0;
        const items = this.line.items;
        for (let i = this.line.startIndex; i <= this.line.endIndex; i++) {
            const item = items[i];
            const flexItem = item.flexItem!;

            if (flexItem.shrink) {
                const minSize = flexItem.getMainAxisMinSize();
                const size = flexItem.getMainAxisLayoutSize();

                // Exclude those already fully shrunk.
                if (size > minSize) {
                    total += flexItem.shrink;
                }
            }
        }
        return total;
    }

    getShrunkSize() {
        return this.shrunkSize;
    }
}
