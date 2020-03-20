const EXAMPLE_SHORT_TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nibh augue, suscipit a, scelerisque sed, lacinia in, mi.';

const EXAMPLE_TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin nibh augue, \
suscipit a, scelerisque sed, lacinia in, mi. Cras vel lorem. Etiam pellentesque \
aliquet tellus. Phasellus pharetra nulla ac diam. Quisque semper justo at risus. \
Donec venenatis, turpis vel hendrerit interdum, dui ligula ultricies purus, sed \
posueru libero dui id orci. Nam congue, pede vitae dapibus aliquet, elit magna \
vulputate arcu, vel tempus metus leo non est. Etiam sit amet lectus quis est congue \
mollis. Phasellus congue lacus eget neque. Phasellus ornare, ante vitae consectetuer \
consequat, purus sapien ultricies dolor, et mollis pede metus eget nisi. Praesent \
sodales velit quis augue. Cras suscipit, urna at aliquam rhoncus, urna quam viverra \
nisi, in interdum massa nibh nec erat.';

describe('text', function() {
    this.timeout(0);

    let root;
    let stage;

    class TestTexture extends tree2d.textures.TextTexture {}

    before(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        stage = new tree2d.Stage(canvas, { clearColor: 0xffff0000, autostart: true });
        root = stage.root;
        document.body.appendChild(stage.getCanvas());
    });

    describe('entry check', function() {
        it('should render', function() {
            const element = stage.createElement({
                children: {
                    Item: { texture: { type: TestTexture, text: 'hello', async: false }, visible: true },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;

            stage.drawFrame();
            chai.assert(texture.text == 'hello', 'Texture must render');
            chai.assert(texture.getSource().w > 0);
            chai.assert(texture.getSource().h > 0);
            chai.assert(texture.getSource().renderInfo.lines.length == 1);
        });
    });

    describe('newline', function() {
        it('should wrap newline character', function() {
            const element = stage.createElement({
                children: {
                    Item: { texture: { type: TestTexture, text: 'hello \n world', async: false }, visible: true },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;
            stage.drawFrame();
            chai.assert(texture.getSource().renderInfo.lines.length === 2);
        });
    });

    describe('wordWrap - break word', function() {
        it('should wrap paragraph [unlimited]', function() {
            const element = stage.createElement({
                children: {
                    Item: {
                        texture: {
                            type: TestTexture,
                            wordWrapWidth: 950,
                            text: EXAMPLE_TEXT,
                            async: false,
                        },
                        visible: true,
                    },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;
            stage.drawFrame();
            chai.assert(texture.getSource().renderInfo.lines.length > 1);
            chai.assert(
                texture
                    .getSource()
                    .renderInfo.lines.slice(-1)[0]
                    .substr(-5) == 'erat.',
            );
        });

        it('wrap paragraph [maxLines=10]', function() {
            const element = stage.createElement({
                children: {
                    Item: {
                        texture: {
                            type: TestTexture,
                            wordWrapWidth: 950,
                            text: EXAMPLE_TEXT,
                            maxLines: 10,
                            async: false,
                        },
                        visible: true,
                    },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;
            stage.drawFrame();
            chai.assert(texture.getSource().renderInfo.lines.length === 10);
        });
    });

    describe('wordWrap', function() {
        it('should not wrap', function() {
            const element = stage.createElement({
                children: {
                    Item: {
                        texture: {
                            type: TestTexture,
                            wordWrapWidth: 0,
                            text: EXAMPLE_SHORT_TEXT,
                            async: false,
                        },
                        visible: true,
                    },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;
            stage.drawFrame();
            chai.assert(texture.getSource().renderInfo.lines.length === 1);
            chai.assert(texture.getSource().renderInfo.lines[0].substr(-5) == ', mi.');
        });

        it('should wrap', function() {
            const element = stage.createElement({
                children: {
                    Item: {
                        texture: {
                            type: TestTexture,
                            wordWrapWidth: 900,
                            text: EXAMPLE_TEXT,
                            maxLines: 5,
                            async: false,
                        },
                        visible: true,
                    },
                },
            });
            root.children = [element];
            const texture = element.getByRef('Item').texture;
            stage.drawFrame();
            chai.assert(texture.getSource().renderInfo.lines.length === 5);
        });
    });
});
