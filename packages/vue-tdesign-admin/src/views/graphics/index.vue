<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { ShapePath,glMatrix, WebGL2Helper, WebGPUHelper, CanvasRenderer,pixijs,curvePaths,PathBuilder,earcut } from '@dxyl/math2'
import GUI from "lil-gui"
import * as PIXIJS from 'pixi'

const canvasRef = shallowRef<HTMLCanvasElement>()

function initWebgl() {
    const gl = new WebGL2Helper(canvasRef.value, {
        mode: '2d',
        contextAttributes: {
            antialias: true,
        }
    })
    gl.setSize(500, 500, window.devicePixelRatio, true)

    const vertexShader = `#version 300 es
    layout(location = 0) in vec2 aPos;
    layout(location = 1) in vec3 aColor;
    out vec3 vColor;
    void main() {
        vColor = aColor;
        gl_Position = vec4(aPos,0, 1.0);
    }
    `
    const fragmentShader = `#version 300 es
    precision mediump float;
    in vec3 vColor;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(vColor, 1.0);
    }
    `
    const progam2d = gl.createProgram(vertexShader, fragmentShader)

    gl.init([0, 0, 0, 1])
    gl.useProgram(progam2d)

    const vertices = new Float32Array([
        -0.5, 0.5, 1, 0, 0,
        0.5, 0.5, 0, 1, 0,
        0, 0, 0, 0, 1
    ])
    const vertexBuffer = gl.createBuffer(vertices, gl.gl.ARRAY_BUFFER, gl.gl.STATIC_DRAW)


    gl.useProgram(progam2d)
    gl.setAttributeByLocation(0, 2, gl.gl.FLOAT, false, 4 * 5, 0)
    gl.setAttributeByLocation(1, 3, gl.gl.FLOAT, false, 4 * 5, 2 * 4)

    gl.clear(gl.gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.gl.TRIANGLES, 0, 3)
}
async function initWebgpu() {
    const gpu = new WebGPUHelper(canvasRef.value, {
        contextConfiguration: { alphaMode: 'premultiplied' },
    })
    await gpu.init()
    gpu.setSize(500, 500, window.devicePixelRatio)

    // WGSL 着色器：vertex + fragment 写在同一个 shader module 中，分别指定入口
    const shaderCode = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) color: vec3f,
    }
    @vertex
    fn vs_main(@location(0) pos: vec2f, @location(1) color: vec3f) -> VertexOutput {
        var out: VertexOutput;
        out.position = vec4f(pos, 0.0, 1.0);
        out.color = color;
        return out;
    }
    @fragment
    fn fs_main(@location(0) color: vec3f) -> @location(0) vec4f {
        return vec4f(color, 1.0);
    }
    `
    const shaderModule = gpu.createShaderModule(shaderCode)

    const vertices = new Float32Array([
        -0.5, 0.5, 1, 0, 0,
        0.5, 0.5, 0, 1, 0,
        0, 0, 0, 0, 1,
    ])
    const vertexBuffer = gpu.createBuffer(vertices, GPUBufferUsage.VERTEX)

    // 渲染管线：顶点布局与 WebGL 的 attribute 一致（stride 20 = 5 * float32）
    const pipeline = gpu.createRenderPipeline(shaderModule, shaderModule, {
        vertexEntryPoint: 'vs_main',
        fragmentEntryPoint: 'fs_main',
        buffers: [
            {
                arrayStride: 5 * 4,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: 'float32x2' },
                    { shaderLocation: 1, offset: 2 * 4, format: 'float32x3' },
                ],
            },
        ],
        primitive: { topology: 'triangle-list' },
        targets: [{ format: gpu.format }],
        layout: 'auto',
    })

    // 编码 → 渲染通道 → 提交
    gpu.beginCommandEncoder()
    const pass = gpu.beginRenderPass({ clearValue: { r: 0, g: 0, b: 0, a: 1 } })
    pass.setPipeline(pipeline)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.draw(3)
    gpu.endRenderPass()
    gpu.submit()
}
onMounted(async () => {

    let app=new PIXIJS.Application()

    await app.init({
        width:500,
        height:500,
        canvas:canvasRef.value,
        preference:'webgl',
        antialias:true
    })
    
    const g=new PIXIJS.Graphics()
    g.moveTo(200,200)
    g.lineTo(300,200)
    g.lineTo(300,300)
    g.stroke({
        width:10,
        color:0xff0000,
        join:'round',
        cap:'round',
    })
    app.stage.addChild(g)
    
    app.start()
    return
    //  initWebgpu()
  const gl = new WebGL2Helper(canvasRef.value, {
        mode: '2d',
        contextAttributes: {
            antialias: true,
        }
    })
    gl.setSize(500, 500, window.devicePixelRatio, true)

  
    const vertexShader = `#version 300 es
    layout(location = 0) in vec2 aPos;
    uniform mat3 projectMatrix;
    void main() {
        vec3 pos = projectMatrix * vec3(aPos, 1.0);
        gl_Position = vec4(pos, 1.0);
    }
    `
    const fragmentShader = `#version 300 es
    precision mediump float;
    uniform vec3 uColor;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(uColor, 1.0);
    }
    `
    const progam2d = gl.createProgram(vertexShader, fragmentShader)

    gl.init([0, 0, 0, 1])
    gl.useProgram(progam2d)

    const vertices = [
        100, 100,
        200, 100,
        100, 200,
        200, 200,
    ]
      const indices =[
        0, 1, 2,
        3, 2, 1,
    ]
    let graphicsPath = new pixijs.GraphicsPath()
    graphicsPath.moveTo(200,200)
    graphicsPath.lineTo(300,200)
    graphicsPath.lineTo(300,300)




   const geometryData = pixijs.buildGeometryFromPath(graphicsPath)
   const batchs:any[]=[]
   pixijs.addShapePathToGeometryData(graphicsPath.shapePath,{
    color:'#ff0000',
    width:10,
    alignment:0.5,
    cap:'butt',
    join:'miter',
    miterLimit:10,
    //pixelLine:true

   },true,batchs,geometryData)

    console.log('geometryData',geometryData)
    console.log('batchs',batchs)
    
    const vertexBuffer = gl.createBuffer(new Float32Array(batchs[0].geometryData.vertices), gl.gl.ARRAY_BUFFER, gl.gl.STATIC_DRAW)
    const indecisBuffer = gl.createBuffer(new Int16Array(batchs[0].geometryData.indices), gl.gl.ELEMENT_ARRAY_BUFFER, gl.gl.STATIC_DRAW)

  

    let projectMatrix = glMatrix.mat3.create()
  //  glMatrix.mat3.set(projectMatrix,1,0,0,1,0,0,0,0,1,0)
    glMatrix.mat3.projection(projectMatrix,gl.gl.drawingBufferWidth,gl.gl.drawingBufferHeight)

    gl.useProgram(progam2d)
    gl.setUniform(progam2d,'uColor',new Float32Array([1,0,0]))
    gl.setUniform(progam2d,'projectMatrix',projectMatrix)
    gl.setAttributeByLocation(0, 2, gl.gl.FLOAT, false, 4*2, 0)
   

    gl.clear(gl.gl.COLOR_BUFFER_BIT)
   // gl.drawArrays(gl.gl.TRIANGLES, 0, 3)
    gl.gl.bindBuffer(gl.gl.ELEMENT_ARRAY_BUFFER, indecisBuffer)
    gl.drawElements(gl.gl.TRIANGLES,geometryData.indices.length, gl.gl.UNSIGNED_SHORT, 0)
  

})
</script>

<template>

<canvas ref="canvasRef"></canvas>
</template>
