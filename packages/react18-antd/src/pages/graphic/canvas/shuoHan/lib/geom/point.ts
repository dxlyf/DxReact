export interface PointLike{
    x:number;
    y:number
}
export class Point{
    static default(){
        return this.fromXY(0,0)
    }
    static fromXY(x:number,y:number):Point{
        return new this(x,y);
    }
    static fromPoint(point:PointLike){
        return new this(point.x,point.y);
    }
    x:number;
    y:number;
    _mutable:boolean = false;
    constructor(x:number,y:number){
        this.x = x;
        this.y = y;
    }
    mutable(value:boolean=true){
        this._mutable = value;
        return this
    }
    copy(source:PointLike){
        return this.set(source.x,source.y);
    }
    clone(){
        return (this.constructor as typeof Point).fromXY(this.x,this.y)
    }
    set(x:number,y:number){
        if(this._mutable){
            this.x = x;
            this.y = y;
            return this
        }else{
            return (this.constructor as typeof Point).fromXY(x,y)
        }
    }
    add(point:PointLike){
        return this.set(this.x+point.x,this.y+point.y);
    }
    sub(point:PointLike){
        return this.set(this.x-point.x,this.y-point.y);
    }
    mul(point:PointLike){
        return this.set(this.x*point.x,this.y*point.y);
    }
    mulScalar(scalar:number){
        return this.set(this.x*scalar,this.y*scalar);
    }
    div(point:PointLike){
        return this.set(this.x/point.x,this.y/point.y);
    }
    equals(point:PointLike):boolean{
        return this.x === point.x && this.y === point.y;
    }
    equalsEpsilon(point:PointLike,epsilon=1e-6):boolean{
        return Math.abs(this.x-point.x)<epsilon && Math.abs(this.y-point.y)<epsilon;
    }
}