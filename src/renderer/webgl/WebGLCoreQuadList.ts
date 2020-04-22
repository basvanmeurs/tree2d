import { CoreQuadList } from "../../tree/core/CoreQuadList";

export class WebGLCoreQuadList extends CoreQuadList {
    // Allocate a fairly big chunk of memory that should be enough to support ~100000 (default) quads.
    public data: ArrayBuffer;
    public floats: Float32Array;
    public uints: Uint32Array;
    private dataLength: number = 0;

    constructor(bufferMemory: number) {
        super();
        this.data = new ArrayBuffer(bufferMemory);
        this.floats = new Float32Array(this.data);
        this.uints = new Uint32Array(this.data);
    }

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
