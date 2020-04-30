// These tests must be performed separately from HTML because we want it to behave differently (more consistently) than HTML.
describe("ids", () => {
    let stage, root, element, item, item2;
    before(() => {
        const canvas = document.createElement("canvas");
        canvas.style.width = "900px";
        canvas.style.height = "900px";
        stage = new tree2d.Stage(canvas, { clearColor: 0xffff0000, autostart: false, pixelRatio: 1 });
        root = stage.root;
    });

    before(() => {
        element = stage.createElement({
            children: {
                Item: {
                    id: "item",
                },
                Item2: {
                }
            },
        });
        root.children = [element];

        item = element.children[0];
        item2 = element.children[1];

        stage.drawFrame();
    });

    describe("set id, then attach", () => {
        it("should retrieve by id", () => {
            chai.assert(stage.getById("item") === item, "item is found by id");
        });
    });

    describe("change id while attached", () => {
        before(() => {
            item.id = "new-id";
        });

        it("should no longer retrieve item on old id", () => {
            chai.assert(stage.getById("item") === undefined, "item is not found by old id");
        });

        it("should retrieve id that was set before adding", () => {
            chai.assert(stage.getById("new-id") === item, "item is found by new id");
        });
    });

    describe("detach", () => {
        before(() => {
            element.childList.remove(item);
        });

        it("should no longer retrieve item", () => {
            chai.assert(stage.getById("new-id") === undefined, "detached item is not found");
        });
    });

    describe("re-attach", () => {
        before(() => {
            element.childList.add(item);
        });

        it("should retrieve item again", () => {
            chai.assert(stage.getById("new-id") === item, "detached item is not found");
        });
    });

    describe("change id while not attached", () => {
        before(() => {
            element.childList.remove(item);
            item.id = "item";
        });

        it("should not retrieve item on new id", () => {
            chai.assert(stage.getById("item") === undefined, "detached item is not found");
        });
    });

    describe("re-attach", () => {
        before(() => {
            element.childList.add(item);
        });

        it("should not retrieve item on previous id", () => {
            chai.assert(stage.getById("new-id") === undefined, "detached item is not found");
        });

        it("should retrieve id that was changed while detached", () => {
            chai.assert(stage.getById("item") === item, "item is found by id");
        });
    });

    describe("double id", () => {
        before(() => {
            item2.id = "item";
        });

        it("should retrieve original item", () => {
            chai.assert(stage.getById("item") === item, "item is found by id");
        });

        describe("remove item", () => {
            before(() => {
                element.childList.remove(item);
            });

            it("should retrieve remaining element", () => {
                chai.assert(stage.getById("item") === item2, "original item is found by id");
            });
        });
    });

});
