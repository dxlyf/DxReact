/**
 * Canvas2D CPU 渲染器 —— 2D 数学库。
 *
 * 与 webgl/webgpu 不同：Canvas 2D 只使用 2D 仿射变换（无透视、无 NDC），
 * 用户坐标 → 设备坐标 直接由 3x3 仿射矩阵完成：
 *   | a  c  e |   | x |   | x' |
 *   | b  d  f | · | y | = | y' |
 *   | 0  0  1 |   | 1 |   | 1  |
 * a/b/c/d 为线性部分（旋转/缩放/倾斜），e/f 为平移。
 */

/** 2D 仿射变换矩阵（列主序存储于 3x3 的 a~f 字段，与 gl-matrix 的 mat2d 布局一致） */
export class Mat2D {
    constructor(
        public a = 1,
        public b = 0,
        public c = 0,
        public d = 1,
        public e = 0,
        public f = 0,
    ) { }

    clone(): Mat2D {
        return new Mat2D(this.a, this.b, this.c, this.d, this.e, this.f)
    }

    static identity(): Mat2D {
        return new Mat2D()
    }

    /** 矩阵乘法：this = this * m（先应用 this，再应用 m，与 canvas 的 transform 语义一致） */
    multiply(m: Mat2D): this {
        const a = this.a, b = this.b, c = this.c, d = this.d, e = this.e, f = this.f
        this.a = a * m.a + c * m.b
        this.b = b * m.a + d * m.b
        this.c = a * m.c + c * m.d
        this.d = b * m.c + d * m.d
        this.e = a * m.e + c * m.f + e
        this.f = b * m.e + d * m.f + f
        return this
    }

    /** 平移：this = this * T(tx, ty) */
    translate(tx: number, ty: number): this {
        return this.multiply(new Mat2D(1, 0, 0, 1, tx, ty))
    }

    /** 旋转（弧度，顺时针为正，因为 y 轴向下）：this = this * R(rad) */
    rotate(rad: number): this {
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        return this.multiply(new Mat2D(cos, sin, -sin, cos, 0, 0))
    }

    /** 缩放：this = this * S(sx, sy) */
    scale(sx: number, sy: number): this {
        return this.multiply(new Mat2D(sx, 0, 0, sy, 0, 0))
    }

    /** 变换点（用户坐标 → 设备坐标） */
    transformPoint(x: number, y: number): [number, number] {
        return [
            this.a * x + this.c * y + this.e,
            this.b * x + this.d * y + this.f,
        ]
    }

    /** 逆矩阵（用于 drawImage 的像素级逆采样；奇异矩阵返回 null） */
    invert(): Mat2D | null {
        const { a, b, c, d, e, f } = this
        const det = a * d - b * c
        if (Math.abs(det) < 1e-12) return null
        const id = 1 / det
        return new Mat2D(
            d * id,
            -b * id,
            -c * id,
            a * id,
            (c * f - e * d) * id,
            -(a * f - e * b) * id,
        )
    }
}
