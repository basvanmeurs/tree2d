import Layout from "./layout/FlexLayouter";
import FlexTarget from "./FlexTarget";
import { SpacingMode } from "./layout/SpacingCalculator";

export type AlignItemsMode = "flex-start" | "flex-end" | "center" | "stretch";

export type JustifyContentMode =
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";

export type AlignContentMode = SpacingMode;

export default class FlexContainer {
    public horizontal: boolean;
    public reverse: boolean;

    public _layout: Layout;
    private _wrap: boolean;
    private _alignItems: AlignItemsMode;
    private _justifyContent: JustifyContentMode;
    private _alignContent: AlignContentMode;

    private _paddingLeft: number;
    private _paddingTop: number;
    private _paddingRight: number;
    private _paddingBottom: number;

    constructor(public readonly item: FlexTarget) {
        this._layout = new Layout(this);
        this.horizontal = true;
        this.reverse = false;
        this._wrap = false;
        this._alignItems = "stretch";
        this._justifyContent = "flex-start";
        this._alignContent = "flex-start";

        this._paddingLeft = 0;
        this._paddingTop = 0;
        this._paddingRight = 0;
        this._paddingBottom = 0;
    }

    get layout() {
        return this._layout;
    }

    _changedDimensions() {
        this.item.forceLayout();
    }

    _changedContents() {
        this.item.changedContents();
    }

    get direction() {
        return (this.horizontal ? "row" : "column") + (this.reverse ? "-reverse" : "");
    }

    set direction(f) {
        if (this.direction === f) return;

        this.horizontal = f === "row" || f === "row-reverse";
        this.reverse = f === "row-reverse" || f === "column-reverse";

        this._changedContents();
    }

    set wrap(v) {
        this._wrap = v;
        this._changedContents();
    }

    get wrap() {
        return this._wrap;
    }

    get alignItems() {
        return this._alignItems;
    }

    set alignItems(v: AlignItemsMode) {
        if (this._alignItems === v) return;

        this._alignItems = v;

        this._changedContents();
    }

    get alignContent() {
        return this._alignContent;
    }

    set alignContent(v: AlignContentMode) {
        if (this._alignContent === v) return;
        this._alignContent = v;

        this._changedContents();
    }

    get justifyContent() {
        return this._justifyContent;
    }

    set justifyContent(v: JustifyContentMode) {
        if (this._justifyContent === v) return;

        this._justifyContent = v;

        this._changedContents();
    }

    set padding(v) {
        this.paddingLeft = v;
        this.paddingTop = v;
        this.paddingRight = v;
        this.paddingBottom = v;
    }

    get padding() {
        return this.paddingLeft;
    }

    set paddingLeft(v) {
        this._paddingLeft = v;
        this._changedDimensions();
    }

    get paddingLeft() {
        return this._paddingLeft;
    }

    set paddingTop(v) {
        this._paddingTop = v;
        this._changedDimensions();
    }

    get paddingTop() {
        return this._paddingTop;
    }

    set paddingRight(v) {
        this._paddingRight = v;
        this._changedDimensions();
    }

    get paddingRight() {
        return this._paddingRight;
    }

    set paddingBottom(v) {
        this._paddingBottom = v;
        this._changedDimensions();
    }

    get paddingBottom() {
        return this._paddingBottom;
    }
}
