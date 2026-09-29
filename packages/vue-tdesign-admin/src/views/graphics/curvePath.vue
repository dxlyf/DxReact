<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { curvePaths, normalizeAngles,earcut, Vector2, glMatrix ,buildStrokePoints, Vector2Like} from '@dxyl/math2'
import { Renderer, defineMaterial, Geometry,OrthographicCamera, defineUniforms, PerspectiveCamera } from '@dxyl/gpu-device-api'
import GUI from "lil-gui"
const canvasRef = shallowRef<HTMLCanvasElement>()


function buildStrokePoints2(points:Vector2Like[],options:{
    align?:number;// 1:outside 0:inside 0.5:center 
    width?: number;
    join?: 'round' | 'bevel' | 'miter';
    cap?: 'round' | 'butt' | 'square';
    miterLimit?: number;
}):Vector2Like[]{
    const {width=1,cap,join,miterLimit=10}=options
    const invertMiterLimit=1/miterLimit
    const isClosed=Vector2.equals(points[0],points[points.length-1])
    const result:Vector2Like[]=[]
    const length=points.length


    for(let i=0;i<length;i++){
        
    }
    return result
}
async function init() {
    const renderer =await Renderer.create({
        backend:'webgl2',
        canvas:canvasRef.value,
        depth:false,
        sampleCount:1,
        clearColor:[0,0,0,1]
    })
    renderer.setSize(500,500,true)
    renderer.resize()
   // const camera = new OrthographicCamera()
   // renderer.setCamera(camera)
    const sdfMaterial = renderer.createMaterial({
        name: 'sdfMaterial',
        attributes: {
            aPos: 'float32x2',
            
        },
        uniforms: {
            projectMatrix: 'mat3x3f',
            modelMatrix: 'mat3x3f',
            uColor:'vec3f',
        },
        glsl: {
            vs: `
        void main(){
            vec3 pos =u.projectMatrix*u.modelMatrix*vec3(aPos.xy,1.);
            gl_Position = vec4(pos.xy,0.,1.0);
        }
        `,
            fs: `
            void main(){
                vec4 color = vec4(u.uColor,1.0);
                fragColor = color;
            }
        `,
        },
        wgsl: ``,
        topology:'triangle-list',
        cullMode:'none',
       // frontFace:'cw'
    })
    
    const path=new curvePaths.Shape()
    path.moveTo(100,100)
    path.lineTo(200,100)
    
    path.lineTo(100,200)
    path.lineTo(200,200)
 
   const strokePoints=buildStrokePoints(path.getPoints(),{
    width:20,
    cap:'square',
    join:'bevel',
   }).map(p=>Vector2.from(p))
   strokePoints.pop()
   const strokeShape=new curvePaths.Shape()
   strokeShape.setFromPoints(strokePoints)
   const a=curvePaths.ShapeUtils.addShapes([strokeShape])

   function toCood(v:number[]){
      let result:number[]=[]
      for(let i=0;i<v.length;i+=3){
           result.push(v[i],v[i+1])
      }
      return result
   }
   const vertices=new Float32Array(toCood(a.vertices))
   const indices=new Uint16Array(a.indices)
   console.log('vertices',vertices)
   console.log('indices',indices)
   console.log('strokePoints',strokePoints)
    const box=renderer.createGeometry({
        attributes:{
            aPos:{
                data:vertices,        
                format:'float32x2',
            }
        },
        indices:indices,
    })
    const projMatrix=glMatrix.mat3.create()
    const modelMatrix=glMatrix.mat3.create()
    
    glMatrix.mat3.projection(projMatrix,renderer.width,renderer.height)
    glMatrix.mat3.identity(modelMatrix)
    function render(){
        renderer.beginFrame()

        renderer.draw(box,{
            material: sdfMaterial,
            uniforms: {
                projectMatrix: projMatrix,
                modelMatrix: modelMatrix,
                uColor:[1,0,0],
            },
          //  count:indices.length,
            //count:3
        })
        renderer.endFrame()
    }
    render()
}
onMounted(() => {
    init()
})

</script>
<template>
    <canvas ref="canvasRef"></canvas>
</template>