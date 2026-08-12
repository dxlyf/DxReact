import { Circle } from './circle'
import { Rect } from './rect'
import { Ellipse } from './ellipse'
import { RoundRect } from './round_rect'
import { Triangle } from './triangle'
import { Polygon } from './polygon'
import { STROKE_ALIGN_CENTER, STROKE_ALIGN_INNER, STROKE_ALIGN_OUTER } from './shape_primitive'
import type { Vector2Like } from '../vector2'

let fail = 0
const check = (name: string, actual: boolean, expect: boolean) => {
    const ok = actual === expect
    if (!ok) fail++
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${actual} expect=${expect}`)
}
const fmt = (pts: Vector2Like[]) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

// ---- buildPath ----
const c = new Circle(5, 5, 3)
const cp = c.buildPath(8)
check('circle buildPath 8段', cp.length === 8 && cp.every(p => Math.abs(Math.hypot(p.x - 5, p.y - 5) - 3) < 1e-6), true)

const r = new Rect(0, 0, 10, 5)
const rp = r.buildPath()
check('rect buildPath 4角', rp.length === 4 && rp[0].x === 0 && rp[0].y === 0 && rp[2].x === 10 && rp[2].y === 5, true)

const e = new Ellipse(5, 5, 4, 2)
const ep = e.buildPath(12)
check('ellipse buildPath 12段', ep.length === 12 && ep.every(p => (p.x - 5) ** 2 / 16 + (p.y - 5) ** 2 / 4 <= 1 + 1e-9), true)

const rr = new RoundRect(0, 0, 10, 10, 3)
const rrp = rr.buildPath(4)
check('roundrect buildPath 点数', rrp.length === 1 + 4 * (4 + 1) - 1, true)
check('roundrect buildPath 首点', rrp[0].x === 3 && rrp[0].y === 0, true)
const tr = rrp[5] // 右上角圆弧中间点约在 (10, 3) 附近（圆心10,3 半径3，角度0）
check('roundrect buildPath 右上角', Math.abs(tr.x - 10) < 1e-6 && Math.abs(tr.y - 3) < 1e-6, true)

const t = new Triangle({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 })
const tp = t.buildPath()
check('triangle buildPath 3顶点', tp.length === 3 && tp[2].y === 4, true)

const poly = new Polygon([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }])
const pp = poly.buildPath()
check('polygon buildPath 拷贝', pp.length === 3 && pp[1].x === 4 && pp !== (poly as any).points, true)

// ---- SDF 修复验证 ----
check('rect 内部(5,2)', r.contains(5, 2), true)
check('rect 边界(10,2)', r.contains(10, 2), true)
check('rect 外(11,2)', r.contains(11, 2), false)
check('rect stroke outer(11,2)', r.containsStroke(11, 2, 2, STROKE_ALIGN_OUTER), true)
check('rect stroke inner(8,2)', r.containsStroke(8, 2, 2, STROKE_ALIGN_INNER), true)
check('rect stroke inner(5,2)', r.containsStroke(5, 2, 2, STROKE_ALIGN_INNER), true) // sd=2 恰在边界
check('rect stroke inner(3,2.5)', r.containsStroke(3, 2.5, 2, STROKE_ALIGN_INNER), false) // sd=2.5 > 2

check('roundrect 中心(5,5)', rr.contains(5, 5), true)
check('roundrect 角内(1.2,1.2)', rr.contains(1.2, 1.2), true)
check('roundrect 角外(0.5,0.5)', rr.contains(0.5, 0.5), false)
check('roundrect 边(0,5)', rr.contains(0, 5), true)
check('roundrect stroke center(0.5,5)', rr.containsStroke(0.5, 5, 2, STROKE_ALIGN_CENTER), true) // 距边0.5 ≤1

const t2 = new Triangle({ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 4, y: 0 })
check('triangle CW 内部(0.5,0.5)', t2.contains(0.5, 0.5), true)
check('triangle CW 外(2.5,2.5)', t2.contains(2.5, 2.5), false)
check('triangle CW 斜边(2,2)', t2.contains(2, 2), true)
check('circle stroke center(7,5)', c.containsStroke(7, 5, 2, STROKE_ALIGN_CENTER), true)  // 距边界1 ≤1
check('circle stroke center(9.5,5)', c.containsStroke(9.5, 5, 2, STROKE_ALIGN_CENTER), false) // 距边界1.5 >1

console.log(fail === 0 ? '\n全部通过' : `\n${fail} 项失败`)
