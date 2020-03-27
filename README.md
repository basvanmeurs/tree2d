# Tree2d

Tree2d is a 2d render tree implementation written in typescript.
It is able to render in a HTML canvas in WebGL mode, with a canvas2d fallback.

Tree2d is a lightweight an alternative to rendering via HTML DOM. Constructing and rendering elements is much faster in
tree2d than in HTML DOM. Even if you try all of the fancy css transformation performance tricks. 

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
* Flexbox layouting engine
* Performance & power consumption
    * highly optimized javascript
    * only re-renders on changes
* pixelRatio-quality rendering

## Basic usage
You'd use tree2d by first constructing a `Stage` like this:
```javascript
import Stage from "tree2d/dist/tree/Stage";
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
specified in [Stage.ts](https://github.com/Planning-nl/tree2d/blob/master/src/tree/Stage.ts#L11). 

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
[Element.ts](https://github.com/Planning-nl/tree2d/blob/master/src/tree/Element.ts#L11).
 
## Input and interactivity
Working on it.