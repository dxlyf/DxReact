// 临时 debug：实例化绘制（用后即删）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const SIZE = 300
const gl = new CPURenderer({ width: SIZE, height: SIZE })

const vertexStage: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aOffset', size: 2 },
        { name: 'aColor', size: 3 },
    ],
    uniforms: ['uTransform'],
    main(attribs, uniforms) {
        const local = attribs.getVec4('aPosition')
        const off = attribs.get('aOffset')
        const transform = (uniforms.uTransform as Mat4 | undefined) ?? Mat4.identity()
        const pos = transform.transformVec4(new Vec4(local.x + (off?.[0] ?? 0), local.y + (off?.[1] ?? 0), 0, 1))
        const color = attribs.get('aColor')
        if ((globalThis as any).__LOG) (globalThis as any).__LOG.push({ local: [local.x, local.y], off: off ? [off[0], off[1]] : null, pos: [pos.x, pos.y, pos.z, pos.w], color: color ? [color[0], color[1], color[2]] : null })
        return { position: pos, varyings: color ? [color[0], color[1], color[2], 1] : [1, 1, 1, 1] }
    },
}
const fragmentStage: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const vs = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vs, vertexStage)
gl.compileShader(vs)
const fs = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fs, fragmentStage)
gl.compileShader(fs)
const program = gl.createProgram()
gl.attachShader(program, vs)
gl.attachShader(program, fs)
gl.linkProgram(program)
gl.useProgram(program)
console.log('link', gl.getProgramParameter(program, gl.LINK_STATUS))
const aPos = gl.getAttribLocation(program, 'aPosition')
const aOffset = gl.getAttribLocation(program, 'aOffset')
const aColor = gl.getAttribLocation(program, 'aColor')
const uTransform = gl.getUniformLocation(program, 'uTransform')
console.log('locs', aPos, aOffset, aColor, uTransform)

const tri = new Float32Array([0, 0, 10, 0, 0, 10])
const offsets = new Float32Array([290, 0, 145, 145, 0, 0])
const colors = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const triBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
const offBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, offBuf)
gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aOffset)
gl.vertexAttribPointer(aOffset, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aOffset, 1)
const colorBuf = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf)
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(aColor, 1)

const ortho = Mat4.ortho(0, SIZE, 0, SIZE, -1, 1)
gl.uniformMatrix4fv(uTransform, false, ortho.m)
gl.clearColor(0, 0, 0, 1)
const fb = gl.defaultFramebuffer

// 对照：普通 drawArrays，世界坐标直接放 (290,0),(300,0),(290,10)（aOffset 不 enable）
const triFar = new Float32Array([290, 0, 300, 0, 290, 10])
const vao2 = gl.createVertexArray()
gl.bindVertexArray(vao2)
const triBuf2 = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, triBuf2)
gl.bufferData(gl.ARRAY_BUFFER, triFar, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArrays(gl.TRIANGLES, 0, 3)
console.log('--- 普通绘制世界(290,0)(300,0)(290,10) 扫描 ---')
let red2 = 0
for (let y = 280; y < 300; y++) {
    for (let x = 280; x < 300; x++) {
        const c = fb.readColor(x, y)
        if (c[0] > 200) {
            red2++
            if (red2 <= 3) console.log(`red(${x},${y})`)
        }
    }
}
console.log('red2 count:', red2)
gl.bindVertexArray(vao)

// 最小复现：单实例，offset (290,0)（颜色是红）
;(globalThis as any).__LOG = []
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 1)
console.log('--- 顶点着色器输出（单实例 offset(290,0)）---')
console.log(JSON.stringify((globalThis as any).__LOG))
console.log('--- 单实例 offset(290,0) 内部扫描 280..300 ---')
let redCount = 0
for (let y = 280; y < 300; y++) {
    for (let x = 280; x < 300; x++) {
        const c = fb.readColor(x, y)
        if (c[0] > 200 && c[1] < 100 && c[2] < 100) {
            redCount++
            if (redCount <= 5) console.log(`red(${x},${y}) = ${c.join(',')}`)
        }
    }
}
console.log('red count:', redCount)
console.log('sample(299,299):', fb.readColor(299, 299).join(','))
console.log('sample(290,290):', fb.readColor(290, 290).join(','))
console.log('sample(295,295):', fb.readColor(295, 295).join(','))
console.log('err:', gl.getError())
gl.clear(gl.COLOR_BUFFER_BIT)
gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 3)
console.log('err', gl.getError())

// 扫描整帧找非背景像素
let found = 0
for (let y = 0; y < SIZE; y += 5) {
    for (let x = 0; x < SIZE; x += 5) {
        const c = fb.readColor(x, y)
        if (c[0] > 10 || c[1] > 10 || c[2] > 10) {
            if (found < 20) console.log(`pixel(${x},${y}) = ${c.join(',')}`)
            found++
        }
    }
}
console.log('non-background count:', found)
// 精确扫描实例2 区域（内部 x 240..300, y 240..300 → readPixels y 0..59）
console.log('--- 实例2 区域 readPixels(240..300, 0..59) ---')
let blue = 0
for (let py = 0; py < 60; py++) {
    for (let px = 240; px < 300; px++) {
        const p = new Uint8Array(4)
        gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p)
        if (p[2] > 200 && p[0] < 100) blue++
    }
}
console.log('blue pixels:', blue)
// 用内部坐标直接检查实例2 三角形区域
console.log('--- 内部坐标检查 fb.readColor(290..299, 290..299) ---')
let blue2 = 0
for (let y = 290; y < 300; y++) {
    for (let x = 290; x < 300; x++) {
        const c = fb.readColor(x, y)
        if (c[2] > 200 && c[0] < 100) blue2++
    }
}
console.log('internal blue pixels:', blue2)
console.log('corner(299,299):', fb.readColor(299, 299).join(','))
console.log('corner(290,290):', fb.readColor(290, 290).join(','))
