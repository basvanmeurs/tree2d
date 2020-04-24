describe("Shaders", function () {
    this.timeout(0);

    let stageGL;
    let stage2D;

    before(() => {
        const template = {
            children: {
                Image: {
                    texture: { type: tree2d.ImageTexture, src: "./example.png" },
                    shader: { type: tree2d.WebGLGrayscaleShader, amount: 1 },
                },
            },
        };

        const canvas = document.createElement("canvas");
        canvas.width = 500;
        canvas.height = 100;
        stageGL = new tree2d.Stage(canvas, {});

        const canvas2 = document.createElement("canvas");
        canvas2.width = 500;
        canvas2.height = 100;
        stage2D = new tree2d.Stage(canvas2, { canvas2d: true });

        tree2d.Patcher.patchObject(stageGL.root, template);
        tree2d.Patcher.patchObject(stage2D.root, template);

        document.body.appendChild(stageGL.getCanvas());
        document.body.appendChild(stage2D.getCanvas());
    });

    describe("Image texture (WebGL)", function () {
        it("Should be gray", function () {
            const shader = stageGL.root.getByRef("Image").shader;
            chai.assert(shader instanceof tree2d.WebGLGrayscaleShader);
        });
    });

    describe("Image texture (C2D)", function () {
        it("Should be gray", function () {
            const shader = stage2D.root.getByRef("Image").shader;
            chai.assert(shader instanceof tree2d.C2dGrayscaleShader);
        });
    });
});
