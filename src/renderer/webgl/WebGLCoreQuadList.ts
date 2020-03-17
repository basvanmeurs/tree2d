import CoreQuadList from "../../tree/core/CoreQuadList";

export default class WebGLCoreQuadList extends CoreQuadList {
    // Allocate a fairly big chunk of memory that should be enough to support ~100000 (default) quads.
    public data: ArrayBuffer = new ArrayBuffer(this.context.stage.bufferMemory);
    public floats: Float32Array = new Float32Array(this.data);
    public uints: Uint32Array = new Uint32Array(this.data);
    private dataLength: number = 0;

    getDataLength() {
        return this.dataLength;
    }

    setDataLength(dataLength: number) {
        this.dataLength = dataLength;
    }

    reset() {
        super.reset();
        this.dataLength = 0;
    }

    getAttribsDataByteOffset(index: number) {
        // Where this quad can be found in the attribs buffer.
        return index * 80;
    }

    getQuadContents(): string[] {
        // Debug: log contents of quad buffer.
        const floats = this.floats;
        const uints = this.uints;
        const lines = [];
        for (let i = 1; i <= this.length; i++) {
            let str = "entry " + i + ": ";
            for (let j = 0; j < 4; j++) {
                const b = i * 20 + j * 4;
                str +=
                    floats[b] +
                    "," +
                    floats[b + 1] +
                    ":" +
                    floats[b + 2] +
                    "," +
                    floats[b + 3] +
                    "[" +
                    uints[b + 4].toString(16) +
                    "] ";
            }
            lines.push(str);
        }

        return lines;
    }
}
