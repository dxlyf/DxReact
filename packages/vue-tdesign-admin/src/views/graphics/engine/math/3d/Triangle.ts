import { Vector3 } from './Vector3'
import { Matrix4 } from './Matrix4'
import { Plane } from './Plane'
import { Box3 } from './Box3'

/**
 * 三维三角形
 */
export class Triangle {
    a: Vector3
    b: Vector3
    c: Vector3

    constructor(a = new Vector3(), b = new Vector3(), c = new Vector3()) {
        this.a = a
        this.b = b
        this.c = c
    }

    static fromPoints(a: Vector3, b: Vector3, c: Vector3): Triangle {
        return new Triangle(a.clone(), b.clone(), c.clone())
    }

    get normal(): Vector3 {
        return this.b.sub(this.a).cross(this.c.sub(this.a)).normalize()
    }

    /** 平面表示（法向量朝 b×c 方向） */
    get plane(): Plane {
        const n = this.normal
        return new Plane(n, -n.dot(this.a))
    }

    /** 质心 */
    get centroid(): Vector3 {
        return this.a.add(this.b).add(this.c).scale(1 / 3)
    }

    /** 面积（无符号） */
    area(): number {
        return this.b.sub(this.a).cross(this.c.sub(this.a)).length() / 2
    }

    /** 包围盒 */
    getBounds(): Box3 {
        return Box3.fromPoints([this.a, this.b, this.c])
    }

    /** 点与三角形的最近点 */
    closestPointToPoint(p: Vector3): Vector3 {
        const ab = this.b.sub(this.a)
        const ac = this.c.sub(this.a)
        const ap = p.sub(this.a)

        // 重心坐标裁剪到三角形内
        let d1 = ab.dot(ap)
        let d2 = ac.dot(ap)
        if (d1 <= 0 && d2 <= 0) return this.a.clone()

        const bp = p.sub(this.b)
        const d3 = ab.dot(bp)
        const d4 = ac.dot(bp)
        if (d3 >= 0 && d4 <= d3) return this.b.clone()

        const vc = d1 * d4 - d3 * d2
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3)
            return this.a.addScaled(ab, v)
        }

        const cp = p.sub(this.c)
        const d5 = ab.dot(cp)
        const d6 = ac.dot(cp)
        if (d6 >= 0 && d5 <= d6) return this.c.clone()

        const vb = d5 * d2 - d1 * d6
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6)
            return this.a.addScaled(ac, w)
        }

        const va = d3 * d6 - d5 * d4
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const w = (d4 - d3) / (d4 - d3 + (d5 - d6))
            return this.b.addScaled(this.c.sub(this.b), w)
        }

        // 点在三角形内：投影到平面
        const n = ab.cross(ac)
        const denom = n.dot(n)
        const u = n.dot(this.c.sub(this.a).cross(p.sub(this.a))) / denom
        const v = n.dot(this.a.sub(this.b).cross(p.sub(this.b))) / denom
        const w = 1 - u - v
        return this.a.scale(w).add(this.b.scale(u)).add(this.c.scale(v))
    }

    /** 是否包含点（投影到平面后重心坐标判断） */
    containsPoint(p: Vector3): boolean {
        const closest = this.closestPointToPoint(p)
        return closest.distanceToSq(p) < 1e-10
    }

    /** 与射线相交（调用 Ray 的实现） */
    intersectRay(origin: Vector3, dir: Vector3, backfaceCulling = false): number | null {
        const ab = this.b.sub(this.a)
        const ac = this.c.sub(this.a)
        const pvec = dir.cross(ac)
        const det = ab.dot(pvec)
        if (backfaceCulling && det < 1e-9) return null
        if (Math.abs(det) < 1e-9) return null
        const invDet = 1 / det
        const tvec = origin.sub(this.a)
        const u = tvec.dot(pvec) * invDet
        if (u < 0 || u > 1) return null
        const qvec = tvec.cross(ab)
        const v = dir.dot(qvec) * invDet
        if (v < 0 || u + v > 1) return null
        return ac.dot(qvec) * invDet
    }

    /** 应用变换 */
    applyMatrix4(m: Matrix4): Triangle {
        return new Triangle(
            m.applyToVector3(this.a),
            m.applyToVector3(this.b),
            m.applyToVector3(this.c),
        )
    }

    clone(): Triangle {
        return new Triangle(this.a.clone(), this.b.clone(), this.c.clone())
    }

    toString(): string {
        return `Triangle(${this.a}, ${this.b}, ${this.c})`
    }
}
