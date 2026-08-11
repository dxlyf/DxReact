import { Pool } from "./pool"

export type Matrix2DLike={
    a:number,
    b:number,
    c:number,
    d:number,
    tx:number,
    ty:number,
}
export class Matrix2D implements Matrix2DLike {
    static create(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        return new Matrix2D().set(a, b, c, d, tx, ty)
    }
    static default() {
        return new Matrix2D().identity()
    }
    static pool=Pool.create({
        create:()=>new Matrix2D(),
        release:(obj)=>{
            obj.identity()
        }
    })
    a:number = 1
    b:number = 0
    c:number = 0
    d:number = 1
    tx:number = 0
    ty:number = 0
    set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
        this.a = a
        this.b = b
        this.c = c
        this.d = d
        this.tx = tx
        this.ty = ty
        return this
    }
    fromTranslate(tx: number, ty: number) {
        return this.set(1, 0, 0, 1, tx, ty)
    }
    fromScale(sx: number, sy: number) {
        return this.set(sx, 0, 0, sy, 0, 0)
    }
    fromRotate(angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return this.set(cos, sin, -sin, cos, 0, 0)
    }
    fromSkew(sx: number, sy: number) {
        return this.set(1, sx, sy, 1, 0, 0)
    }
    translate(tx: number, ty: number) {
        this.tx = this.a*tx+this.c*ty+this.tx
        this.ty = this.b*tx+this.d*ty+this.ty
        return this
    }
    scale(sx: number, sy: number) {
        this.a *= sx
        this.b *= sy
        this.c *= sy
        this.d *= sx
        return this
    }
    rotate(angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
         
        return this.set(
            this.a*cos+this.c*sin,
            this.b*cos+this.d*sin,
            this.a*-sin+this.c*cos,
            this.d*-sin+this.b*cos,
            this.tx,
            this.ty
        )
    }
    skew(sx: number, sy: number) {
        return this.set(
            this.a+this.b*sx,
            this.b+this.d*sx,
            this.a*sy+this.c,
            this.b+sy+this.d,
            this.tx,
            this.ty
        )
    }
    identity() {
        return this.set(1, 0, 0, 1, 0, 0)
    }
    multiplyMatrices(a: Matrix2DLike, b: Matrix2DLike) {
        return this.set(
            a.a*b.a+a.c*b.b,
            a.b*b.a+a.d*b.b,
            a.a*b.c+a.c*b.d,
            a.b*b.c+a.d*b.d,
            a.a*b.tx+a.c*b.ty+a.tx,
            a.b*b.tx+a.d*b.ty+a.ty
        )
    }
    multiply(b: Matrix2DLike) {
        return this.multiplyMatrices(this, b)
    }
    preMultiply(b: Matrix2DLike) {
        return this.multiplyMatrices(b, this)
    }
    invert(){
        const det = this.a*this.d - this.b*this.c
        if(det === 0){
            throw new Error('Matrix is singular, cannot be inverted')
        }
        const invDet = 1/det
        return this.set(
            this.d*invDet,
            -this.b*invDet,
            -this.c*invDet,
            this.a*invDet,
            (this.c*this.ty-this.d*this.tx)*invDet,
            (this.b*this.tx-this.a*this.ty)*invDet
        )
    }
    /**
     * 线性部分的行列式：det = a·d − b·c。
     * det ≠ 0 时矩阵可逆；det = 0 表示线性部分退化（如缩放到 0）。
     */
    determinant() {
        return this.a*this.d - this.b*this.c
    }
    /**
     * 分解为平移 + 旋转 + 缩放（TRS），假定无剪切（skew = 0）。
     * 线性部分 L = [[a, c],[b, d]]（列优先）可写为 R(θ)·S：
     *   a = cosθ·sx, b = sinθ·sx, c = −sinθ·sy, d = cosθ·sy
     * 故 sx = √(a²+b²), sy = √(c²+d²), θ = atan2(b, a)。
     * @returns { tx, ty, rotation, scaleX, scaleY }
     *   tx/ty 平移量；rotation 旋转角（弧度，逆时针）；scaleX/scaleY 缩放（恒为非负）
     */
    decompose() {
        const scaleX = Math.sqrt(this.a*this.a + this.b*this.b)
        const scaleY = Math.sqrt(this.c*this.c + this.d*this.d)
        const rotation = Math.atan2(this.b, this.a)
        return {
            tx: this.tx,
            ty: this.ty,
            rotation,
            scaleX,
            scaleY,
        }
    }
    isIdentity(){
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.tx === 0 && this.ty === 0
    }
    copy(target: Matrix2DLike) {
        return this.set(target.a, target.b, target.c, target.d, target.tx, target.ty)
    }
    clone() {
        return (this.constructor as typeof Matrix2D).create(this.a, this.b, this.c, this.d, this.tx, this.ty)
    }

}