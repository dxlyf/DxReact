import { Vector2,Vector2Like} from '@dxyl/math2'

export abstract class Curve{
    private points:Vector2Like[]
    needsUpdate:boolean=false
    abstract getPoint(t:number,out?:Vector2):Vector2
    getPoints(divisions:number){
        if(this.points&&!this.needsUpdate){
            return this.points
        }
        this.needsUpdate=false
        const points=this.points=[] as Vector2Like[]
        const out=Vector2.create()
        let lastPoint:null|Vector2=null
        for(let i=0;i<=divisions;i++){
            const t=i/divisions
            this.getPoint(t,out)
            if(lastPoint===null||!lastPoint.equalsEpsilon(out)){
                points.push({x:out.x,y:out.y})
            }
            if(lastPoint===null){
                lastPoint=Vector2.create()
            }
            lastPoint.copy(out)
        }
        return points
    }
}