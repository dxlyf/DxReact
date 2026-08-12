import { intersection } from "lodash-es"
import { Vector2,type Vector2Like} from "./vector2"


export class BoundingRect{
    static default(){
        return new BoundingRect()
    }
    min:Vector2 = Vector2.create(0,0)
    max:Vector2 = Vector2.create(0,0)
    constructor(){
        this.setEmpty()
    }
    get left(){
        return this.min.x
    }
    get top(){
        return this.min.y
    }
    get right(){
        return this.max.x
    }
    get bottom(){
        return this.max.y
    }
    get width(){
        return this.right-this.left
    }
    get height(){
        return this.bottom-this.top
    }
    setEmpty(){
        this.min.set(Infinity,Infinity)
        this.max.set(-Infinity,-Infinity)
    }
    setZero(){
        this.min.set(0,0)
        this.max.set(0,0)
    }
    expandPoints(points:Vector2Like[]){
        for(let i=0;i<points.length;i++){
            this.min.min(points[i])
            this.max.max(points[i])
        }
    }
    expandPoint(point:Vector2Like){
        this.min.min(point)
        this.max.max(point)
    }
    fromPoints(points:Vector2Like[]){
        this.setEmpty()
        this.expandPoints(points)
    }
    fromLTRB(left:number,top:number,right:number,bottom:number){
        this.setEmpty()
        this.expandPoint(Vector2.create(left,top))
        this.expandPoint(Vector2.create(right,bottom))
    }
    fromXYWH(x:number,y:number,width:number,height:number){
        this.setEmpty()
        this.expandPoint(Vector2.create(x,y))
        this.expandPoint(Vector2.create(x+width,y+height))
    }
    copy(rect:BoundingRect){
        this.min.copy(rect.min)
        this.max.copy(rect.max)
        return this
    }
    clone(){
        return new BoundingRect().copy(this)
    }
    containsPoint(point:Vector2Like){
        return this.containsXY(point.x,point.y)
    }
    containsXY(x:number,y:number){
        return !(x<this.left||x>this.right||y<this.top||y>this.bottom)
    }
    contains(rect:BoundingRect){
        return !(rect.left<this.left||rect.right>this.right||rect.top<this.top||rect.bottom>this.bottom)
    }
    intersection(rect:BoundingRect){
        return !(rect.left>this.right||rect.right<this.left||rect.top>this.bottom||rect.bottom<this.top)
    }
    intersects(rect:BoundingRect){
        return this.intersection(rect)
    }
    union(rect:BoundingRect){
        this.min.min(rect.min)
        this.max.max(rect.max)
        return this
    }
    outset(offset:Vector2Like){
        this.min.translate(-offset.x,-offset.y)
        this.max.translate(offset.x,offset.y)
        return this
    }
    inset(offset:Vector2Like){
        this.min.translate(offset.x,offset.y)
        this.max.translate(-offset.x,-offset.y)
        return this
    }
    isEmpty(){
        return this.width<=0||this.height<=0
    }
}