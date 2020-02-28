import FlexNode from "./FlexNode";

export interface FlexSubject {

    getChildren(): FlexSubject[] | undefined;

    getParent(): FlexSubject | undefined;

    getLayout(): FlexNode;

    // Set the layout results.
    setLayoutCoords(x: number, y: number): void;
    setLayoutDimensions(w: number, h: number): void;

    // Called when a new flex container layout is necessary.
    // It's up to the subject to trigger an update loop which should
    // call FlexTarget.layoutFlexTree().
    triggerLayout(): void;

    // An invisible subject doesn't take space in the flex container
    isVisible(): boolean;

    // The 'set' layout dimensions.
    getSourceX(): number;
    getSourceY(): number;
    getSourceW(): number;
    getSourceH(): number;

    // Relative functions for the layout dimensions.
    getSourceFuncX(): ((parentW: number) => number) | undefined;
    getSourceFuncY(): ((parentH: number) => number) | undefined;
    getSourceFuncW(): ((parentW: number) => number) | undefined;
    getSourceFuncH(): ((parentH: number) => number) | undefined;

    // Last layout results.
    // Flexbox engine will be able to use cache if the layout dimensions were not changed since last frame.
    // It is important these to not be changed externally since the last frame.
    getLayoutX(): number;
    getLayoutY(): number;
    getLayoutW(): number;
    getLayoutH(): number;
}
