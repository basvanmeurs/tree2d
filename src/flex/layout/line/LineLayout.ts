import SizeShrinker from './SizeShrinker';
import SizeGrower from './SizeGrower';
import ItemPositioner from './ItemPositioner';
import ItemAligner from './ItemAligner';
import FlexLayouter from '../FlexLayouter';
import FlexNode from '../../FlexNode';

export default class LineLayout {
  public items: FlexNode[];
  private crossAxisMaxLayoutSize: number;

  constructor(
    private layout: FlexLayouter,
    public startIndex: number,
    public endIndex: number,
    public availableSpace: number,
  ) {
    this.items = layout.items;
  }

  getLayout() {
    return this.layout;
  }

  performLayout() {
    this._setItemSizes();
    this.setItemPositions();
    this._calcLayoutInfo();
  }

  _setItemSizes() {
    if (this.availableSpace > 0) {
      this._growItemSizes(this.availableSpace);
    } else if (this.availableSpace < 0) {
      this._shrinkItemSizes(-this.availableSpace);
    }
  }

  _growItemSizes(amount: number) {
    const grower = new SizeGrower(this);
    grower.grow(amount);
    this.availableSpace -= grower.getGrownSize();
  }

  _shrinkItemSizes(amount: number) {
    const shrinker = new SizeShrinker(this);
    shrinker.shrink(amount);
    this.availableSpace += shrinker.getShrunkSize();
  }

  setItemPositions() {
    const positioner = new ItemPositioner(this);
    positioner.position();
  }

  createItemAligner() {
    return new ItemAligner(this);
  }

  _calcLayoutInfo() {
    this._calcCrossAxisMaxLayoutSize();
  }

  getMainAxisMinSize() {
    let mainAxisMinSize = 0;
    for (let i = this.startIndex; i <= this.endIndex; i++) {
      const item = this.items[i];
      mainAxisMinSize += item.flexItem!.getMainAxisMinSizeWithPaddingAndMargin();
    }
    return mainAxisMinSize;
  }

  get numberOfItems() {
    return this.endIndex - this.startIndex + 1;
  }

  get crossAxisLayoutSize() {
    const noSpecifiedCrossAxisSize = this.layout.isCrossAxisFitToContents() && !this.layout.isResizingCrossAxis();
    const shouldFitToContents = this.layout.isWrapping() || noSpecifiedCrossAxisSize;
    if (shouldFitToContents) {
      return this.crossAxisMaxLayoutSize;
    } else {
      return this.layout.crossAxisSize;
    }
  }

  _calcCrossAxisMaxLayoutSize() {
    this.crossAxisMaxLayoutSize = this._getCrossAxisMaxLayoutSize();
  }

  _getCrossAxisMaxLayoutSize() {
    let crossAxisMaxSize = 0;
    for (let i = this.startIndex; i <= this.endIndex; i++) {
      const item = this.items[i];
      crossAxisMaxSize = Math.max(crossAxisMaxSize, item.flexItem!.getCrossAxisLayoutSizeWithPaddingAndMargin());
    }
    return crossAxisMaxSize;
  }
}
