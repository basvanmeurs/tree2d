// These tests must be performed separately from HTML because we want it to behave differently (more consistently) than HTML.
describe('flex', () => {
  describe('get layout', () => {
    let stage, root, element;
    before(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      stage = new lng.Stage(canvas, { clearColor: 0xffff0000, autostart: false });
      root = stage.root;
      document.body.appendChild(stage.getCanvas());
    });

    describe('getting final coords', () => {
      before(() => {
        element = stage.createElement({
          children: {
            Item: {
              w: 300,
              flex: true,
              padding: 5,
              children: [
                { flexShrink: 1, minWidth: 50, w: 100, h: 100 },
                { w: 100, h: 100 },
                { w: 100, h: 100 },
                { w: 100, h: 100 },
              ],
            },
          },
        });
        root.children = [element];
      });

      it('should not update coords yet', () => {
        const child = element.getByRef('Item').children[3];
        chai.assert(child.layoutX === 0, 'final X not updated until update');
      });

      it('should update after update', () => {
        stage.update();
        const child = element.getByRef('Item').children[3];
        chai.assert(child.layoutX === 255, 'final X updated');
        chai.assert(child.layoutY === 5, 'final Y updated');
        chai.assert(child.layoutW === 100, 'final W updated');
        chai.assert(child.layoutH === 100, 'final H updated');

        const item = element.getByRef('Item');
        chai.assert(item.layoutH === 110, 'final H updated');
      });
    });
  });
});
