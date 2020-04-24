describe("test coords", function () {
    this.enableTimeouts(false);

    let stage, root, element;
    let A, B, C, D, E;
    before(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        document.body.appendChild(canvas);
        stage = new tree2d.Stage(canvas, { clearColor: 0xff000000, pixelRatio: 1, autostart: true });
        root = stage.root;
        root.ref = "R";
    });

    before(() => {
        element = stage.createElement({
            x: 200,
            y: 200,
            w: 800,
            h: 800,
            texture: stage.rectangleTexture,
            color: 0xffff0000,
            clipping: true,
            ref: "A",
            children: {
                I: {
                    texture: stage.rectangleTexture,
                    w: 900,
                    h: 900,
                    alpha: 0,
                    x: 0,
                    y: 0,
                },
                B: {
                    texture: stage.rectangleTexture,
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
                            texture: stage.rectangleTexture,
                            color: 0xff0000ff,
                            alpha: 0.8,
                            x: -100,
                            w: 200,
                            y: -50,
                            h: 200,
                            children: {
                                D: {
                                    texture: stage.rectangleTexture,
                                    color: 0xffff00ff,
                                    alpha: 0.8,
                                    funcX: (w) => w - 50,
                                    w: 100,
                                    h: 80,
                                    y: 20,
                                },
                            },
                        },
                    },
                },
                E: {
                    texture: stage.rectangleTexture,
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
        const elements = stage.getElementsAtCoordinates(x, y);
        return elements.map((result) => [result.element.ref, result.offsetX, result.offsetY, result.element]);
    }

    describe("coordinate tests", () => {
        function test(x, y, r) {
            describe(`(${x},${y})`, () => {
                it("[" + r.join(",") + "]", () => {
                    const results = getResults(x, y);
                    results.forEach((result, index) => {
                        const expected = r[index];
                        const str1 = Math.round(result[1]) + "," + Math.round(result[2]);
                        const str2 = expected[1] + "," + expected[2];

                        if (str1 !== str2) {
                            result[3].childList.add(
                                stage.createElement({
                                    texture: stage.rectangleTexture,
                                    w: 8,
                                    h: 8,
                                    mount: 0.5,
                                    color: 0xffff0044,
                                    x: result[1],
                                    y: result[2],
                                    zIndex: 100,
                                }),
                            );
                            result[3].childList.add(
                                stage.createElement({
                                    texture: stage.rectangleTexture,
                                    w: 4,
                                    h: 4,
                                    mount: 0.5,
                                    color: 0xff44ff44,
                                    x: expected[1],
                                    y: expected[2],
                                    zIndex: 100,
                                }),
                            );
                            root.childList.add(
                                stage.createElement({
                                    texture: stage.rectangleTexture,
                                    w: 2,
                                    h: 2,
                                    mount: 0.5,
                                    x,
                                    y,
                                    zIndex: 100,
                                }),
                            );
                            stage.drawFrame();
                            chai.assert.equal(str1, str2, "Item: " + result[0]);
                        }
                    });
                    chai.assert.deepEqual(
                        results.map((result) => result[0]),
                        r.map((i) => i[0]),
                    );

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
        test(751, 395, [
            ["C", 123, 81],
            ["B", 23, 31],
            ["E", 76, 295],
            ["A", 551, 195],
        ]);
        test(800, 400, [
            ["D", 22, 50],
            ["C", 172, 70],
            ["B", 72, 20],
            ["E", 100, 300],
            ["A", 600, 200],
        ]);
        test(850, 410, [
            ["D", 72, 44],
            ["B", 122, 14],
            ["E", 125, 310],
            ["A", 650, 210],
        ]);
        test(906, 423, [
            ["B", 179, 9],
            ["A", 706, 223],
        ]);
        test(916, 405, [["A", 716, 205]]);
        test(1015, 460, []);
    });
});
