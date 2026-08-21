/**
 * CPU 光栅化系统 —— 数学库。
 * 提供 2D/3D 向量与 4x4 矩阵（列主序，与 WebGL/gl-matrix 一致）。
 */

export class Vec2 {
    constructor(
        public x = 0,
        public y = 0,
    ) {}
    clone(): Vec2 {
        return new Vec2(this.x, this.y)
    }
    set(x: number, y: number): this {
        this.x = x
        this.y = y
        return this
    }
    add(v: Vec2): this {
        this.x += v.x
        this.y += v.y
        return this
    }
    sub(v: Vec2): this {
        this.x -= v.x
        this.y -= v.y
        return this
    }
    scale(s: number): this {
        this.x *= s
        this.y *= s
        return this
    }
    length(): number {
        return Math.hypot(this.x, this.y)
    }
    toArray(): [number, number] {
        return [this.x, this.y]
    }
}

export class Vec3 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}
    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z)
    }
    add(v: Vec3): this {
        this.x += v.x
        this.y += v.y
        this.z += v.z
        return this
    }
    sub(v: Vec3): this {
        this.x -= v.x
        this.y -= v.y
        this.z -= v.z
        return this
    }
    scale(s: number): this {
        this.x *= s
        this.y *= s
        this.z *= s
        return this
    }
    dot(v: Vec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z
    }
    cross(v: Vec3): Vec3 {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
        )
    }
    normalize(): this {
        const len = this.length()
        if (len > 0) this.scale(1 / len)
        return this
    }
    length(): number {
        return Math.hypot(this.x, this.y, this.z)
    }
    toArray(): [number, number, number] {
        return [this.x, this.y, this.z]
    }
}

/** 齐次向量（w 通常为 1） */
export class Vec4 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
        public w = 1,
    ) {}
    clone(): Vec4 {
        return new Vec4(this.x, this.y, this.z, this.w)
    }
    /** 透视除法，得到 NDC 坐标（xyz ∈ [-1,1]） */
    perspectiveDivide(): Vec3 {
        const invW = this.w !== 0 ? 1 / this.w : 0
        return new Vec3(this.x * invW, this.y * invW, this.z * invW)
    }
    toArray(): [number, number, number, number] {
        return [this.x, this.y, this.z, this.w]
    }
}

/** 4x4 矩阵，列主序存储（16 个 float，m[col*4+row]） */
export class Mat4 {
    m: Float32Array

    constructor(m?: ArrayLike<number>) {
        this.m = new Float32Array(16)
        if (m) this.m.set(m)
        else this.identity()
    }

    clone(): Mat4 {
        return new Mat4(this.m)
    }

    identity(): this {
        this.m.fill(0)
        this.m[0] = this.m[5] = this.m[10] = this.m[15] = 1
        return this
    }

    /** 矩阵乘法：this = this * other */
    multiply(other: Mat4): this {
        const a = this.m
        const b = other.m
        const out = new Float32Array(16)
        for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
                let sum = 0
                for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k]
                out[c * 4 + r] = sum
            }
        }
        this.m = out
        return this
    }

    /** 变换齐次向量 v（列向量）：v' = M * v */
    transformVec4(v: Vec4): Vec4 {
        const m = this.m
        const x = m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w
        const y = m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w
        const z = m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w
        const w = m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w
        return new Vec4(x, y, z, w)
    }

    /** 变换点（w=1） */
    transformPoint(v: Vec3): Vec3 {
        return this.transformVec4(new Vec4(v.x, v.y, v.z, 1)).perspectiveDivide()
    }

    static identity(): Mat4 {
        return new Mat4()
    }

    static multiply(a: Mat4, b: Mat4): Mat4 {
        return a.clone().multiply(b)
    }

    /** 透视投影矩阵（fovy 弧度，aspect=宽/高，z∈[near,far] 映射到 NDC [-1,1]） */
    static perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
        const f = 1 / Math.tan(fovy / 2)
        const nf = 1 / (near - far)
        const m = new Float32Array(16)
        m[0] = f / aspect
        m[5] = f
        m[10] = (far + near) * nf
        m[11] = -1
        m[14] = 2 * far * near * nf
        return new Mat4(m)
    }

    /** 正交投影矩阵（左手、屏幕左上原点风格由视口变换处理） */
    static ortho(left: number, right: number, bottom: number, top: number, near = -1, far = 1): Mat4 {
        const lr = 1 / (left - right)
        const bt = 1 / (bottom - top)
        const nf = 1 / (near - far)
        const m = new Float32Array(16)
        m[0] = -2 * lr
        m[5] = -2 * bt
        m[10] = 2 * nf
        m[12] = (left + right) * lr
        m[13] = (top + bottom) * bt
        m[14] = (far + near) * nf
        m[15] = 1
        return new Mat4(m)
    }

    /** 平移矩阵 */
    static translation(x: number, y: number, z = 0): Mat4 {
        const m = new Float32Array(16)
        m[0] = m[5] = m[10] = m[15] = 1
        m[12] = x
        m[13] = y
        m[14] = z
        return new Mat4(m)
    }
}
