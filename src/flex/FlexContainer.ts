import Base from "../tree/Base";
import Layout from "./layout/FlexLayout";
import FlexTarget from "./FlexTarget";

export default class FlexContainer {
    public static readonly ALIGN_ITEMS = ["flex-start", "flex-end", "center", "stretch"];
    public static readonly ALIGN_CONTENT = [
        "flex-start",
        "flex-end",
        "center",
        "space-between",
        "space-around",
        "space-evenly",
        "stretch"
    ];
    public static readonly JUSTIFY_CONTENT = [
        "flex-start",
        "flex-end",
        "center",
        "space-between",
        "space-around",
        "space-evenly"
    ];

    public horizontal: boolean;
    public reverse: boolean;

    private _layout: Layout;
    private _wrap: boolean;
    private _alignItems: string;
    private _justifyContent: string;
    private _alignContent: string;

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

    _changedDimensions() {
        this.item.changedDimensions();
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

    set alignItems(v) {
        if (this._alignItems === v) return;
        if (FlexContainer.ALIGN_ITEMS.indexOf(v) === -1) {
            throw new Error("Unknown alignItems, options: " + FlexContainer.ALIGN_ITEMS.join(","));
        }
        this._alignItems = v;

        this._changedContents();
    }

    get alignContent() {
        return this._alignContent;
    }

    set alignContent(v) {
        if (this._alignContent === v) return;
        if (FlexContainer.ALIGN_CONTENT.indexOf(v) === -1) {
            throw new Error("Unknown alignContent, options: " + FlexContainer.ALIGN_CONTENT.join(","));
        }
        this._alignContent = v;

        this._changedContents();
    }

    get justifyContent() {
        return this._justifyContent;
    }

    set justifyContent(v) {
        if (this._justifyContent === v) return;

        if (FlexContainer.JUSTIFY_CONTENT.indexOf(v) === -1) {
            throw new Error("Unknown justifyContent, options: " + FlexContainer.JUSTIFY_CONTENT.join(","));
        }
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

    patch(settings) {
        Base.patchObject(this, settings);
    }
}
