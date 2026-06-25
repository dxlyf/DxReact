export type PointLike={
    x:number,
    y:number,
}
export class Point implements PointLike {
    static create(x: number=0, y: number=0) {
        return new Point(x, y)
    }
    static from(p: PointLike) {
        return new Point(p.x, p.y)
    }
    _x: number;
    _y: number;
    changeCallback:(v:Point)=>void
    constructor(x: number=0, y: number=0) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x
    }
    get y() {
        return this._y
    }
    set x(x: number) {
        this._x = x
    }
    set y(y: number) {
        this._y = y
    }
    onChange(cb:(v:Point)=>void) {
        this.changeCallback = cb
    }
    set(x:number,y:number) {
        if(this._x!==x||this._y!==y) {
            this._x = x
            this._y = y
            this.changeCallback?.(this)
        }
        return this
    }
    copy(source: PointLike) {
        return this.set(source.x,source.y)
    }
    add(other: PointLike) {
        return this.set(this._x+other.x,this._y+other.y)
    }
    subtract(other: PointLike) {
        return this.set(this._x-other.x,this._y-other.y)
    }
    multiply(other: PointLike) {
        return this.set(this._x*other.x,this._y*other.y)
    }
    multiplyScalar(scalar: number) {
        return this.set(this._x*scalar,this._y*scalar)
    }
    divide(scalar: number) {
        return this.set(this._x/scalar,this._y/scalar)
    }
    dot(other: PointLike) {
        return this._x*other.x+this._y*other.y
    }
    cross(other: PointLike) {
        return this._x*other.y-this._y*other.x
    }
    length() {
        return Math.sqrt(this._x*this._x+this._y*this._y)
    }
    normalize() {
        const len = this.length()
        if(len===0) {
            return this
        }
        return this.divide(len)
    }
    equals(other: PointLike) {
        return this._x===other.x&&this._y===other.y
    }
    equalsEpsilon(other: PointLike,epsilon: number=1e-6) {
        return Math.abs(this._x-other.x)<=epsilon&&Math.abs(this._y-other.y)<=epsilon
    }

}
