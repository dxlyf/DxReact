import { PathData } from "./path_data";
import { ShapePrimitive } from "./shape/shape_primitive";



export class ShapePath{
     pathData:PathData
     shapes:ShapePrimitive[]=[]
     constructor(pathData:PathData){
        this.pathData=pathData
     }
     buildPath(){
         const commands=this.pathData.getCommands()
         type TypeShapePath=typeof ShapePath
         for(const command of commands){
           this[command.type](...command.data)
         }
    }
    moveTo(x:number,y:number){
        this.pathData.moveTo(x,y)
    }
    lineTo(x:number,y:number){
        this.pathData.lineTo(x,y)
    }
}