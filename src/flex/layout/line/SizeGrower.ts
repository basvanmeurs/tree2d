import LineLayout from './LineLayout';

export default class SizeGrower {
  private amountRemaining: number = 0;
  private grownSize: number = 0;

  constructor(private line: LineLayout) {}

  grow(amount: number) {
    this.grownSize = 0;

    this.amountRemaining = amount;
    let totalGrowAmount = this.getTotalGrowAmount();
    if (totalGrowAmount) {
      const items = this.line.items;
      do {
        const amountPerGrow = this.amountRemaining / totalGrowAmount;
        for (let i = this.line.startIndex; i <= this.line.endIndex; i++) {
          const item = items[i];
          const flexItem = item.flexItem!;
          const growAmount = flexItem.grow;
          const isGrowableItem = growAmount > 0;
          if (isGrowableItem) {
            let grow = growAmount * amountPerGrow;
            const maxSize = flexItem.getMainAxisMaxSizeSetting();
            const size = flexItem.getMainAxisLayoutSize();
            if (maxSize > 0) {
              if (size >= maxSize) {
                // Already fully grown.
                grow = 0;
              } else {
                const maxGrow = maxSize - size;
                const isFullyGrown = grow >= maxGrow;
                if (isFullyGrown) {
                  grow = maxGrow;

                  // Destribute remaining amount over the other flex items.
                  totalGrowAmount -= growAmount;
                }
              }
            }

            if (grow > 0) {
              const finalSize = size + grow;
              flexItem.resizeMainAxis(finalSize);

              this.grownSize += grow;
              this.amountRemaining -= grow;

              if (Math.abs(this.amountRemaining) < 10e-6) {
                return;
              }
            }
          }
        }
      } while (totalGrowAmount && Math.abs(this.amountRemaining) > 10e-6);
    }
  }

  private getTotalGrowAmount() {
    let total = 0;
    const items = this.line.items;
    for (let i = this.line.startIndex; i <= this.line.endIndex; i++) {
      const item = items[i];
      const flexItem = item.flexItem!;

      if (flexItem.grow) {
        const maxSize = flexItem.getMainAxisMaxSizeSetting();
        const size = flexItem.getMainAxisLayoutSize();

        // Exclude those already fully grown.
        if (maxSize === 0 || size < maxSize) {
          total += flexItem.grow;
        }
      }
    }
    return total;
  }

  getGrownSize() {
    return this.grownSize;
  }
}
