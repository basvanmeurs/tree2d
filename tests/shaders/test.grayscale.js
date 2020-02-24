describe("Shaders", function() {
    this.timeout(0);

    let stageGL;
    let stage2D;

    before(() => {
        const template = {
            Image: { src: "./shaders/Lightning.png", shader: { type: lng.shaders.Grayscale, amount: 1 } }
        };

        stageGL = new lng.Stage({ h: 100 });
        stage2D = new lng.Stage({ h: 100, canvas2d: true });

        stageGL.root.patch(template);
        stage2D.root.patch(template);

        document.body.appendChild(stageGL.getCanvas());
        document.body.appendChild(stage2D.getCanvas());
    });

    describe("Image texture (WebGL)", function() {
        it("Should be gray", function() {
            const shader = stageGL.root.tag("Image").shader;
            chai.assert(shader instanceof lng.shaders.Grayscale);
        });
    });

    describe("Image texture (C2D)", function() {
        it("Should be gray", function() {
            const shader = stage2D.root.tag("Image").shader;
            chai.assert(shader instanceof lng.shaders.c2d.Grayscale);
        });
    });
});
