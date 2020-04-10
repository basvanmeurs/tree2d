import Element from "./Element";
import Texture from "./Texture";

export default class ElementListeners {
    public onSetup?: ElementEventCallback = undefined;
    public onAttach?: ElementEventCallback = undefined;
    public onDetach?: ElementEventCallback = undefined;
    public onActive?: ElementEventCallback = undefined;
    public onInactive?: ElementEventCallback = undefined;
    public onEnabled?: ElementEventCallback = undefined;
    public onDisabled?: ElementEventCallback = undefined;
    public onResize?: ElementResizeEventCallback = undefined;
    public onTextureError?: ElementTextureErrorEventCallback = undefined;
    public onTextureLoaded?: ElementTextureEventCallback = undefined;
    public onTextureUnloaded?: ElementTextureEventCallback = undefined;
}

export type ElementEventCallback = (e: { element: Element }) => void;
export type ElementResizeEventCallback = (e: { element: Element; w: number; h: number }) => void;
export type ElementTextureEventCallback = (e: { element: Element; texture: Texture }) => void;
export type ElementTextureErrorEventCallback = (e: { element: Element; texture: Texture; error: Error }) => void;
