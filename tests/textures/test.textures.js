describe("textures", function() {
    this.timeout(0);

    let root;
    let stage;

    class TestTexture extends lng.Texture {
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
            return cb => {
                const canvas = this.stage.getDrawingCanvas();
                lng.textures.RoundRectTexture.drawOnCanvas(canvas, {w: 100, h: 100, radius: [30, 30, 30, 30]});
                const opts = Object.assign(
                    { },
                    this.stage.platform.getTextureOptionsForDrawingCanvas(canvas)
                );
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
        stage = new lng.Stage({ w: 500, h: 500, clearColor: 0xffff0000, autostart: false });
        root = stage.root;
        document.body.appendChild(stage.getCanvas());
    });

    describe("load", () => {
        describe("visible:false", () => {
            it("should not be loaded", () => {
                const element = stage.createElement({
                    children: {
                        Item: { texture: { type: TestTexture, async: false }, visible: false }
                    }
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
                        Item: { texture: { type: TestTexture, async: false }, alpha: 0 }
                    }
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
                        Item: { texture: { type: TestTexture, invalid: true, async: false }, alpha: 0 }
                    }
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
                        Item: {x: 700, texture: {type: TestTexture, async: false}}
                    }
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
                        Item: {x: 550, texture: {type: TestTexture, async: false}}
                    }
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
                        Item: {x: 550, texture: {type: TestTexture, async: false}}
                    }
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
                        Item: {x: 550, texture: {type: TestTexture, async: true}}
                    }
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
                        Item: {x: 550, texture: {type: TestTexture, async: true}}
                    }
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

            /* FIXME: use chai-spies instead of prototype manipulation,
               chai needs to be added as node package first */
            const wrapped = TestTexture.prototype._applyResizeMode;
            let applyCalls = 0;
            before(() => {
                TestTexture.prototype._applyResizeMode = function() {
                    applyCalls += 1;
                    wrapped.apply(this);
                };
            });
            after(() => {
                TestTexture.prototype._applyResizeMode = wrapped;
            });

            it("should apply resize mode for newly created texture with existing source", () => {
                const element = stage.createElement({
                    children: {
                        Item: {
                            x: 550,
                            visible: true,
                            texture: {
                                type: TestTexture,
                                resizeMode: {type: "cover", w: 200, h: 200, clipY: 0},
                                lookupId: 1
                            }
                        }
                    }
                });
                root.children = [element];
                const item = element.getByRef("Item");
                const sourceId = item.texture.source.id;

                stage.drawFrame();
                chai.assert(item.texture.source.isLoaded(), "texture loaded");

                lng.Patcher.patchObject(element.getByRef("Item"), {
                    texture: { type: TestTexture, resizeMode: { type: "cover", w: 100, h: 100, clipY: 0 }, lookupId: 1 }
                });
                chai.assert(item.texture._resizeMode.w === 100);
                chai.assert(item.texture._resizeMode.h === 100);
                chai.assert(item.texture.source.id === sourceId, "sources should be the same");
                chai.assert(applyCalls === 2, "applyResizeMode apply should have been called for new texture");
            });

            it("should apply resizeMode for an invalid texture (that was never loaded) with existing source", () => {
                const imageSrc = "someImage";

                const element = stage.createElement({
                    children: {
                        Item: { x: 200, visible: true, w: 100, h: 100, texture: { type: ImageTexture, src: imageSrc } },
                        Item2: {
                            x: 10,
                            visible: true,
                            w: 150,
                            h: 150,
                            children: {
                                Contain: {
                                    x: 100,
                                    y: 100,
                                    mount: 0.5,
                                    texture: { type: ImageTexture, src: "", resizeMode: { type: "contain", w: 50, h: 50 } }
                                }
                            }
                        }
                    }
                });

                root.children = [element];
                const container = element.getByRef("Item2").getByRef("Contain");

                // Stub _applyResizeMode call on the second ImageTexture
                const texture = container.texture;
                texture._applyResizeMode = sinon.spy(texture._applyResizeMode);

                return new Promise(resolve => {
                    const Item1TxLoaded = () => {
                        element.getByRef("Item").onTextureLoaded = undefined;

                        setTimeout(() => {
                            // Patch Item2 with same texture as Item
                            lng.Patcher.patchObject(container, { texture: { src: imageSrc } });
                            stage.drawFrame();
                        });
                    };

                    const Item2TxLoaded = () => {
                        container.onTextureLoaded = undefined;
                        chai.assert(texture.isValid);
                        chai.assert(texture._applyResizeMode.called, "_applyResizeMode was never called");
                        resolve();
                    };

                    // Wait for first texture loading
                    element.getByRef("Item").onTextureLoaded = Item1TxLoaded;
                    // Wait for second texture loading
                    container.onTextureLoaded = Item2TxLoaded;

                    stage.drawFrame();

                    chai.assert(
                        !texture.isValid,
                        "Tested behaviour should start with a non loaded texture / non valid"
                    );
                });
            });
        });
    });

    describe("cancel", () => {
        describe("trigger visibility while loading", () => {
            it("should cancel", () => {
                const element = stage.createElement({
                    children: {
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
                });

                root.children = [element];
                const item = element.getByRef("Item")
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
                });

                root.children = [element];
                const item = element.getByRef("Item")
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
                        Item: { x: 550, texture: { type: TestTexture, async: true } }
                    }
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
                    /* Reason:
                       https://github.com/WebPlatformForEmbedded/Lightning/commit/c7688785a4430026f3bcc9da5ed77a80ca9f9ab0
                     */

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
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: false }
                    }
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
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true }
                    }
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
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true }
                    }
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
                        Item: { texture: { type: TestTexture, lookupId: "test1" }, visible: true }
                    }
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
                    "Active count of texture source should be 0"
                );

                chai.assert(!item.texture.source.isLoaded(), "texture no longer loaded");

                // Now create new texture source.
                const newElement = stage.createElement({
                    ref: "NewItem",
                    texture: { type: TestTexture, lookupId: "test1" },
                    visible: true
                });
                root.childList.add(newElement);
                stage.drawFrame();

                const prevSource = item.texture.source;
                const newItem = root.getByRef("NewItem");
                chai.assert(
                    newItem.texture.source !== item.texture.source,
                    "texture sources should be different"
                );

                chai.assert(
                    newItem.texture.source._activeTextureCount === 1,
                    "Active count of new texture source should be 1"
                );

                // When making the original item visible, the texture source should be replaced width the newly loaded one.
                item.visible = true;
                stage.drawFrame();
                chai.assert(
                    newItem.texture.source === item.texture.source,
                    "texture sources should be equal"
                );

                chai.assert(
                    newItem.texture.source._activeTextureCount === 2,
                    "Active count of new texture source should be 2"
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
                        texture: { type: TestTexture, lookupId: "test1", async: true, error: new Error("Texture Error") },
                        visible: true
                    }
                }
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
