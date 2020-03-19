import Element from './Element';
import Texture from './Texture';

export default class ElementListeners {
  public onSetup?: ElementEventCallback;
  public onAttach?: ElementEventCallback;
  public onDetach?: ElementEventCallback;
  public onActive?: ElementEventCallback;
  public onInactive?: ElementEventCallback;
  public onEnabled?: ElementEventCallback;
  public onDisabled?: ElementEventCallback;
  public onResize?: ElementResizeEventCallback;
  public onTextureError?: ElementTextureErrorEventCallback;
  public onTextureLoaded?: ElementTextureEventCallback;
  public onTextureUnloaded?: ElementTextureEventCallback;
}

export type ElementEventCallback = (element: Element) => void;
export type ElementResizeEventCallback = (element: Element, w: number, h: number) => void;
export type ElementTextureEventCallback = (element: Element, texture: Texture) => void;
export type ElementTextureErrorEventCallback = (element: Element, texture: Texture, error: Error) => void;
