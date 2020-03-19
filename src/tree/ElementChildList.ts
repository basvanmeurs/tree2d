/**
 * Manages the list of children for an element.
 */

import ObjectList from './ObjectList';
import Element from './Element';

const gc = (i: Element) => i.core;

export default class ElementChildList extends ObjectList<Element> {
  constructor(private readonly element: Element) {
    super();
  }

  protected onAdd(item: Element, index: number) {
    this.connectParent(item);
    this.element.core.addChildAt(index, item.core);
  }

  protected onRemove(item: Element, index: number) {
    item._setParent(undefined);
    this.element.core.removeChildAt(index);
  }

  protected onSync(removed: Element[], added: Element[], order: Element[]) {
    for (let i = 0, n = removed.length; i < n; i++) {
      removed[i]._setParent(undefined);
    }
    for (let i = 0, n = added.length; i < n; i++) {
      this.connectParent(added[i]);
    }
    this.element.core.syncChildren(removed.map(gc), added.map(gc), order.map(gc));
  }

  protected onSet(item: Element, index: number, prevItem: Element) {
    prevItem._setParent(undefined);

    this.connectParent(item);
    this.element.core.setChildAt(index, item.core);
  }

  protected onMove(item: Element, fromIndex: number, toIndex: number) {
    this.element.core.moveChild(fromIndex, toIndex);
  }

  private connectParent(item: Element) {
    const prevParent = item.parent;
    if (prevParent && prevParent !== this.element) {
      // Cleanup in previous child list.
      const prevChildList = prevParent.childList;
      const index = prevChildList.getIndex(item);
      prevChildList.removeSilently(index);

      // Also clean up element core.
      prevParent.core.removeChildAt(index);
    }

    item._setParent(this.element);
  }
}
