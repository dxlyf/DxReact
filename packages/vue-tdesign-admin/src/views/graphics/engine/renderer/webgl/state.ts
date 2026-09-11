
type ColorValue =[r:number,g:number,b:number,a:number]
type  Context={
    gl: WebGL2RenderingContext;
    bindFramebuffer: BindFrameBuffer;
}
export function fastDeepEqual(a: any, b: any) {
    if (a === b) return true;

    if (a && b && typeof a == 'object' && typeof b == 'object') {
        if (a.constructor !== b.constructor) return false;

        var length, i, keys;
        if (Array.isArray(a)) {
            length = a.length;
            if (length != b.length) return false;
            for (i = length; i-- !== 0;)
                if (!fastDeepEqual(a[i], b[i])) return false;
            return true;
        }



        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;

        for (i = length; i-- !== 0;)
            if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

        for (i = length; i-- !== 0;) {
            let key = keys[i];

            if (!fastDeepEqual(a[key], b[key])) return false;
        }

        return true;
    }

    // true if both NaN, false otherwise
    return a !== a && b !== b;
}
export function colorEqual(a: ColorValue, b: ColorValue) {
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]) {
        return false
    }
    return true
}
export function arrayEqual(a: any, b: any) {
    if (a.length !== b.length) {
        return false
    }
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) {
            return false
        }
    return true
}

export function strictEqual(a: any, b: any) {
    return a === b
}
export function objectShallowEqual(a: any, b: any) {
    if (a === b) {
        return true;
    }
    if (!(a instanceof Object) || !(b instanceof Object)) return false;
    let keys = Object.keys(a);
    let length = keys.length;

    for (let i = 0; i < length; i++)
        if (!(keys[i] in b)) {
            return false;
        }

    for (let i = 0; i < length; i++)
        if (a[keys[i]] !== b[keys[i]]) {
            return false;
        }

    return length === Object.keys(b).length;
}
export abstract class Value<Context, T> {
    ctx: Context
    current: T;
    default: T;
    dirty: boolean;
    constructor(ctx: Context) {
        this.ctx = ctx
        this.default = this.getDefault()
        this.current = this.default
        this.dirty = false
    }
    abstract getDefault(): T
    abstract update(value: T): void
    setDirty() {
        this.dirty = true
    }
    equals(current: T, prev: T): boolean {
        return current === prev
    }
    set(value: T) {
        if (!this.equals(this.current, this.default)) {
            this.update(value)
            this.current = value
            this.dirty = false
        }
    }

    setDefault() {
        this.set(this.default)
    }
}

export abstract class GLValue<T> extends Value<Context,T> {
    gl: WebGL2RenderingContext
    constructor(ctx: Context) {
        super(ctx)
        this.gl = ctx.gl
    }
}

export class ClearColor extends GLValue<ColorValue> {
    override getDefault(): ColorValue {
        return [0, 0, 0, 0]
    }
    override equals(current: ColorValue, prev: ColorValue): boolean {
        return colorEqual(current, prev)
    }
    override update(value: ColorValue): void {
        this.gl.clearColor(value[0], value[1], value[2], value[3])
    }
}
export class ClearDepth extends GLValue<number> {
    override getDefault(): number {
        return 1
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.clearDepth(value)
    }
}
export class ClearStencil extends GLValue<number> {
    override getDefault(): number {
        return 0
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.clearStencil(value)
    }
}
type ColorMaskType=[r:boolean,g:boolean,b:boolean,a:boolean]
export class ColorMask extends GLValue<ColorMaskType> {
    override getDefault(): ColorMaskType {
        return [true, true, true, true]
    }
    override equals(current: ColorMaskType, prev: ColorMaskType): boolean {
        return arrayEqual(current, prev)
    }
    override update(value: ColorMaskType): void {
        this.gl.colorMask(value[0], value[1], value[2], value[3])
    }
}
export class DepthMask extends GLValue<boolean> {
    override getDefault(): boolean {
        return true
    }
    override equals(current: boolean, prev: boolean): boolean {
        return current === prev
    }
    override update(value: boolean): void {
        this.gl.depthMask(value)
    }
}
export class StencilMask extends GLValue<number> {
    override getDefault(): number {
        return 0xFF
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.stencilMask(value)
    }
}
type StencilFuncType={ func: number; ref: number; mask: number; }
export class StencilFunc extends GLValue<StencilFuncType> {
    override getDefault() {
        return {
            func: this.gl.ALWAYS,
            ref: 0,
            mask: 0xFF,
        }
    }
    override equals(current: StencilFuncType, prev: StencilFuncType): boolean {
        return !(current.func !== prev.func || current.ref !== prev.ref || current.mask !== prev.mask)
    }
    override update(value: StencilFuncType): void {
        this.gl.stencilFunc(value.func, value.ref, value.mask)
    }
}
type StencilOpType=[fail:number,zfail:number,pass:number]
export class StencilOp extends GLValue<StencilOpType> {
    override getDefault() {
        const ctx = this.gl
        return [ctx.KEEP, ctx.KEEP, ctx.KEEP] as StencilOpType
    }
    override equals(current: StencilOpType, prev: StencilOpType): boolean {
        return arrayEqual(current, prev)
    }
    override update(value: StencilOpType): void {
        this.gl.stencilOp(value[0], value[1], value[2])
    }
}
export class StencilTest extends GLValue<boolean> {
    override getDefault(): boolean {
        return false
    }
    override equals(current: boolean, prev: boolean): boolean {
        return current === prev
    }
    override update(value: boolean): void {
        if(value){
            this.gl.enable(this.gl.STENCIL_TEST)
        }else{
            this.gl.disable(this.gl.STENCIL_TEST)
        }
    }
}
type DepthRangeType=[zNear:number,zFar:number]
export class DepthRange extends GLValue<DepthRangeType> {
    override getDefault() {
        return [0, 1] as DepthRangeType
    }
    override equals(current: DepthRangeType, prev: DepthRangeType): boolean {
        return current[0] === prev[0] && current[1] === prev[1]
    }
    override update(value: DepthRangeType): void {
        this.gl.depthRange(value[0], value[1])
    }
}

export class DepthTest extends GLValue<boolean> {
    override getDefault(): boolean {
        return false;
    }
    override update(value: boolean): void {
        if(value){
            this.gl.enable(this.gl.DEPTH_TEST)
        }else{
            this.gl.disable(this.gl.DEPTH_TEST)
        }
    }
}
export class DepthFunc extends GLValue<number> {
    override getDefault(): number {
        return this.gl.LESS
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.depthFunc(value)
    }
}
export class Blend extends GLValue<boolean> {
    override getDefault(): boolean {
        return false
    }
    override update(value: boolean): void {
        if(value){
            this.gl.enable(this.gl.BLEND)
        }else{
            this.gl.disable(this.gl.BLEND)
        }
    }
}
type BlendFuncType=[src:number,dst:number,srcAlpha:number,dstAlpha:number]
export class BlendFunc extends GLValue<BlendFuncType> {
    override getDefault(): BlendFuncType {
        const ctx = this.gl
        return [ctx.ONE, ctx.ZERO, ctx.ONE, ctx.ZERO] as BlendFuncType
    }
    override equals(current: BlendFuncType, prev: BlendFuncType): boolean {
        return arrayEqual(current, prev)
    }
    override update(value: BlendFuncType): void {
        this.gl.blendFuncSeparate(value[0], value[1], value[2], value[3])
    }
}
export class BlendColor extends GLValue<ColorValue> {
    override getDefault(): ColorValue {
        return [0, 0, 0, 0] as ColorValue
    }
    override update(value: ColorValue): void {
        this.gl.blendColor(value[0], value[1], value[2], value[3])
    }
}
export class CullFace extends GLValue<boolean> {
    override getDefault(): boolean {
        return false
    }
    override equals(current: boolean, prev: boolean): boolean {
        return current === prev
    }
    override update(value: boolean): void {
        if(value){
            this.gl.enable(this.gl.CULL_FACE)
        }else{
            this.gl.disable(this.gl.CULL_FACE)
        }
    }
}
export class CullFaceSide extends GLValue<number> {
    override getDefault(): number {
        return this.gl.BACK
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.cullFace(value)
    }
}
export class FrontFace extends GLValue<number> {
    override getDefault(): number {
        return this.gl.CW
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.frontFace(value)
    }
}

export class Program extends GLValue<WebGLProgram> {
    override getDefault(): WebGLProgram {
        return null
    }
    override equals(current: WebGLProgram, prev: WebGLProgram): boolean {
        return current === prev
    }
    override update(value: WebGLProgram): void {
        this.gl.useProgram(value)
    }
}
export class ActiveTextureUnit extends GLValue<number> {
    override getDefault(): number {
        return this.gl.TEXTURE0
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.activeTexture(value)
    }
}
export class Viewport extends GLValue<number[]> {
    override getDefault(): number[] {
        return [0, 0, 0, 0] as number[]
    }
    override equals(current: number[], prev: number[]): boolean {
        return arrayEqual(current, prev)
    }
    override update(value: number[]): void {
        this.gl.viewport(value[0], value[1], value[2], value[3])
    }
}
export class BindFrameBuffer extends GLValue<WebGLFramebuffer> {
    override getDefault(): WebGLFramebuffer {
        return null
    }
    override equals(current: WebGLFramebuffer, prev: WebGLFramebuffer): boolean {
        return current === prev
    }
    override update(value: WebGLFramebuffer): void {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, value)
    }
}
export class BindRenderbuffer extends GLValue<WebGLRenderbuffer> {
    override getDefault(): WebGLRenderbuffer {
        return null
    }
    override equals(current: WebGLRenderbuffer, prev: WebGLRenderbuffer): boolean {
        return current === prev
    }
    override update(value: WebGLRenderbuffer): void {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, value)
    }
}
export class BindTexture extends GLValue<WebGLTexture> {
    override getDefault(): WebGLTexture {
        return null
    }
    override equals(current: WebGLTexture, prev: WebGLTexture): boolean {
        return current === prev
    }
    override update(value: WebGLTexture): void {
        this.gl.bindTexture(this.gl.TEXTURE_2D, value)
    }
}
export class BindVertexBuffer extends GLValue<WebGLBuffer> {
    override getDefault(): WebGLBuffer|null {
        return null
    }
    override equals(current: WebGLBuffer, prev: WebGLBuffer): boolean {
        return current === prev
    }
    override update(value: WebGLBuffer): void {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, value)
    }
}
export class BindElementBuffer extends GLValue<WebGLBuffer> {
    override getDefault(): WebGLBuffer|null {
        return null
    }
    override equals(current: WebGLBuffer, prev: WebGLBuffer): boolean {
        return current === prev
    }
    override update(value: WebGLBuffer): void {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, value)
    }
}
export class BindVertexArray extends GLValue<WebGLVertexArrayObject> {
    override getDefault(): WebGLVertexArrayObject|null {
        return null
    }
    override equals(current: WebGLVertexArrayObject, prev: WebGLVertexArrayObject): boolean {
        return current === prev
    }
    override update(value: WebGLVertexArrayObject): void {
        this.gl.bindVertexArray(value)
    }
}
export class PixelStoreUnpackAlignment extends GLValue<number> {
    override getDefault(): number {
        return 4
    }
    override equals(current: number, prev: number): boolean {
        return current === prev
    }
    override update(value: number): void {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, value)
    }
}
export class PixelStoreUnpackPremultiplyAlpha extends GLValue<boolean> {
    override getDefault(): boolean {
        return false
    }
    override equals(current: boolean, prev: boolean): boolean {
        return current === prev
    }
    override update(value: boolean): void {
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, value)
    }
}
export class PixelStoreUnpackFlipY extends GLValue<boolean> {
    override getDefault(): boolean {
        return false
    }
    override equals(current: boolean, prev: boolean): boolean {
        return current === prev
    }
    override update(value: boolean): void {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, value)
    }
}
export abstract class FramebufferAttachment<T> extends GLValue<T> {
    parent: WebGLFramebuffer;
    constructor(context:any, parent: WebGLFramebuffer) {
        super(context);
        this.parent = parent;
    }
    override getDefault(): null {
        return null;
    }
}

export class ColorAttachment extends FramebufferAttachment<WebGLTexture> {
    attachmentPoint: number;

    constructor(context: Context, parent: WebGLFramebuffer, attachmentIndex: number = 0) {
        super(context, parent);
        this.attachmentPoint = context.gl.COLOR_ATTACHMENT0 + attachmentIndex;
    }
    override update(v?: WebGLTexture | null): void {
        this.ctx.bindFramebuffer.set(this.parent)
        // note: it's possible to attach a renderbuffer to the color
        // attachment point, but thus far MBGL only uses textures for color
        const gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachmentPoint, gl.TEXTURE_2D, v, 0);
    }
}

export class DepthRenderbufferAttachment extends FramebufferAttachment<WebGLRenderbuffer> {
    attachment(): number { return this.gl.DEPTH_ATTACHMENT; }
    override update(v: WebGLRenderbuffer | null | undefined | WebGLTexture): void {
        this.ctx.bindFramebuffer.set(this.parent);
        const gl = this.gl;
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachment(), gl.RENDERBUFFER,v as WebGLRenderbuffer);
    }
}

export class DepthTextureAttachment extends FramebufferAttachment<WebGLTexture> {
    attachment(): number { return this.gl.DEPTH_ATTACHMENT; }
    override update(v: WebGLTexture | null): void {
        this.ctx.bindFramebuffer.set(this.parent);
        const gl = this.gl;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachment(), gl.TEXTURE_2D, v, 0);
    }
}

export class DepthStencilAttachment extends DepthRenderbufferAttachment {
    override attachment(): number { return this.gl.DEPTH_STENCIL_ATTACHMENT; }
}