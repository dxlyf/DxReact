import { Vector3 } from './Vector3'
import { Box3 } from './Box3'
import { Plane } from './Plane'
import { Sphere } from './Sphere'
import { Matrix4 } from './Matrix4'

/**
 * 视锥体
 *
 * 由 6 个平面（左右上下远近）定义，用于视锥剔除。
 * 约定：平面法线朝外，视锥内点的距离 < 0。
 */
export class Frustum {
    planes: Plane[]

    constructor(planes?: Plane[]) {
        this.planes = planes ?? [
            new Plane(new Vector3(1, 0, 0), 0),
            new Plane(new Vector3(-1, 0, 0), 0),
            new Plane(new Vector3(0, 1, 0), 0),
            new Plane(new Vector3(0, -1, 0), 0),
            new Plane(new Vector3(0, 0, 1), 0),
            new Plane(new Vector3(0, 0, -1), 0),
        ]
    }

    /** 由投影×视图矩阵提取视锥体平面（Gribb–Hartmann 方法） */
    setFromProjectionMatrix(m: Matrix4): this {
        const e = m.elements
        // 行（投影矩阵按行读取）
        const r0 = [e[0], e[4], e[8], e[12]]
        const r1 = [e[1], e[5], e[9], e[13]]
        const r2 = [e[2], e[6], e[10], e[14]]
        const r3 = [e[3], e[7], e[11], e[15]]

        const setPlane = (index: number, a: number, b: number, c: number, d: number) => {
            const p = this.planes[index]
            p.normal.set(a, b, c)
            p.constant = d
            p.normalize()
        }

        // 左/右/下/上/近/远（平面组合）
        setPlane(0, r3[3] + r0[3], r3[0] + r0[0], r3[1] + r0[1], r3[2] + r0[2]) // left
        setPlane(1, r3[3] - r0[3], r3[0] - r0[0], r3[1] - r0[1], r3[2] - r0[2]) // right
        setPlane(2, r3[3] + r1[3], r3[0] + r1[0], r3[1] + r1[1], r3[2] + r1[2]) // bottom
        setPlane(3, r3[3] - r1[3], r3[0] - r1[0], r3[1] - r1[1], r3[2] - r1[2]) // top
        setPlane(4, r3[3] + r2[3], r3[0] + r2[0], r3[1] + r2[1], r3[2] + r2[2]) // near
        setPlane(5, r3[3] - r2[3], r3[0] - r2[0], r3[1] - r2[1], r3[2] - r2[2]) // far

        return this
    }

    /** 点是否在视锥体内 */
    containsPoint(p: Vector3): boolean {
        for (const plane of this.planes) {
            if (plane.distanceToPoint(p) > 0) return false
        }
        return true
    }

    /** 球是否与视锥体相交（剔除用） */
    intersectsSphere(sphere: Sphere): boolean {
        for (const plane of this.planes) {
            if (plane.distanceToPoint(sphere.center) > sphere.radius) return false
        }
        return true
    }

    /** AABB 是否与视锥体相交（剔除用） */
    intersectsBox(box: Box3): boolean {
        for (const plane of this.planes) {
            // 计算 AABB 在法线方向上的最远顶点
            const n = plane.normal
            const px = n.x > 0 ? box.max.x : box.min.x
            const py = n.y > 0 ? box.max.y : box.min.y
            const pz = n.z > 0 ? box.max.z : box.min.z
            if (plane.distanceToPoint(new Vector3(px, py, pz)) > 0) return false
        }
        return true
    }

    /** 8 个角点（用于调试绘制） */
    corners(): Vector3[] {
        // 用三个平面交点求角点：遍历组合（简化：基于 near/far 中心与尺寸估算不可行）
        // 此处通过平面两两相交求解，实现简化为返回 null 提示
        const pts: Vector3[] = []
        // 取 8 个组合：每条侧棱由 near/far 与两个侧面决定
        const sidePairs: Array<[number, number]> = [
            [0, 2], [1, 2], [1, 3], [0, 3], // near
            [0, 2], [1, 2], [1, 3], [0, 3], // far
        ]
        for (let i = 0; i < 4; i++) {
            const nearPt = this.intersectThreePlanes(4, sidePairs[i][0], sidePairs[i][1])
            if (nearPt) pts.push(nearPt)
        }
        for (let i = 0; i < 4; i++) {
            const farPt = this.intersectThreePlanes(5, sidePairs[i][0], sidePairs[i][1])
            if (farPt) pts.push(farPt)
        }
        return pts
    }

    private intersectThreePlanes(i: number, j: number, k: number): Vector3 | null {
        const p1 = this.planes[i], p2 = this.planes[j], p3 = this.planes[k]
        const n1 = p1.normal, n2 = p2.normal, n3 = p3.normal
        const det = n1.dot(n2.cross(n3))
        if (Math.abs(det) < 1e-12) return null
        const inv = 1 / det
        const d1 = -p1.constant, d2 = -p2.constant, d3 = -p3.constant
        const x = n2.cross(n3).scale(d1).add(n3.cross(n1).scale(d2)).add(n1.cross(n2).scale(d3)).scale(inv)
        return x
    }

    clone(): Frustum {
        return new Frustum(this.planes.map((p) => p.clone()))
    }

    toString(): string {
        return `Frustum(planes=${this.planes.length})`
    }
}
