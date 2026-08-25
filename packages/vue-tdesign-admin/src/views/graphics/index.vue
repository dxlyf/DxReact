<script setup lang="ts">
import { shallowRef, onMounted } from 'vue'
import { ShapePath, glMatrix, WebGL2Helper, WebGPUHelper, CanvasRenderer, pixijs, curvePaths, PathBuilder, tess2, earcut } from '@dxyl/math2'
import GUI from "lil-gui"

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


function addShapes(shapes: curvePaths.Shape[], curveSegments: number = 12) {
    const vertices = [], normals = [], uvs = [], indices = []
    function addShape(shape: curvePaths.Shape) {

        const indexOffset = vertices.length / 3;
        const points = shape.extractPoints(curveSegments);

        let shapeVertices = points.shape;
        const shapeHoles = points.holes;

        // check direction of vertices

        if (curvePaths.ShapeUtils.isClockWise(shapeVertices) === false) {

            shapeVertices = shapeVertices.reverse();

        }

        for (let i = 0, l = shapeHoles.length; i < l; i++) {

            const shapeHole = shapeHoles[i];

            if (curvePaths.ShapeUtils.isClockWise(shapeHole) === true) {

                shapeHoles[i] = shapeHole.reverse();

            }

        }

        const faces = curvePaths.ShapeUtils.triangulateShape(shapeVertices, shapeHoles);

        // join vertices of inner and outer paths to a single array

        for (let i = 0, l = shapeHoles.length; i < l; i++) {

            const shapeHole = shapeHoles[i];
            shapeVertices = shapeVertices.concat(shapeHole);

        }

        // vertices, normals, uvs

        for (let i = 0, l = shapeVertices.length; i < l; i++) {

            const vertex = shapeVertices[i];

            vertices.push(vertex.x, vertex.y, 0);
            normals.push(0, 0, 1);
            uvs.push(vertex.x, vertex.y); // world uvs

        }

        // indices

        for (let i = 0, l = faces.length; i < l; i++) {

            const face = faces[i];

            const a = face[0] + indexOffset;
            const b = face[1] + indexOffset;
            const c = face[2] + indexOffset;

            indices.push(a, b, c);
            //groupCount += 3;

        }

    }
    for(let i=0;i<shapes.length;i++){
        addShape(shapes[i])
    }
    return {
        vertices,
        normals,
        uvs,
        indices
    }
}

onMounted(async () => {

    // let app=new PIXIJS.Application()

    // await app.init({
    //     width:500,
    //     height:500,
    //     canvas:canvasRef.value,
    //     preference:'webgl',
    //     antialias:true
    // })

    // const g=new PIXIJS.Graphics()
    // g.moveTo(200,200)
    // g.lineTo(300,200)
    // g.lineTo(300,300)
    // g.stroke({
    //     width:10,
    //     color:0xff0000,
    //     join:'round',
    //     cap:'round',
    // })
    // app.stage.addChild(g)

    // app.start()
    // return
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
    const indices = [
        0, 1, 2,
        3, 2, 1,
    ]

    //     let graphicsPath2 = new PIXIJS.GraphicsPath([])
    // graphicsPath2.moveTo(200,200)
    // graphicsPath2.lineTo(300,200)
    // graphicsPath2.lineTo(300,300)

    let graphicsPath = new pixijs.GraphicsPath()
    graphicsPath.moveTo(200, 200)
    graphicsPath.lineTo(300, 200)
    graphicsPath.lineTo(300, 300)





    const batchs: any[] = []
    const geometryData = {
        vertices: [],
        uvs: [],
        indices: []
    } as {
        vertices: number[],
        uvs: number[],
        indices: number[]
    }
    pixijs.addShapePathToGeometryData(graphicsPath.shapePath, {
        color: '#ff0000',
        width: 10,
        alignment: 0.5,
        cap: 'butt',
        join: 'round',
        miterLimit: 10,
        //pixelLine:true

    }, true, batchs, geometryData)

    const pathBuilder = PathBuilder.default()

    pathBuilder.moveTo(200, 200)
    pathBuilder.lineTo(300, 200)
    pathBuilder.lineTo(300, 300)

    
//     const shape=new curvePaths.Shape()
//     const path=new curvePaths.Path()
//     shape.roundRect(100, 100, 100, 100,10)
//     path.rect(120,120,60,60)
//     shape.holes.push(path)
//   //  path2.curves.reverse()
//    // shapePath.subPaths.push(path,path2)
//   //  const shapes=shapePath.toShapes(false)
 
//     const shapeData = addShapes([shape])


    // geometryData.vertices = shapeData.vertices.reduce((a, v, i) => {
    //     if ((i + 1) % 3 != 0) {
    //         a.push(v)
    //     }
    //     return a
    // }, [])
    // geometryData.indices = shapeData.indices

    // console.log('geometryData',geometryData)
    // console.log('batchs',batchs)

    const vertexBuffer = gl.createBuffer(new Float32Array(geometryData.vertices), gl.gl.ARRAY_BUFFER, gl.gl.STATIC_DRAW)
    const indecisBuffer = gl.createBuffer(new Int16Array(geometryData.indices), gl.gl.ELEMENT_ARRAY_BUFFER, gl.gl.STATIC_DRAW)



    let projectMatrix = glMatrix.mat3.create()
    //  glMatrix.mat3.set(projectMatrix,1,0,0,1,0,0,0,0,1,0)
    glMatrix.mat3.projection(projectMatrix, gl.gl.drawingBufferWidth, gl.gl.drawingBufferHeight)

    gl.useProgram(progam2d)
    gl.setUniform(progam2d, 'uColor', new Float32Array([1, 0, 0]))
    gl.setUniform(progam2d, 'projectMatrix', projectMatrix)
    gl.setAttributeByLocation(0, 2, gl.gl.FLOAT, false, 4 * 2, 0)


    gl.clear(gl.gl.COLOR_BUFFER_BIT)
    // gl.drawArrays(gl.gl.TRIANGLES, 0, 3)
    gl.gl.bindBuffer(gl.gl.ELEMENT_ARRAY_BUFFER, indecisBuffer)
    gl.drawElements(gl.gl.TRIANGLES, geometryData.indices.length, gl.gl.UNSIGNED_SHORT, 0)


})
</script>

<template>

    <canvas ref="canvasRef"></canvas>
</template>
