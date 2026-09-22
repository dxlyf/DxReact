

export class GLUniform{
    gl:WebGLRenderingContext;
    name:string;
    type:number;
    location:WebGLUniformLocation;
    constructor(options:{gl:WebGLRenderingContext, name:string,type:number,location:WebGLUniformLocation}){
        this.gl=options.gl;
        this.name=options.name;
        this.type=options.type;
        this.location=options.location;
    }
}
export class GLStructUniform{
    constructor(gl:WebGLRenderingContext, name:string){
        
    }
}
export class GLArrayUniform{
    constructor(gl:WebGLRenderingContext, name:string){
 
    }
}
