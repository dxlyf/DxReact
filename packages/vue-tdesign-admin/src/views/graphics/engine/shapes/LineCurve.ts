import {Curve} from './Curve'
import { Vector2,Vector2Like} from '@dxyl/math2'


export class LineCurve extends Curve{
    v0:Vector2
    v1:Vector2
    constructor(start:Vector2Like,end:Vector2Like){
        super()
        this.v0=Vector2.from(start)
        this.v1=Vector2.from(end)
    }
    getResolution(){
        return 1
    }
    getPoint(t: number, out: Vector2=Vector2.default()): Vector2 {
        return Vector2.lerp(out,this.v0,this.v1,t)
    }
    getTangent(t: number, optionalTarget: Vector2=Vector2.default()): Vector2 {
        return optionalTarget.copy(this.v1).subtract(this.v0).normalize()
    }
    getTangentAt( u:number, optionalTarget: Vector2=Vector2.default()): Vector2 {
		return this.getTangent( u, optionalTarget );

	}
}
CanvasRenderingContext2D.prototype.quadraticCurveTo