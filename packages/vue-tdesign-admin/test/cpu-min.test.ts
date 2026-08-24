// 临时 debug：极简 CPURenderer 右下角三角形（用后即删）
import { CPURenderer, Mat4, Vec4, type VertexStageSource, type FragmentStageSource } from './src/views/graphics/engine/raster/cpu/index'

const gl = new CPURenderer({ width: 300, height: 300 })

// 2 个 attribute：pos + color（颜色用 attribute，避免默认白）
const vs: VertexStageSource = {
    attribs: [
        { name: 'aPosition', size: 2 },
        { name: 'aColor', size: 4 },
    ],
    uniforms: ['uTransform'],
    main(attribs, uniforms) {
        const p = attribs.getVec4('aPosition')
        const color = attribs.get('aColor')!
        const pos = (uniforms.uTransform as Mat4).transformVec4(p)
        return { position: pos, varyings: [color[0], color[1], color[2], color[3]] }
    },
}
const fs: FragmentStageSource = {
    main(input) {
        const c = input.varyings
        return new Vec4(c[0], c[1], c[2], c[3])
    },
}

const shv = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(shv, vs)
gl.compileShader(shv)
const shf = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(shf, fs)
gl.compileShader(shf)
const program = gl.createProgram()
gl.attachShader(program, shv)
gl.attachShader(program, shf)
gl.linkProgram(program)
gl.useProgram(program)
const aPos = gl.getAttribLocation(program, 'aPosition')
const aColor = gl.getAttribLocation(program, 'aColor')
const uTrans = gl.getUniformLocation(program, 'uTransform')

// 右下角三角形：世界 (290,0)(300,0)(290,10)，红色
const verts = new Float32Array([
    290, 0, 1, 0, 0, 1,
    300, 0, 1, 0, 0, 1,
    290, 10, 1, 0, 0, 1,
])
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
gl.enableVertexAttribArray(aPos)
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 24, 0)
gl.enableVertexAttribArray(aColor)
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 24, 8)

gl.uniformMatrix4fv(uTrans, false, Mat4.ortho(0, 300, 0, 300, -1, 1).m)
gl.clearColor(0, 0, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)
;(globalThis as any).__DBG = true
gl.drawArrays(gl.TRIANGLES, 0, 3)
;(globalThis as any).__DBG = false
console.log('err:', gl.getError())
console.log('viewport:', JSON.stringify(gl.getViewport()))

const fb = gl.defaultFramebuffer
let red = 0
for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
        const c = fb.readColor(x, y)
        if (c[0] > 100 && c[1] < 50 && c[2] < 50) red++
    }
}
console.log('red pixels:', red)
console.log('sample(295,295):', fb.readColor(295, 295).join(','))
console.log('sample(290,290):', fb.readColor(290, 290).join(','))
