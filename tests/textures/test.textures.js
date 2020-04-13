describe("textures", function () {
    this.timeout(0);

    let root;
    let stage;

    class TestTexture extends tree2d.Texture {
        _getLookupId() {
            return this._lookupId;
        }

        set lookupId(id) {
            this._lookupId = id;
        }

        set error(e) {
            this._error = e;
        }

        set async(t) {
            this._async = t;
        }

        set invalid(v) {
            this._invalid = v;
        }

        _getIsValid() {
            return !this._invalid;
        }

        _getSourceLoader() {
            return (cb) => {
                const canvas = this.stage.getDrawingCanvas();
                tree2d.RoundRectTexture.drawOnCanvas(canvas, { w: 100, h: 100, radius: [30, 30, 30, 30] }, 1);
                const opts = Object.assign({}, this.stage.platform.getTextureOptionsForDrawingCanvas(canvas));
                if (this._async) {
                    this.asyncLoad = () => {
                        if (this._error) {
                            return cb(this._error);
                        }
                        cb(undefined, opts);
                    };
                } else {
                    if (this._error) {
                        return cb(this._error);
                    }
                    cb(undefined, opts);
                }
            };
        }
    }

    before(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 500;
        stage = new tree2d.Stage(canvas, { clearColor: 0xffff0000, pixelRatio: 1, autostart: false });
        root = stage.root;
    });

    describe("load", () => {
        describe("visible:false", () => {
            it("should not be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, async: false }, visible: false },
                    },
                });
                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");
            });
        });

        describe("alpha:0", () => {
            it("should not be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, async: false }, alpha: 0 },
                    },
                });
                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");
            });
        });

        describe("invalid", () => {
            it("should not be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, invalid: true, async: false }, alpha: 0 },
                    },
                });
                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");
                chai.assert(!texture.source, "Texture should not have source");
            });
        });

        describe("out of bounds", () => {
            it("should not be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 700, texture: { type: TestTexture, async: false } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");
            });
        });

        describe("within bounds margin", () => {
            it("should be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: false } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
        });

        describe("within viewport", () => {
            it("should be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: false } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
        });

        describe("async", () => {
            it("should load after async", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");

                chai.assert(element.getByRef("Item").texture.source.isLoading(), "texture loading");
                chai.assert(!element.getByRef("Item").texture.source.isLoaded(), "texture not loaded");

                texture.asyncLoad();

                chai.assert(!element.getByRef("Item").texture.source.isLoading(), "texture not loading");
                chai.assert(element.getByRef("Item").texture.source.isLoaded(), "texture loaded");

                stage.drawFrame();
                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });

            it("should load after async during first frame [with throttling]", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not be loaded");

                chai.assert(element.getByRef("Item").texture.source.isLoading(), "texture loading");
                chai.assert(!element.getByRef("Item").texture.source.isLoaded(), "texture not loaded");

                texture.asyncLoad();
                stage.drawFrame();

                chai.assert(!element.getByRef("Item").texture.source.isLoading(), "texture not loading");
                chai.assert(element.getByRef("Item").texture.source.isLoaded(), "texture loaded");
                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
        });

        describe("regression", () => {
            class ImageTexture extends TestTexture {
                constructor(stage) {
                    super(stage);

                    this._src = undefined;
                }

                get src() {
                    return this._src;
                }

                set src(v) {
                    if (this._src !== v) {
                        this._src = v;
                        this._changed();
                    }
                }

                _getIsValid() {
                    return !!this._src;
                }

                _getLookupId() {
                    return this._src;
                }
            }
        });
    });

    describe("cancel", () => {
        describe("trigger visibility while loading", () => {
            it("should cancel", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                element.getByRef("Item").visible = false;
                stage.drawFrame();

                texture.asyncLoad();
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");
            });
        });

        describe("visible after cancel", () => {
            it("should recover load", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const texture = element.getByRef("Item").texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                element.getByRef("Item").visible = false;
                stage.drawFrame();

                texture.asyncLoad();
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                element.getByRef("Item").visible = true;
                stage.drawFrame();
                texture.asyncLoad();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
            it("should recover load [with throttling]", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const item = element.getByRef("Item");
                const texture = item.texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                item.visible = false;
                stage.drawFrame();

                texture.asyncLoad();
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                item.visible = true;
                texture.asyncLoad();
                stage.drawFrame();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
        });

        describe("visible after cancel (previous load fired)", () => {
            it("should recover load", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const item = element.getByRef("Item");
                const texture = item.texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                item.visible = false;
                stage.drawFrame();

                const prevAsyncLoad = texture.asyncLoad;
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                item.visible = true;
                stage.drawFrame();
                prevAsyncLoad();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });

            it("should recover load [with throttling]", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const item = element.getByRef("Item");
                const texture = item.texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                item.visible = false;
                stage.drawFrame();

                const prevAsyncLoad = texture.asyncLoad;
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                item.visible = true;
                prevAsyncLoad();
                stage.drawFrame();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });
        });

        describe("visible after cancel (both loads fired)", () => {
            it("should recover load", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                const item = element.getByRef("Item");
                const texture = item.texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                item.visible = false;
                stage.drawFrame();

                const prevAsyncLoad = texture.asyncLoad;
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                item.visible = true;
                stage.drawFrame();
                prevAsyncLoad();
                texture.asyncLoad();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });

            let item, element;

            it("should recover load", () => {
                element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } },
                    },
                });

                root.children = [element];
                item = element.getByRef("Item");
                const texture = item.texture;

                stage.drawFrame();
                chai.assert(!texture.isLoaded(), "Texture must not yet be loaded");

                item.visible = false;
                stage.drawFrame();

                const prevAsyncLoad = texture.asyncLoad;
                chai.assert(!texture.isLoaded(), "Texture load callback must be ignored");

                item.visible = true;
                prevAsyncLoad();
                texture.asyncLoad();
                stage.drawFrame();

                chai.assert(texture.isLoaded(), "Texture must be loaded");
            });

            describe("becomes invisible", () => {
                it("should *not* clean up texture automatically(unconfirmed performance bottleneck)", () => {
                    item.visible = false;
                    const texture = element.getByRef("Item").texture;
                    chai.assert(texture.isLoaded(), "Texture must still be loaded");
                });
                it("should clean up texture manually", () => {
                    item.visible = false;
                    const texture = element.getByRef("Item").texture;
                    texture.free();
                    chai.assert(!texture.isLoaded(), "Texture must no longer be loaded");
                });
            });
        });
    });

    describe("lookup id", () => {
        describe("not active", () => {
            it("should not be added to reusable sources", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: false },
                    },
                });
                root.children = [element];

                stage.drawFrame();
                chai.assert(!stage.textureManager.getReusableTextureSource("test1"), "lookup id should not be known");
            });
        });

        let element;

        describe("active", () => {
            it("should be added to reusable sources", () => {
                element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true },
                    },
                });

                root.children = [element];

                stage.drawFrame();
                chai.assert(!!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be known");
            });
        });

        describe("becomes invisible", () => {
            it("should keep texture", () => {
                element.getByRef("Item").visible = false;
                const texture = element.getByRef("Item").texture;
                chai.assert(texture.isLoaded(), "Texture must still be loaded");
            });
        });

        describe("on GC", () => {
            before(() => {
                // Clean up.
                stage.textureManager.textureSourceHashmap.clear();
            });

            it("should clear lookup id", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true },
                    },
                });

                root.children = [element];

                stage.drawFrame();

                chai.assert(!!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be known");

                element.getByRef("Item").visible = false;
                stage.drawFrame();

                chai.assert(!!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be known");

                // Clean up.
                stage.textureManager.gc();

                chai.assert(!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be removed");
            });
        });

        describe("previously removed texture source", () => {
            it("should reuse newer texture source with new lookup id", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true },
                    },
                });

                root.children = [element];

                stage.drawFrame();

                const item = element.getByRef("Item");
                chai.assert(!!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be known");
                chai.assert(item.texture.source.isLoaded(), "texture loaded");

                item.visible = false;
                stage.drawFrame();

                // Clean up.
                stage.textureManager.gc();

                chai.assert(
                    item.texture.source._activeTextureCount === 0,
                    "Active count of texture source should be 0",
                );

                chai.assert(!item.texture.source.isLoaded(), "texture no longer loaded");

                // Now create new texture source.
                const newElement = stage.createElement({
                    ref: "NewItem",
                    texture: { type: TestTexture, lookupId: "test1" },
                    visible: true,
                });
                root.childList.add(newElement);
                stage.drawFrame();

                const prevSource = item.texture.source;
                const newItem = root.getByRef("NewItem");
                chai.assert(newItem.texture.source !== item.texture.source, "texture sources should be different");

                chai.assert(
                    newItem.texture.source._activeTextureCount === 1,
                    "Active count of new texture source should be 1",
                );

                // When making the original item visible, the texture source should be replaced width the newly loaded one.
                item.visible = true;
                stage.drawFrame();
                chai.assert(newItem.texture.source === item.texture.source, "texture sources should be equal");

                chai.assert(
                    newItem.texture.source._activeTextureCount === 2,
                    "Active count of new texture source should be 2",
                );
                chai.assert(prevSource._activeTextureCount === 0, "Active count of old texture source should be 0");

                root.children = [];
                stage.drawFrame();
                stage.textureManager.gc();

                chai.assert(!stage.textureManager.getReusableTextureSource("test1"), "lookup id should be removed");
            });
        });
    });

    describe("error", () => {
        let element;
        it("should not load", () => {
            element = stage.createElement({
                children: {
                    Item: {
                        texture: {
                            type: TestTexture,
                            lookupId: "test1",
                            async: true,
                            error: new Error("Texture Error"),
                        },
                        visible: true,
                    },
                },
            });

            root.children = [element];
            stage.drawFrame();

            const texture = element.getByRef("Item").texture;

            chai.assert(!texture.source.isLoaded(), "texture not loaded");
            chai.assert(texture.source.isLoading(), "texture loading");

            texture.asyncLoad();

            chai.assert(!texture.source.isLoaded(), "texture not loaded");
            chai.assert(!texture.source.isLoading(), "texture not loading");
            chai.assert(texture.source.isError(), "texture error");
        });

        it("should retry loading after inactive/active", () => {
            const texture = element.getByRef("Item").texture;
            root.children[0].visible = false;
            texture.error = false;
            root.children[0].visible = true;
            chai.assert(!texture.source.isLoaded(), "texture not loaded");
            chai.assert(texture.source.isLoading(), "texture loading");
            chai.assert(texture.source.isError(), "texture error");
            texture.asyncLoad();
            stage.drawFrame();
            chai.assert(texture.source.isLoaded(), "texture loaded");
            chai.assert(!texture.source.isLoading(), "texture not loading");
            chai.assert(!texture.source.isError(), "texture not error");
        });
    });
});
