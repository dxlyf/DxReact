<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { curvePaths, normalizeAngles, Vector2, glMatrix } from '@dxyl/math2'
import { Renderer, defineMaterial, Geometry,OrthographicCamera, defineUniforms, PerspectiveCamera } from '@dxyl/gpu-device-api'
import GUI from "lil-gui"
const canvasRef = shallowRef<HTMLCanvasElement>()

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
            aPos: 'float32x2'
        },
        uniforms: {
            projectMatrix: 'mat3x3f',
            modelMatrix: 'mat3x3f',
            uColor:'vec3f',
        },
        glsl: {
            vs: `
        void main(){
            vec3 pos =u.projectMatrix*u.modelMatrix*vec3(aPos,1.);
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
        cullMode:'back',
        frontFace:'cw'
    })
    
     
    const box=renderer.createGeometry({
        attributes:{
            aPos:{
                data: new Float32Array([-0.5,0.5,0.5,0.5,0,0]),
                format:'float32x2'
            }
        }
    })
    const projMatrix=glMatrix.mat3.create()
    const modelMatrix=glMatrix.mat3.create()
    
    glMatrix.mat3.identity(projMatrix)
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