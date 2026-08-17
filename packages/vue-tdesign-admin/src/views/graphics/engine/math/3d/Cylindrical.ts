import { Vector3 } from './Vector3'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 圆柱体坐标
 *
 * 以半径、角度（theta）与高度（y）表示三维点。
 */
export class Cylindrical {
    /** 半径 */
    radius: number
    /** 方位角（theta） */
    theta: number
    /** 高度（y） */
    y: number

    constructor(radius = 1, theta = 0, y = 0) {
        this.radius = radius
        this.theta = theta
        this.y = y
    }

    /** 由直角坐标设置 */
    setFromVector3(v: Vector3): this {
        this.radius = Math.hypot(v.x, v.z)
        this.theta = Math.atan2(v.x, v.z)
        this.y = v.y
        return this
    }

    /** 转直角坐标 */
    toVector3(out?: Vector3): Vector3 {
        const x = this.radius * Math.sin(this.theta)
        const y = this.y
        const z = this.radius * Math.cos(this.theta)
        if (out) return out.set(x, y, z)
        return new Vector3(x, y, z)
    }

    /** 限制角度范围 */
    clampTheta(min: number, max: number): this {
        this.theta = MathUtils.clamp(this.theta, min, max)
        return this
    }

    copy(c: Cylindrical): this {
        this.radius = c.radius; this.theta = c.theta; this.y = c.y
        return this
    }

    clone(): Cylindrical {
        return new Cylindrical(this.radius, this.theta, this.y)
    }

    equals(c: Cylindrical, epsilon = 0): boolean {
        return (
            Math.abs(this.radius - c.radius) <= epsilon &&
            Math.abs(this.theta - c.theta) <= epsilon &&
            Math.abs(this.y - c.y) <= epsilon
        )
    }

    toString(): string {
        return `Cylindrical(radius=${this.radius}, theta=${this.theta}, y=${this.y})`
    }
}
