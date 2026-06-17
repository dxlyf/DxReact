
export class Vector2 extends Float32Array{
    static create(x: number=0, y: number=0): Vector2{
        return new Vector2(x, y)
    }
    static zero(){
        return new Vector2(0, 0)
    }
    static fromAngle(angle:number): Vector2{
        return this.fromRadian(angle * Math.PI / 180)
    }
    static fromRadian(radian: number): Vector2{
        return this.fromCosSin(Math.cos(radian), Math.sin(radian))
    }
    static fromCosSin(cos: number, sin: number): Vector2{
        return new Vector2(cos, sin)
    }
    constructor(x: number, y: number) {
        super([x, y])
    }
}