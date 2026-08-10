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
    copy(target: Matrix2DLike) {
        return this.set(target.a, target.b, target.c, target.d, target.tx, target.ty)
    }
    clone() {
        return (this.constructor as typeof Matrix2D).create(this.a, this.b, this.c, this.d, this.tx, this.ty)
    }

}