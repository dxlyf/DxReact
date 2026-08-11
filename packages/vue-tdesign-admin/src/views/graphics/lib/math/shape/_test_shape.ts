import { Circle } from './circle.ts'
import { Rect } from './rect.ts'
import { Ellipse } from './ellipse.ts'
import { RoundRect } from './round_rect.ts'
import { Triangle } from './triangle.ts'
import { Polygon } from './polygon.ts'
import { STROKE_ALIGN_CENTER, STROKE_ALIGN_INNER, STROKE_ALIGN_OUTER } from './shape_primitive.ts'

const check = (name: string, actual: boolean, expect: boolean) => {
    const ok = actual === expect
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got=${actual} expect=${expect}`)
}

// Circle
const c = new Circle(5, 5, 3)
check('circle 圆心', c.contains(5, 5), true)
check('circle 边界', c.contains(8, 5), true)
check('circle 外', c.contains(9, 5), false)
check('circle stroke center', c.containsStroke(6.5, 5, 2, STROKE_ALIGN_CENTER), true)  // 距边界 1.5 ≤ 1? no: |8-6.5|=1.5, width/2=1 → false
check('circle stroke center2', c.containsStroke(6.8, 5, 2, STROKE_ALIGN_CENTER), true) // dist=1.2 >1 false

// Rect
const r = new Rect(0, 0, 10, 5)
check('rect 内部', r.contains(5, 2), true)
check('rect 边界', r.contains(10, 2), true)
check('rect 外', r.contains(11, 2), false)
check('rect stroke outer', r.containsStroke(11, 2, 2, STROKE_ALIGN_OUTER), true)   // 距边界1 ≤ 2
check('rect stroke inner 内部点', r.containsStroke(8, 2, 2, STROKE_ALIGN_INNER), true) // sd=2 ≤2
check('rect stroke inner 深内部', r.containsStroke(5, 2, 2, STROKE_ALIGN_INNER), false) // sd=5>2

// Ellipse
const e = new Ellipse(5, 5, 4, 2)
check('ellipse 中心', e.contains(5, 5), true)
check('ellipse 内部', e.contains(7, 5), true)
check('ellipse 外 x', e.contains(10, 5), false)

// RoundRect
const rr = new RoundRect(0, 0, 10, 10, 3)
check('roundrect 中心', rr.contains(5, 5), true)
check('roundrect 角内', rr.contains(1.2, 1.2), true) // 距圆心 (1.2,1.2) 半径1.7<3 在内
check('roundrect 角外', rr.contains(0.5, 0.5), false) // 距圆心0.7>3-0.7? 角半径3，距角中心(3,3)距离 sqrt(2.5²+2.5²)=3.5>3 外
check('roundrect 边', rr.contains(0, 5), true)

// Triangle (CCW)
const t = new Triangle({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 })
check('triangle 内部', t.contains(0.5, 0.5), true)
check('triangle 斜边外', t.contains(2.5, 2.5), false)
check('triangle 斜边上', t.contains(2, 2), true)
// Triangle (CW) 顺时针绕向应同样正确
const t2 = new Triangle({ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 4, y: 0 })
check('triangle CW 内部', t2.contains(0.5, 0.5), true)
check('triangle CW 外', t2.contains(2.5, 2.5), false)

// Polygon 凹多边形 (L形)
const poly = new Polygon([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 4 }, { x: 0, y: 4 }])
check('polygon L 内部', poly.contains(0.5, 3), true)
check('polygon L 凹槽外', poly.contains(3, 3), false)
check('polygon L 边界', poly.contains(0, 2), true)
console.log('polygon bounds', JSON.stringify({ l: poly.getBounds().left, t: poly.getBounds().top, r: poly.getBounds().right, b: poly.getBounds().bottom }))
