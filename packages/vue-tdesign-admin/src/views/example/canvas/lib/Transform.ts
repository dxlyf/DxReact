import { Matrix2D } from "./Matrix2D"
import { Vector2Like } from "./Vector2"

export class Transform {
    /** 本地变换矩阵 */
    _matrix: Matrix2D = new Matrix2D()
    /** 世界变换矩阵（缓存） */
    _worldMatrix: Matrix2D = new Matrix2D()
    /** 世界变换矩阵的逆矩阵（缓存） */
    _worldMatrixInvert: Matrix2D = new Matrix2D()

    /** 本地版本号，每次本地矩阵变化时递增 */
    _version: number = 0
    /** 上次计算世界矩阵时父级的版本号 */
    _parentWorldVersion: number = 0
    /** 世界矩阵是否需要重新计算 */
    _worldDirty: boolean = true
    /** 逆矩阵是否需要重新计算 */
    _invertDirty: boolean = true

    /** 父级 Transform */
    parent: Transform | null = null

    private _markDirty() {
        this._version++
        this._worldDirty = true
        this._invertDirty = true
    }

    // ==================== 本地矩阵操作 ====================

    /** 重置为单位矩阵 */
    identity(): this {
        this._matrix.identity()
        this._markDirty()
        return this
    }

    /** 设置矩阵分量的值 */
    set(a: number, b: number, c: number, d: number, tx: number, ty: number): this {
        this._matrix.fromValues(a, b, c, d, tx, ty)
        this._markDirty()
        return this
    }

    /** 从另一个矩阵复制 */
    copy(matrix: Matrix2D): this {
        this._matrix.fromValues(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5])
        this._markDirty()
        return this
    }

    /** 平移 */
    translate(tx: number, ty: number): this {
        this._matrix.translate(tx, ty)
        this._markDirty()
        return this
    }

    /** 缩放 */
    scale(sx: number, sy: number): this {
        this._matrix.scale(sx, sy)
        this._markDirty()
        return this
    }

    /** 旋转（弧度） */
    rotate(angle: number): this {
        this._matrix.rotate(angle)
        this._markDirty()
        return this
    }

    /** 设置位置（平移分量） */
    setPosition(x: number, y: number): this {
        this._matrix[4] = x
        this._matrix[5] = y
        this._markDirty()
        return this
    }

    /** 设置旋转（重置旋转分量为给定角度） */
    setRotation(angle: number): this {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        this._matrix[0] = cos
        this._matrix[1] = sin
        this._matrix[2] = -sin
        this._matrix[3] = cos
        this._markDirty()
        return this
    }

    /** 设置缩放（重置缩放分量为给定值） */
    setScale(sx: number, sy: number): this {
        const angle = Math.atan2(this._matrix[1], this._matrix[0])
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        this._matrix[0] = sx * cos
        this._matrix[1] = sx * sin
        this._matrix[2] = -sy * sin
        this._matrix[3] = sy * cos
        this._markDirty()
        return this
    }

    // ==================== 世界矩阵 ====================

    /**
     * 更新世界矩阵（如果 dirty 则重新计算）
     * 返回是否发生了变化
     */
    updateWorldMatrix(parentWorldVersion?: number): boolean {
        if (!this._worldDirty && (!this.parent || this._parentWorldVersion === (parentWorldVersion ?? this.parent._version))) {
            return false
        }

        if (this.parent) {
            const pw = this.parent._worldMatrix
            const m = this._matrix
            const w = this._worldMatrix
            // w = parent * local
            w[0] = pw[0] * m[0] + pw[2] * m[1]
            w[1] = pw[1] * m[0] + pw[3] * m[1]
            w[2] = pw[0] * m[2] + pw[2] * m[3]
            w[3] = pw[1] * m[2] + pw[3] * m[3]
            w[4] = pw[0] * m[4] + pw[2] * m[5] + pw[4]
            w[5] = pw[1] * m[4] + pw[3] * m[5] + pw[5]
            this._parentWorldVersion = this.parent._version
        } else {
            this._worldMatrix.fromValues(
                this._matrix[0], this._matrix[1],
                this._matrix[2], this._matrix[3],
                this._matrix[4], this._matrix[5],
            )
        }

        this._worldDirty = false
        this._invertDirty = true
        return true
    }

    /** 获取世界矩阵（自动计算缓存） */
    get worldMatrix(): Matrix2D {
        this.updateWorldMatrix()
        return this._worldMatrix
    }

    /** 获取世界矩阵的逆矩阵（自动计算缓存） */
    get worldMatrixInvert(): Matrix2D {
        if (this._invertDirty) {
            const m = this.worldMatrix
            const inv = this._worldMatrixInvert
            const det = m[0] * m[3] - m[1] * m[2]
            if (det !== 0) {
                const invDet = 1 / det
                inv[0] = m[3] * invDet
                inv[1] = -m[1] * invDet
                inv[2] = -m[2] * invDet
                inv[3] = m[0] * invDet
                inv[4] = (m[2] * m[5] - m[3] * m[4]) * invDet
                inv[5] = (m[1] * m[4] - m[0] * m[5]) * invDet
            } else {
                inv.identity()
            }
            this._invertDirty = false
        }
        return this._worldMatrixInvert
    }

    /** 获取本地矩阵 */
    get matrix(): Matrix2D {
        return this._matrix
    }

    /** 本地版本号 */
    get version(): number {
        return this._version
    }

    // ==================== 坐标系转换 ====================

    /** 将本地坐标转为世界坐标（原地修改） */
    localToWorld(out: Vector2Like, local: Vector2Like): Vector2Like {
        const m = this.worldMatrix
        const x = local.x * m[0] + local.y * m[2] + m[4]
        const y = local.x * m[1] + local.y * m[3] + m[5]
        out.x = x
        out.y = y
        return out
    }

    /** 将世界坐标转为本地坐标（原地修改） */
    worldToLocal(out: Vector2Like, world: Vector2Like): Vector2Like {
        const inv = this.worldMatrixInvert
        const x = world.x * inv[0] + world.y * inv[2] + inv[4]
        const y = world.x * inv[1] + world.y * inv[3] + inv[5]
        out.x = x
        out.y = y
        return out
    }

    /** 克隆当前 Transform */
    clone(): Transform {
        const t = new Transform()
        t._matrix.fromValues(
            this._matrix[0], this._matrix[1],
            this._matrix[2], this._matrix[3],
            this._matrix[4], this._matrix[5],
        )
        t.parent = this.parent
        t._markDirty()
        return t
    }
}
