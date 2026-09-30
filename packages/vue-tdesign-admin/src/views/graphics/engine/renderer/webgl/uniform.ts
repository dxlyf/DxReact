import { Context } from "./context"
import { Program } from "./program"

interface IUniform{
    name:string
    update(ctx:Context,program:Program):void
}
class Uniform implements IUniform{
    name: string
    constructor(name:string){
        this.name = name
    }
    update(_ctx:Context,_program:Program):void{

    }
}
class Uniform1f extends Uniform {
    value: number
    update(_ctx: Context, program: Program): void {
        program.setUniform1f(this.name, this.value)
    }
    setValue(value: number) {
        this.value = value
    }
}
class Uniform2f extends Uniform {
    x: number
    y: number
    update(_ctx: Context, program: Program): void {
        program.setUniform2f(this.name, this.x, this.y)
    }
    setValue(x: number, y: number) {
        this.x = x
        this.y = y
    }
}
class Uniform3f extends Uniform {
    x: number
    y: number
    z: number
    update(_ctx: Context, program: Program): void {
        program.setUniform3f(this.name, this.x, this.y, this.z)
    }
    setValue(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }
}
class Uniform4f extends Uniform {
    x: number
    y: number
    z: number
    w: number
    update(_ctx: Context, program: Program): void {
        program.setUniform4f(this.name, this.x, this.y, this.z, this.w)
    }
    setValue(x: number, y: number, z: number, w: number) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }
}
class Uniform1i extends Uniform {
    value: number
    update(_ctx: Context, program: Program): void {
        program.setUniform1i(this.name, this.value)
    }
    setValue(value: number) {
        this.value = value
    }
}
class Uniform2i extends Uniform {
    x: number
    y: number
    update(_ctx: Context, program: Program): void {
        program.setUniform2i(this.name, this.x, this.y)
    }
    setValue(x: number, y: number) {
        this.x = x
        this.y = y
    }
}
class Uniform3i extends Uniform {
    x: number
    y: number
    z: number
    update(_ctx: Context, program: Program): void {
        program.setUniform3i(this.name, this.x, this.y, this.z)
    }
    setValue(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }
}
class Uniform4i extends Uniform {
    x: number
    y: number
    z: number
    w: number
    update(_ctx: Context, program: Program): void {
        program.setUniform4i(this.name, this.x, this.y, this.z, this.w)
    }
    setValue(x: number, y: number, z: number, w: number) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }
}
class Uniform2fv extends Uniform {
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniform2fv(this.name, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}
class Uniform3fv extends Uniform {
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniform3fv(this.name, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}
class Uniform4fv extends Uniform {
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniform4fv(this.name, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}
class UniformMat2fv extends Uniform {
    transpose: boolean = false
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniformMat2fv(this.name, this.transpose, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, transpose: boolean = false, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.transpose = transpose
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}
class UniformMat3fv extends Uniform {
    transpose: boolean = false
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniformMat3fv(this.name, this.transpose, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, transpose: boolean = false, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.transpose = transpose
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}
class UniformMat4fv extends Uniform {
    transpose: boolean = false
    value: number[] | Float32Array
    srcOffset?: number
    srcLength?: number
    update(_ctx: Context, program: Program): void {
        program.setUniformMat4fv(this.name, this.transpose, this.value, this.srcOffset, this.srcLength)
    }
    setValue(value: number[] | Float32Array, transpose: boolean = false, srcOffset?: number, srcLength?: number) {
        this.value = value
        this.transpose = transpose
        this.srcOffset = srcOffset
        this.srcLength = srcLength
    }
}

export type {
    IUniform
}
export {
    Uniform,
    Uniform1f,
    Uniform2f,
    Uniform3f,
    Uniform4f,
    Uniform1i,
    Uniform2i,
    Uniform3i,
    Uniform4i,
    Uniform2fv,
    Uniform3fv,
    Uniform4fv,
    UniformMat2fv,
    UniformMat3fv,
    UniformMat4fv,
}
