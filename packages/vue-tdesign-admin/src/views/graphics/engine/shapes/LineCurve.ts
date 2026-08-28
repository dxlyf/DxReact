import {Curve} from './Curve'
import { Vector2,Vector2Like} from '@dxyl/math2'


export class LineCurve extends Curve{
    start:Vector2
    end:Vector2
    constructor(start:Vector2Like,end:Vector2Like){
        super()
        this.start=Vector2.from(start)
        this.end=Vector2.from(end)
    }
    getResolution(){
        return 1
    }
    getPoint(t: number, out: Vector2=Vector2.default()): Vector2 {
        return Vector2.lerp(out,this.start,this.end,t)
    }
}