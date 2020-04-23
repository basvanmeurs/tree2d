# Tree2d 
[![Build Status](https://img.shields.io/travis/Planning-nl/tree2d/master.svg)](https://travis-ci.org/Planning-nl/tree2d) 
[![NPM Version](https://img.shields.io/npm/v/tree2d)](https://www.npmjs.com/package/tree2d)

Tree2d is a **HTML canvas 2d render tree implementation** written in typescript. 

Tree2d is a lightweight alternative to rendering via HTML DOM. The main reason to use it instead of HTML DOM is because it is **much faster** than HTML DOM, both in terms of element creation and rendering. Use cases include games and applications with huge amounts of elements.

Tree2d utilizes **WebGL** for high-performance rendering, but can also use **Canvas2D** rendering when WebGL is not available.

Tree2d is a fork and typescript rewrite of the [Lightning](https://github.com/WebPlatformForEmbedded/Lightning) framework.

## Features
Some of the most notable features include:
* Linear transformations
    * translation
    * scaling
    * rotation
* Render properties
    * alpha
    * visibility
    * color tinting
    * gradients
* Shader-specific rendering
    * grayscale
    * your own custom WebGL vertex/fragment shaders
* Textures
    * text
    * image
    * (rounded) rectangles
    * svg
    * custom canvas drawings
* *Flexbox* layouting engine
* Performance & power consumption
    * highly optimized javascript
    * only re-renders on changes
* pixelRatio-quality rendering

## Basic usage
You'd use tree2d by first constructing a `Stage` like this:
```javascript
import { Stage } from "tree2d";
const canvas = document.getElementById('canvas');
const options = {};
const stage = new Stage(canvas, options);
```

Or, when using an include tag:
```javascript
const canvas = document.getElementById('canvas');
const options = {};
const stage = new tree2d.Stage(canvas, options);
```

While constructing this stage, you must pass the HTML canvas to render the tree on. You can also supply options as 
specified in [StageOptions.ts](https://github.com/Planning-nl/tree2d/blob/master/src/tree/StageOptions.ts#L11). 

You can then start to add elements to this stage:
```javascript
const el = stage.createElement({
    texture: {
        type: tree2d.textures.TextTexture, 
        text: "hello world", 
        fontSize: 46, 
        fontStyle: 'bold'
    }, 
    color: 0xFFFF0000
});
stage.root.childList.add(el);
```

The changes will be visible automatically upon the next drawn frame.
 
## Elements
All nodes in a tree2d tree have the same Element type. Each element can be configured with a lot of properties to 
control its' rendering, layouting and transformation. For a complete list of properties, for now you can refer to
[Element.ts](https://github.com/Planning-nl/tree2d/blob/master/src/tree/Element.ts).

## Motivition
Tree2d is very similar in features to [PixiJS](https://www.pixijs.com/).

It both supports canvas-based rendering in WebGL or Canvas2D. Both support shaders, textures, alpha and linear transformations.

But Tree2d has one hidden *killer* feature!

Tree2d keeps **track of all changes** and is able to detect which tree branches contain changes. It keeps track whether elements are visible and within the bounding box of the *clipping region*. This enables it to skip coordinate calculation and rendering for invisible, *off-screen* or *stable* (unchanged) branches, giving a performance boost in many cases. Furthermore when there are no changes at all between frames, the canvas rendering can be skipped completely resulting in less power consumption.

Other than performance gains, tracking changes allows Tree2d to automatically load textures when elements are detected to be visible and within visible bounds. Likewise, unloading is performed automatically using a garbage collection mechanism. The developer does not need to load or clean up textures manually.

PixiJS on the other hand is much more simplistic. Although it can skip invisible branches, it does not detect when elements are on- or off-screen. And it does not keep track of changes so does not have the ability to detect when there are no changes. It will simply re-render every frame and recalculate all branches, always.

In PixiJS you need to preload images and other textures manually. Developers tend to forget cleaning up their textures causing memory leaks. In our [Vugel](https://github.com/Planning-nl/vugel) 'virtual dom case' this becomes difficult or impossible (or at least undoable) as you don't have (or shouldn't have) direct access to the elements.

## Interaction
Tree2d does not include interactivity events directly. It is purely a render engine.

However, tree2d does offer a method of obtaining a z-ordered stack of elements at a pair of coordinates:
```javascript
Stage.prototype.getElementsAtCoordinates(x: number, y: number): Element[]
```
This feature can be used by higher high-level libraries to implement touch events. In fact, it's used by the [Vugel](https://github.com/Planning-nl/vugel) library to implement focus, touch and keypress events.
