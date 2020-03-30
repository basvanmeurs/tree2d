describe("test stack", function () {
    this.enableTimeouts(false);

    let stage, root, element;
    let A, B, C, D, E;
    before(() => {
        const canvas = document.createElement("canvas");
        // canvas.style.width = '923px';
        // canvas.style.height = '923px';
        canvas.width = 1200;
        canvas.height = 1200;
        document.body.appendChild(canvas);
        stage = new tree2d.Stage(canvas, { clearColor: 0xff000000, pixelRatio: 1, autostart: false });
        root = stage.root;
        root.ref = "R";
    });

    before(() => {
        element = stage.createElement({
            x: 200,
            y: 200,
            w: 800,
            h: 800,
            rect: true,
            color: 0xffff0000,
            clipping: true,
            ref: "A",
            children: {
                I: {
                    rect: true,
                    w: 900,
                    h: 900,
                    alpha: 0,
                    x: 0,
                    y: 0,
                },
                B: {
                    rect: true,
                    renderToTexture: true,
                    color: 0xff00ff00,
                    w: 300,
                    alpha: 0.8,
                    h: 200,
                    x: 500,
                    y: 200,
                    zIndex: 2,
                    rotation: 0.1 * Math.PI,
                    children: {
                        C: {
                            rect: true,
                            color: 0xff0000ff,
                            alpha: 0.8,
                            x: -100,
                            w: 200,
                            y: -50,
                            h: 200,
                            children: {
                                D: {
                                    rect: true,
                                    color: 0xffff00ff,
                                    alpha: 0.8,
                                    x: (w) => w - 50,
                                    w: 100,
                                    h: 80,
                                    y: 20,
                                },
                            },
                        },
                    },
                },
                E: {
                    rect: true,
                    color: 0xff00ffff,
                    alpha: 0.8,
                    x: 400,
                    y: -100,
                    w: 150,
                    h: 400,
                    pivotX: 0,
                    scaleX: 2,
                },
            },
        });
        root.children = [element];

        A = element;
        B = A.getByRef("B");
        C = B.getByRef("C");
        D = C.getByRef("D");
        E = A.getByRef("E");

        stage.drawFrame();
    });

    function getResults(x, y) {
        const elements = stage.getElementsAtStageCoordinates(x, y);
        return elements.map((result) => [result.element.ref, result.offsetX, result.offsetY]);
    }

    describe("coordinate tests", () => {
        function test(x, y, r) {
            describe(`(${x},${y})`, () => {
                it("[" + r.join(",") + "]", () => {
                    const results = getResults(x, y);
                    chai.assert.deepEqual(
                        results.map((result) => result[0]),
                        r.map((i) => i[0]),
                    );
                    root.childList.add(stage.createElement({ rect: true, w: 10, h: 10, mount: 0.5, x, y }));
                    results.forEach((result, index) => {
                        const expected = r[index];
                        chai.assert.equal(Math.round(result[1]) + "," + Math.round(result[2]), expected[1] + "," + expected[2], "Item: " + result[0]);
                    });
                });
            });
        }

        test(300, 80, []);
        test(840, 145, []);
        test(840, 250, [
            ["E", 120, 150],
            ["A", 640, 50],
        ]);
        test(510, 270, [["A", 310, 70]]);
        test(818, 370, [
            ["E", 109, 270],
            ["A", 618, 170],
        ]);
        test(750, 400, [
            ["C", 0, 0],
            ["B", 0, 0],
            ["E", 0, 0],
            ["A", 0, 0]
        ]);
        test(800, 400, ["D", "C", "B", "E", "A"]);
        test(850, 410, ["D", "B", "E", "A"]);
        test(906, 423, ["B", "A"]);
        test(916, 405, ["A"]);
        test(1015, 460, []);
    });
});
