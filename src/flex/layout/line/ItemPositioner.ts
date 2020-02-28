import getSpacing from "../spacing";
import LineLayout from "./LineLayout";

export default class ItemPositioner {
    constructor(private line: LineLayout) {}

    private get _layout() {
        return this.line.getLayout();
    }

    position() {
        const { spacingBefore, spacingBetween } = this.getSpacing();

        let currentPos = spacingBefore;

        const items = this.line.items;
        for (let i = this.line.startIndex; i <= this.line.endIndex; i++) {
            const item = items[i];

            item.flexItem!.setMainAxisLayoutPos(currentPos);
            currentPos += item.flexItem!.getMainAxisLayoutSizeWithPaddingAndMargin();
            currentPos += spacingBetween;
        }
    }

    private getSpacing() {
        const remainingSpace = this.line.availableSpace;
        const mode = this._layout.container.justifyContent;
        const numberOfItems = this.line.numberOfItems;

        return getSpacing(mode, numberOfItems, remainingSpace);
    }
}
