/**
 * 轻量数学库（零依赖，专为 WebGL 设计）
 *
 * 约定：
 * - Mat4 采用 OpenGL 列主序（column-major），内存布局与 gl.uniformMatrix4fv 直接兼容。
 * - Mat4 通过 Float32Array(16) 存储，避免 GC 压力并可直接交给 WebGL 上传。
 * - 提供链式可变 API（修改自身返回 this），需要副本时显式调用 clone()。
 */

// ---------------------------------------------------------------------------
// Vec2
// ---------------------------------------------------------------------------

export class Vec2 {
    constructor(
        public x = 0,
        public y = 0,
    ) {}

    static fromArray(a: ArrayLike<number>, offset = 0): Vec2 {
        return new Vec2(a[offset], a[offset + 1]);
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    copy(v: Vec2): this {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    add(v: Vec2): this {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: Vec2): this {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        return this;
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSq());
    }

    normalize(): this {
        const len = this.length();
        if (len > 1e-8) {
            this.x /= len;
            this.y /= len;
        }
        return this;
    }

    /** 写入数组（返回同一数组便于内联） */
    toArray(out: number[] = [], offset = 0): number[] {
        out[offset] = this.x;
        out[offset + 1] = this.y;
        return out;
    }
}

// ---------------------------------------------------------------------------
// Vec3
// ---------------------------------------------------------------------------

export class Vec3 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}

    static fromArray(a: ArrayLike<number>, offset = 0): Vec3 {
        return new Vec3(a[offset], a[offset + 1], a[offset + 2]);
    }

    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(v: Vec3): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    add(v: Vec3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    sub(v: Vec3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    /** this = a + b * t（线性插值，供轨道控制器使用） */
    addScaled(a: Vec3, b: Vec3, t: number): this {
        this.x = a.x + b.x * t;
        this.y = a.y + b.y * t;
        this.z = a.z + b.z * t;
        return this;
    }

    dot(v: Vec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v: Vec3): this {
        const { x, y, z } = this;
        this.x = y * v.z - z * v.y;
        this.y = z * v.x - x * v.z;
        this.z = x * v.y - y * v.x;
        return this;
    }

    lengthSq(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length(): number {
        return Math.sqrt(this.lengthSq());
    }

    normalize(): this {
        const len = this.length();
        if (len > 1e-8) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    /** 将向量乘以 mat4（相当于扩展 w=1 变换后的 xyz/w） */
    applyMat4(m: Mat4): this {
        const e = m.e;
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = e[3] * x + e[7] * y + e[11] * z + e[15];
        this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) / w;
        this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w;
        this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) / w;
        return this;
    }

    /** 仅应用 mat4 的 3x3 部分（用于变换方向向量，不含平移） */
    applyMat4Dir(m: Mat4): this {
        const e = m.e;
        const x = this.x;
        const y = this.y;
        const z = this.z;
        this.x = e[0] * x + e[4] * y + e[8] * z;
        this.y = e[1] * x + e[5] * y + e[9] * z;
        this.z = e[2] * x + e[6] * y + e[10] * z;
        return this;
    }

    toArray(out: number[] = [], offset = 0): number[] {
        out[offset] = this.x;
        out[offset + 1] = this.y;
        out[offset + 2] = this.z;
        return out;
    }
}

// ---------------------------------------------------------------------------
// Vec4（主要承载 RGBA 颜色或齐次坐标）
// ---------------------------------------------------------------------------

export class Vec4 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
        public w = 1,
    ) {}

    clone(): Vec4 {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    set(x: number, y: number, z: number, w = 1): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    toArray(out: number[] = [], offset = 0): number[] {
        out[offset] = this.x;
        out[offset + 1] = this.y;
        out[offset + 2] = this.z;
        out[offset + 3] = this.w;
        return out;
    }
}

// ---------------------------------------------------------------------------
// Mat4 —— 列主序
// ---------------------------------------------------------------------------

export class Mat4 {
    /** 列主序 16 元素 */
    e: Float32Array;

    constructor(e?: Float32Array | number[] | ArrayLike<number>) {
        this.e = new Float32Array(16);
        if (e) this.e.set(e as Float32Array | number[], 0);
        else this.e[0] = this.e[5] = this.e[10] = this.e[15] = 1;
    }

    static identity(): Mat4 {
        return new Mat4();
    }

    static fromArray(a: Float32Array | number[] | ArrayLike<number>): Mat4 {
        return new Mat4(a);
    }

    /** 逐元素读取，等价于 this.e[index] */
    at(i: number): number {
        return this.e[i];
    }

    setIdentity(): this {
        this.e.fill(0);
        this.e[0] = this.e[5] = this.e[10] = this.e[15] = 1;
        return this;
    }

    clone(): Mat4 {
        return new Mat4(this.e);
    }

    copy(m: Mat4): this {
        this.e.set(m.e);
        return this;
    }

    /**
     * 原地矩阵乘法：this = this * m
     * 注意与 OpenGL 一致，先应用的变换放在右侧。
     */
    multiply(m: Mat4): this {
        mulMat4(this.e, m.e, this.e);
        return this;
    }

    static multiply(a: Mat4, b: Mat4): Mat4 {
        const out = new Mat4();
        mulMat4(a.e, b.e, out.e);
        return out;
    }

    /** 返回世界→视口完整变换的矩阵乘法便捷封装 */
    static multiply3(a: Mat4, b: Mat4, c: Mat4): Mat4 {
        const tmp = mulMat4(a.e, b.e);
        const out = new Mat4();
        mulMat4(tmp, c.e, out.e);
        return out;
    }

    // ---- 基础构造 ----------------------------------------------------------

    static perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
        const out = new Mat4();
        const f = 1 / Math.tan(fovy * 0.5);
        const nf = 1 / (near - far);
        const e = out.e;
        e.fill(0);
        e[0] = f / aspect;
        e[5] = f;
        e[10] = (far + near) * nf;
        e[11] = -1;
        e[14] = 2 * far * near * nf;
        return out;
    }

    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
        const out = new Mat4();
        const e = out.e;
        e.fill(0);
        e[0] = 2 / (right - left);
        e[5] = 2 / (top - bottom);
        e[10] = -2 / (far - near);
        e[12] = -(right + left) / (right - left);
        e[13] = -(top + bottom) / (top - bottom);
        e[14] = -(far + near) / (far - near);
        e[15] = 1;
        return out;
    }

    /** 右手系 lookAt */
    static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4 {
        const out = new Mat4();
        const f = new Vec3().copy(center).sub(eye).normalize();
        const s = new Vec3().copy(f).cross(up).normalize();
        const u = new Vec3().copy(s).cross(f);
        const e = out.e;
        e.fill(0);
        e[0] = s.x;
        e[1] = u.x;
        e[2] = -f.x;
        e[4] = s.y;
        e[5] = u.y;
        e[6] = -f.y;
        e[8] = s.z;
        e[9] = u.z;
        e[10] = -f.z;
        e[12] = -s.dot(eye);
        e[13] = -u.dot(eye);
        e[14] = f.dot(eye);
        e[15] = 1;
        return out;
    }

    static translation(x: number, y: number, z: number): Mat4 {
        const out = new Mat4();
        const e = out.e;
        e[12] = x;
        e[13] = y;
        e[14] = z;
        return out;
    }

    static rotationX(rad: number): Mat4 {
        const out = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const e = out.e;
        e[5] = c;
        e[6] = s;
        e[9] = -s;
        e[10] = c;
        return out;
    }

    static rotationY(rad: number): Mat4 {
        const out = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const e = out.e;
        e[0] = c;
        e[2] = -s;
        e[8] = s;
        e[10] = c;
        return out;
    }

    static rotationZ(rad: number): Mat4 {
        const out = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const e = out.e;
        e[0] = c;
        e[1] = s;
        e[4] = -s;
        e[5] = c;
        return out;
    }

    static rotationAxis(axis: Vec3, rad: number): Mat4 {
        const out = new Mat4();
        const a = axis.clone().normalize();
        const { x, y, z } = a;
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const t = 1 - c;
        const e = out.e;
        e[0] = t * x * x + c;
        e[1] = t * x * y + s * z;
        e[2] = t * x * z - s * y;
        e[4] = t * x * y - s * z;
        e[5] = t * y * y + c;
        e[6] = t * y * z + s * x;
        e[8] = t * x * z + s * y;
        e[9] = t * y * z - s * x;
        e[10] = t * z * z + c;
        return out;
    }

    static scale(x: number, y: number, z: number): Mat4 {
        const out = new Mat4();
        const e = out.e;
        e[0] = x;
        e[5] = y;
        e[10] = z;
        return out;
    }

    /** TRS 组合（顺序：scale -> rotate -> translate），一次生成完整模型矩阵 */
    static compose(
        position: Vec3,
        quaternion: { x: number; y: number; z: number; w: number } | null,
        scale: Vec3,
    ): Mat4 {
        const m = Mat4.scale(scale.x, scale.y, scale.z);
        if (quaternion) {
            const q = quaternion;
            const x2 = q.x + q.x;
            const y2 = q.y + q.y;
            const z2 = q.z + q.z;
            const xx = q.x * x2;
            const xy = q.x * y2;
            const xz = q.x * z2;
            const yy = q.y * y2;
            const yz = q.y * z2;
            const zz = q.z * z2;
            const wx = q.w * x2;
            const wy = q.w * y2;
            const wz = q.w * z2;
            const e = m.e;
            const sx = scale.x;
            const sy = scale.y;
            const sz = scale.z;
            e[0] = (1 - (yy + zz)) * sx;
            e[1] = (xy + wz) * sx;
            e[2] = (xz - wy) * sx;
            e[4] = (xy - wz) * sy;
            e[5] = (1 - (xx + zz)) * sy;
            e[6] = (yz + wx) * sy;
            e[8] = (xz + wy) * sz;
            e[9] = (yz - wx) * sz;
            e[10] = (1 - (xx + yy)) * sz;
        }
        m.e[12] = position.x;
        m.e[13] = position.y;
        m.e[14] = position.z;
        return m;
    }

    // ---- 原地链式变换（this = this * T） ----------------------------------

    translate(x: number, y: number, z: number): this {
        const e = this.e;
        e[12] += e[0] * x + e[4] * y + e[8] * z;
        e[13] += e[1] * x + e[5] * y + e[9] * z;
        e[14] += e[2] * x + e[6] * y + e[10] * z;
        return this;
    }

    rotateX(rad: number): this {
        return this.multiply(Mat4.rotationX(rad));
    }

    rotateY(rad: number): this {
        return this.multiply(Mat4.rotationY(rad));
    }

    rotateZ(rad: number): this {
        return this.multiply(Mat4.rotationZ(rad));
    }

    scaleSelf(sx: number, sy: number, sz: number): this {
        return this.multiply(Mat4.scale(sx, sy, sz));
    }

    /** 返回此矩阵的逆（新对象） */
    invert(): Mat4 {
        const out = new Mat4(this.e);
        invertMat4(out.e);
        return out;
    }

    /** 原地求逆，失败（行列式为 0）时保持原值并返回 false */
    invertSelf(): boolean {
        return invertMat4(this.e);
    }

    /**
     * 法线矩阵：modelView 左上 3x3 的逆转置。
     * 返回列主序 9 元素 Float32Array，可直接交给 uniformMatrix3fv。
     */
    normalMatrix3(): Float32Array {
        return normalMat3FromMat4(this.e);
    }

    /** 归一化 mat4（防止浮点累计误差），返回 this */
    normalizeMatrix(): this {
        const e = this.e;
        const w = Math.sqrt(e[3] * e[3] + e[7] * e[7] + e[11] * e[11] + e[15] * e[15]);
        if (w > 1e-8 && w !== 1) {
            for (let i = 0; i < 16; i++) e[i] /= w;
        }
        return this;
    }

    toArray(out?: Float32Array): Float32Array {
        const target = out ?? new Float32Array(16);
        target.set(this.e);
        return target;
    }
}

// ---------------------------------------------------------------------------
// 底层实现（函数声明提升，可安全地在 class 之前被引用）
// ---------------------------------------------------------------------------

/** a * b（列主序），result 为空时新建 Float32Array；result 可与 a 或 b 相同 */
function mulMat4(a: Float32Array, b: Float32Array, result?: Float32Array): Float32Array {
    const out = result ?? new Float32Array(16);
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    const a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    const a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    const a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
    for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4];
        const b1 = b[c * 4 + 1];
        const b2 = b[c * 4 + 2];
        const b3 = b[c * 4 + 3];
        out[c * 4] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3;
        out[c * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
        out[c * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3;
        out[c * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
    }
    return out;
}

/** 原地 4x4 求逆；行列式过小时返回 false 并保持矩阵不变 */
function invertMat4(m: Float32Array): boolean {
    const a00 = m[0],
        a01 = m[1],
        a02 = m[2],
        a03 = m[3];
    const a10 = m[4],
        a11 = m[5],
        a12 = m[6],
        a13 = m[7];
    const a20 = m[8],
        a21 = m[9],
        a22 = m[10],
        a23 = m[11];
    const a30 = m[12],
        a31 = m[13],
        a32 = m[14],
        a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (Math.abs(det) < 1e-12) return false;
    det = 1 / det;

    m[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    m[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    m[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    m[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    m[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    m[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    m[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    m[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    m[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    m[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    m[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    m[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    m[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    m[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    m[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    m[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return true;
}

/**
 * 从 mat4 的左上 3x3 提取“逆转置”法线矩阵（列主序 9 元素）。
 * 内部自动处理退化情况：若 3x3 不可逆则退回转置。
 */
function normalMat3FromMat4(m: Float32Array): Float32Array {
    const a00 = m[0],
        a01 = m[1],
        a02 = m[2];
    const a10 = m[4],
        a11 = m[5],
        a12 = m[6];
    const a20 = m[8],
        a21 = m[9],
        a22 = m[10];

    const det = a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20);
    const out = new Float32Array(9);
    if (Math.abs(det) < 1e-12) {
        // 退化为转置，避免 NaN
        out[0] = a00;
        out[1] = a10;
        out[2] = a20;
        out[3] = a01;
        out[4] = a11;
        out[5] = a21;
        out[6] = a02;
        out[7] = a12;
        out[8] = a22;
        return out;
    }
    const inv = 1 / det;
    // 先求伴随阵（即余子式矩阵的转置），其本身就是逆的转置，即为“逆转置”
    const i00 = (a11 * a22 - a12 * a21) * inv;
    const i01 = (a02 * a21 - a01 * a22) * inv;
    const i02 = (a01 * a12 - a02 * a11) * inv;
    const i10 = (a12 * a20 - a10 * a22) * inv;
    const i11 = (a00 * a22 - a02 * a20) * inv;
    const i12 = (a02 * a10 - a00 * a12) * inv;
    const i20 = (a10 * a21 - a11 * a20) * inv;
    const i21 = (a01 * a20 - a00 * a21) * inv;
    const i22 = (a00 * a11 - a01 * a10) * inv;
    out[0] = i00;
    out[1] = i10;
    out[2] = i20;
    out[3] = i01;
    out[4] = i11;
    out[5] = i21;
    out[6] = i02;
    out[7] = i12;
    out[8] = i22;
    return out;
}