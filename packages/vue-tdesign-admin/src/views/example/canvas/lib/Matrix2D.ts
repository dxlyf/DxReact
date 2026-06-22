
export class Matrix2D extends Float32Array{
    static identity(){
        return new Matrix2D()
    }
    constructor() {
        super([1, 0, 0, 1, 0, 0])
    }
    fromValues(a: number, b: number, c: number, d: number, tx: number, ty: number){
        this[0] = a
        this[1] = b
        this[2] = c
        this[3] = d
        this[4] = tx
        this[5] = ty
        return this
    }
    identity(){
        this.fromValues(1, 0, 0, 1, 0, 0)
        return this
    }
    multiplyMatrices(a: Matrix2D, b: Matrix2D){
        return this.fromValues(
            a[0] * b[0] + a[2] * b[1],
            a[1] * b[0] + a[3] * b[1],
            a[0] * b[2] + a[2] * b[3],
            a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5],
            a[1] * b[4] + a[3] * b[5],
        )
    }
    multiply(matrix: Matrix2D){
        return this.multiplyMatrices(this, matrix)
    }
    premultiply(matrix: Matrix2D){
        return this.multiplyMatrices(matrix, this)
    }
    translate(tx: number, ty: number){
        return this.fromValues(
            this[0],
            this[1],
            this[2],
            this[3],
            this[0]*tx + this[2]*ty+this[4],
            this[1]*tx + this[3]*ty+this[5],
        )
    }
    scale(sx: number, sy: number){
        return this.fromValues(
            sx * this[0],
            sx * this[1],
            sy * this[2],
            sy * this[3],
            this[4],
            this[5],
        )
    }
    rotate(angle: number){
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return this.fromValues(
            this[0]*cos+this[2]*sin,
            this[1]*cos+this[3]*sin,
            this[0]*-sin+this[2]*cos,
            this[1]*-sin+this[3]*cos,
            this[4],
            this[5],
        )
    }
}