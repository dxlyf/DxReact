import { Vector3 } from './Vector3'
import * as MathUtils from '../../utils/MathUtils'

/**
 * 球面坐标
 *
 * 以半径、极角（phi，从 +Y 轴起）与方位角（theta，从 +Z 轴起）表示三维点。
 */
export class Spherical {
    /** 半径 */
    radius: number
    /** 极角（phi，0 表示 +Y 方向，PI 表示 -Y 方向） */
    phi: number
    /** 方位角（theta） */
    theta: number

    constructor(radius = 1, phi = 0, theta = 0) {
        this.radius = radius
        this.phi = phi
        this.theta = theta
    }

    /** 由直角坐标设置 */
    setFromVector3(v: Vector3): this {
        this.radius = v.length()
        if (this.radius === 0) {
            this.phi = 0
            this.theta = 0
        } else {
            this.phi = Math.acos(MathUtils.clamp(v.y / this.radius, -1, 1))
            this.theta = Math.atan2(v.x, v.z)
        }
        return this
    }

    /** 转直角坐标 */
    toVector3(out?: Vector3): Vector3 {
        const sinPhi = Math.sin(this.phi)
        const x = this.radius * sinPhi * Math.sin(this.theta)
        const y = this.radius * Math.cos(this.phi)
        const z = this.radius * sinPhi * Math.cos(this.theta)
        if (out) return out.set(x, y, z)
        return new Vector3(x, y, z)
    }

    /** 限制极角范围（防止翻转） */
    makeSafe(): this {
        const EPS = 0.000001
        this.phi = MathUtils.clamp(this.phi, EPS, Math.PI - EPS)
        return this
    }

    /** 球面上围绕中心的方位偏移 */
    setFromPoints(center: Vector3, p: Vector3): this {
        return this.setFromVector3(p.sub(center))
    }

    copy(s: Spherical): this {
        this.radius = s.radius; this.phi = s.phi; this.theta = s.theta
        return this
    }

    clone(): Spherical {
        return new Spherical(this.radius, this.phi, this.theta)
    }

    equals(s: Spherical, epsilon = 0): boolean {
        return (
            Math.abs(this.radius - s.radius) <= epsilon &&
            Math.abs(this.phi - s.phi) <= epsilon &&
            Math.abs(this.theta - s.theta) <= epsilon
        )
    }

    toString(): string {
        return `Spherical(radius=${this.radius}, phi=${this.phi}, theta=${this.theta})`
    }
}
