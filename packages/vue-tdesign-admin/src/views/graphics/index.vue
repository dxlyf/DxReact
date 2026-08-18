<script setup lang="ts">
import { shallowRef,onMounted } from 'vue'
import {ShapePath,WebGL2Helper,WebGPUHelper,CanvasRenderer} from '@dxyl/math2'
const canvasRef = shallowRef<HTMLCanvasElement>()

function initWebgl(){
     const gl=new WebGL2Helper( canvasRef.value,{
        mode:'2d',
        contextAttributes:{
            antialias:true,
        }
    })
    gl.setSize(500,500,window.devicePixelRatio,true)

    const vertexShader=`#version 300 es
    layout(location = 0) in vec2 aPos;
    layout(location = 1) in vec3 aColor;
    out vec3 vColor;
    void main() {
        vColor = aColor;
        gl_Position = vec4(aPos, 0.0, 1.0);
    }
    `
    const fragmentShader=`#version 300 es
    precision mediump float;
    in vec3 vColor;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(vColor, 1.0);
    }
    `
    const progam2d=gl.createProgram(vertexShader,fragmentShader)
    
    gl.init([0,0,0,1])
    gl.useProgram(progam2d)
    
    const vertices=new Float32Array([
        -0.5,0.5,1,0,0,
        0.5,0.5,0,1,0,
        0,0,0,0,1
    ])
    const vertexBuffer=gl.createBuffer(vertices,gl.gl.ARRAY_BUFFER,gl.gl.STATIC_DRAW)


    gl.useProgram(progam2d)
    gl.setAttributeByLocation(0,2,gl.gl.FLOAT,false,4*5,0)
    gl.setAttributeByLocation(1,3,gl.gl.FLOAT,false,4*5,2*4)
   
    gl.clear(gl.gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.gl.TRIANGLES,0,3)
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
onMounted(() => {
  //  initWebgpu()
  let renderer=new CanvasRenderer({
    canvas:canvasRef.value,
    width:500,
    height:500,
    
  })
 const ellipse= renderer.add('ellipse',{
    style:{
        fillStyle:null,
        strokeStyle:'red'
    },
    position:{x:200,y:200},
    rx:50,
    ry:70,
    startAngle:0,
    endAngle:Math.PI*2,
  })
  const circle=renderer.add('circle',{
    style:{
        fillStyle:'red'
    },
    position:{x:200,y:200},
    radius:5,
    startAngle:0,
    endAngle:Math.PI*2,
  })
  const text=renderer.add('text',{
    style:{
        fillStyle:'#0000ff'
    },
    position:{x:100,y:20},
    text:'hello world',
  })
  // 
  // 求点到椭圆的有符号距离（负=内部，正=外部，0=轮廓）
  const ellipseSignDist = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => {
    // 变换到椭圆本地坐标系
    const px = x - cx, py = y - cy
    if (rx <= 0 || ry <= 0) return Infinity
    // 椭圆无解析 SDF，用 Newton 迭代求最近点（目标：切向量 ⊥ 点-椭圆点连线）
    let t = Math.atan2(ry * py, rx * px) // 参数角初值
    for (let i = 0; i < 20; i++) {
      const ex = rx * Math.cos(t), ey = ry * Math.sin(t)
      const tanX = -rx * Math.sin(t), tanY = ry * Math.cos(t) // 切向量
      const gx = ex - px, gy = ey - py
      // f(t) = (P - E(t))·T(t)，求 f = 0
      const f = gx * tanX + gy * tanY
      // f'(t)
      const df = tanX * tanX + tanY * tanY - gx * rx * Math.cos(t) - gy * ry * Math.sin(t)
      if (df === 0) break
      const step = f / df
      t -= step
      if (Math.abs(step) < 1e-9) break
    }
    const ex = rx * Math.cos(t), ey = ry * Math.sin(t)
    const dist = Math.hypot(ex - px, ey - py)
    const inside = (px * px) / (rx * rx) + (py * py) / (ry * ry) <= 1
    return inside ? -dist : dist
  }
  function sdEllipseIQ(p: {x: number, y: number}, ab: {x: number, y: number}): number {
    let px = Math.abs(p.x);
    let py = Math.abs(p.y);
    let rx = ab.x;
    let ry = ab.y;
    
    if (px > py) {
        [px, py] = [py, px];
        [rx, ry] = [ry, rx];
    }
    
    const l = ry * ry - rx * rx;
    const m = rx * px / l;
    const m2 = m * m;
    const n = ry * py / l;
    const n2 = n * n;
    const c = (m2 + n2 - 1.0) / 3.0;
    const c3 = c * c * c;
    const q = c3 + m2 * n2 * 2.0;
    const d = c3 + m2 * n2;
    const g = m + m * n2;
    
    let co: number;
    
    if (d < 0.0) {
        const h = Math.acos(q / c3) / 3.0;
        const s = Math.cos(h);
        const t = Math.sin(h) * Math.sqrt(3.0);
        const rx_root = Math.sqrt(-c * (s + t + 2.0) + m2);
        const ry_root = Math.sqrt(-c * (s - t + 2.0) + m2);
        co = (ry_root + Math.sign(l) * rx_root + Math.abs(g) / (rx_root * ry_root) - m) / 2.0;
    } else {
        const h = 2.0 * m * n * Math.sqrt(d);
        const s = Math.sign(q + h) * Math.pow(Math.abs(q + h), 1.0 / 3.0);
        const u = Math.sign(q - h) * Math.pow(Math.abs(q - h), 1.0 / 3.0);
        const rx_root = -s - u - c * 4.0 + 2.0 * m2;
        const ry_root = (s - u) * Math.sqrt(3.0);
        const rm = Math.sqrt(rx_root * rx_root + ry_root * ry_root);
        co = (ry_root / Math.sqrt(rm - rx_root) + 2.0 * g / rm - m) / 2.0;
    }
    
    const co_clamped = Math.max(-1.0, Math.min(1.0, co));
    const r = {
        x: rx * co_clamped,
        y: ry * Math.sqrt(1.0 - co_clamped * co_clamped)
    };
    
    const dx = px - r.x;
    const dy = py - r.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist * Math.sign(py - r.y);
}
  renderer.on('pointermove',e=>{
    circle.transform.position.set(e.point.x,e.point.y)
    const dist=ellipseSignDist(e.point.x,e.point.y,ellipse.transform.position.x,ellipse.transform.position.y,ellipse.rx,ellipse.ry)
    const dist2=sdEllipseIQ({x:e.point.x-ellipse.transform.position.x,y:e.point.y-ellipse.transform.position.y},{x:ellipse.rx,y:ellipse.ry})
       text.text='距离:'+dist.toFixed(2)+' iq距离:'+dist2.toFixed(2)
  //  text.transform.position.set(e.point.x+20,e.point.y-10)
    renderer.refresh()
  })
  
})
</script>

<template>
    <canvas ref="canvasRef" ></canvas>
</template>
