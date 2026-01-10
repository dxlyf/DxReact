
export class Rect{
    static fromXYWH(x:number,y:number,width:number,height:number):Rect{
        return new this(x,y,width,height);
    }
    static fromLTRB(left:number,top:number,right:number,bottom:number):Rect{
        return new this(left,top,right-left,bottom-top);
    }
    declare x:number;
    declare y:number;
    declare width:number;
    declare height:number
    constructor(x:number,y:number,width:number,height:number){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    get top(){
        return this.y;
    }
    set top(value:number){
        this.y = value;
    }
    get bottom(){
        return this.y + this.height;
    }
    set bottom(value:number){
        this.height = value - this.y;
    }
    get left(){
        return this.x;
    }
    set left(value:number){
        this.x = value;
    }
    get right(){
        return this.x + this.width;
    }
    set right(value:number){
        this.width = value - this.x;
    }
    clone():Rect{
        return new Rect(this.x,this.y,this.width,this.height)
    }
    contains(x:number,y:number):boolean{
        return !(this.bottom < y || this.top > y || this.right < x || this.left > x)
    }
    intersetionRect(rect:Rect):boolean{
        return !(this.bottom < rect.top || this.top > rect.bottom || this.right < rect.left || this.left > rect.right) 
    }
}