describe("Shaders", function() {
    this.timeout(0);

    let stageGL;
    let stage2D;

    before(() => {
        const template = {
            children: {
                Image: { src: "./shaders/Lightning.png", shader: { type: lng.shaders.GrayscaleShader, amount: 1 } }
            }
        };

        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 100;
        stageGL = new lng.Stage(canvas, { });

        const canvas2 = document.createElement('canvas');
        canvas2.width = 500;
        canvas2.height = 100;
        stage2D = new lng.Stage(canvas2,{ canvas2d: true });

        lng.Patcher.patchObject(stageGL.root, template);
        lng.Patcher.patchObject(stage2D.root, template);

        document.body.appendChild(stageGL.getCanvas());
        document.body.appendChild(stage2D.getCanvas());
    });

    describe("Image texture (WebGL)", function() {
        it("Should be gray", function() {
            const shader = stageGL.root.getByRef("Image").shader;
            chai.assert(shader instanceof lng.shaders.GrayscaleShader);
        });
    });

    describe("Image texture (C2D)", function() {
        it("Should be gray", function() {
            const shader = stage2D.root.getByRef("Image").shader;
            chai.assert(shader instanceof lng.shaders.c2d.C2dGrayscaleShader);
        });
    });
});
