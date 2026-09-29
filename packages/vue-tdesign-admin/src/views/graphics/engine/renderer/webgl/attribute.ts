import { Context } from "./context"

type ArrayType = 'BYTE'
    | 'UNSIGNED_BYTE'
    | 'SHORT'
    | 'UNSIGNED_SHORT'
    | 'FLOAT'
const ArrayTypeMapByteSize = {
    BYTE: 1,
    UNSIGNED_BYTE: 1,
    SHORT: 2,
    UNSIGNED_SHORT: 2,
    FLOAT: 4,
}
type AttributeDesc = {
    name: string
    type: number
    size: 1 | 2 | 3 | 4
    normalized?: boolean
    stride?: number
    offset?: number
    location?: number
}
type AttributeBufferOptions = {
    stride: number
    type: number
    attributes: AttributeDesc[]
}
class Float32AttributeBuffer {
    static uid = 0
    ctx: Context;
    type: number
    stride: number
    buffer: Buffer
    attributes: AttributeDesc[] = []
    constructor(ctx: Context, options: AttributeBufferOptions) {
        this.ctx = ctx;
        this.type = options.type;
        this.stride = options.stride;
        this.buffer = new VertexBuffer(ctx);
        this.attributes = options.attributes.map((attr, i) => {
            return {
                offset: 0,
                stride: this.stride,
                type: this.type,
                location: i,
                normalized: false,
                ...attr,
            }
        });
    }
    bind() {
        this.buffer.bind();
        const attribues = this.attributes, gl = this.ctx.gl;
        for (let i = 0; i < attribues.length; i++) {
            const attr = attribues[i];
            this.ctx.enableVertexAttribArray(attr.location);
            gl.vertexAttribPointer(attr.location, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
        }
    }
}