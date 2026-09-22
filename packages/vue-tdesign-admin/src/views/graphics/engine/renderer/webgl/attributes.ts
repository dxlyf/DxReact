

export class GLAttribute{
    name:string
    type:number
    location:number
    constructor(name:string,type:number,location:number){
        this.name=name
        this.type=type
        this.location=location
    }
    
}
export class GLAttributes{
    attributes: Map<string, number>
    constructor(){
        this.attributes = new Map()
    }
}
WebGL2RenderingContext.prototype.vertexAttrib1fv