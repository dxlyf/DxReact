export class GLSingleUniform{
     name:string
     constructor(name:string){

     }
}

export class GLUniforms{
    uniforms: Map<string, number>
    constructor(){
        this.uniforms = new Map()
    }
}
