<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { GUI } from 'lil-gui'
import { Op, Path2D, SkPaint, SkPath, SkPathOp, SkStroke } from 'pathkit-ts'
import { Stats, EventEmitter, curvePaths, type Vector2Like, Vector2, normalizeAngles, normalizeAnglePositive } from '@dxyl/math2'
import { V } from 'vue-router/dist/router-CWoNjPRp.mjs';
const canvasRef = shallowRef<HTMLCanvasElement>();

Vector2.perp = function (out: Vector2, v: Vector2Like) {
    return out.set(-v.y, v.x)
}
curvePaths.Curve.prototype.getStrokePoints = function (options: { miterLimit?: number, align?: 'outside' | 'inside' | 'center', width?: number, cap?: 'butt' | 'round' | 'square', join?: 'round' | 'bevel' | 'miter' }) {

    let { miterLimit = 10, width = 1, cap = 'butt', join = 'miter', align = 'center' } = options
    const points = this.getPoints()
    const closed = Vector2.equalsEpsilon(points[0], points[points.length - 1], 1e-6)
    const halfWidth = width / 2
    const invMiterLimit = 1 / miterLimit

    const newPoints: Vector2Like[] = [points[0]]
    // 去掉重复点
    let lastPoint = points[0]
    for (let i = 1; i < points.length; i++) {
        if (!Vector2.equalsEpsilon(points[i], lastPoint, 1e-6)) {
            newPoints.push(points[i])
            lastPoint = points[i]
        }
    }


    let newLength = newPoints.length
    if (newPoints.length < 2) {
        return []
    }
    let innerPoints: Vector2Like[] = []
    let outerPoints: Vector2Like[] = []

    let first = Vector2.create()
    let prev = Vector2.create()
    let cur = Vector2.create()

    let prevNormal = Vector2.create()
    let prevUnitNormal = Vector2.create()
    let firstNormal = Vector2.create()

    let normal = Vector2.create()
    let unitNormal = Vector2.create()

    let buildArc = (points: Vector2Like[], cx: number, cy: number, r: number, start: number, end: number, ccw: boolean = false) => {
        const { startAngle, endAngle } = normalizeAngles(start, end, ccw)
        const delta = endAngle - startAngle
        if (Math.abs(delta) <= 1e-6) {
            return
        }
        let segmentCount = Math.max(1, Math.ceil(Math.min(Math.PI, Math.abs(delta)) / (Math.acos(1 - 0.5 / r))))
        let segmentAngle = delta / segmentCount
        let angle = startAngle
        for (let i = 0; i <= segmentCount; i++) {
            let x = cx + r * Math.cos(angle)
            let y = cy + r * Math.sin(angle)
            points.push({ x: x, y: y })
            angle += segmentAngle
        }
    }
    let processJoin=(joinType:'round'|'bevel'|'miter',outer:Vector2Like[],inner:Vector2Like[],prevUnitNormal:Vector2,pivot:Vector2,afterUnitNormal:Vector2,radius:number,invMiterLimit:number)=>{
        if (joinType === 'miter') {

        }
        if (joinType === 'round') {

        }
        if (joinType === 'bevel') {

        }
    }
    let processCap=(capType:'butt'|'round'|'square',outer:Vector2Like[],inner:Vector2Like[],normal:Vector2,pivot:Vector2,stop:Vector2)=>{
        if (capType === 'square') {
            const parallel = normal.clone().perp()
            outer[outer.length-1]={
                x: pivot.x + parallel.x+normal.x,
                y: pivot.y + parallel.y+normal.y,
            }
            outer.push({
                x: pivot.x + parallel.x-normal.x,
                y: pivot.y + parallel.y-normal.y,
            })
        }
        if (capType === 'round') {
            buildArc(outer,pivot.x,pivot.y,halfWidth,0,Math.PI,false)
            inner.push({
                x: pivot.x + normal.x,
                y: pivot.y + normal.y,
            })
        }
        if (capType === 'butt') {
            
        }
    }
    for (let i = 0; i < newLength; i++) {
        cur.copy(newPoints[i])
        if (i !== 0) {

            unitNormal.copy(cur).subtract(prev).perp().negate().normalize()
            normal.copy(unitNormal).multiplyScalar(halfWidth)

            //join 
            if (i == 1) {
                firstNormal.copy(normal)
                first.set(prev.x, prev.y)
                outerPoints.push({
                    x: prev.x + normal.x,
                    y: prev.y + normal.y,
                })
                innerPoints.push({
                    x: prev.x - normal.x,
                    y: prev.y - normal.y,
                })
            }
            if (i > 1 && newLength > 2) {
                const cosh = prevUnitNormal.dot(unitNormal)
                const sinh = prevUnitNormal.cross(unitNormal)
                if (join === 'miter') {

                }
                if (join === 'round') {

                }
                if (join === 'bevel') {

                }
            }
            outerPoints.push({
                x: cur.x + normal.x,
                y: cur.y + normal.y,
            })
            innerPoints.push({
                x: cur.x - normal.x,
                y: cur.y - normal.y,
            })
            // cap
            if (i === newLength - 1) {
                if (closed) {

                } else {
                    
                    processCap(cap,outerPoints,innerPoints,normal,cur,Vector2.from(innerPoints[innerPoints.length-1]))
                    outerPoints=outerPoints.concat(innerPoints.slice().reverse())
                    processCap(cap,outerPoints,innerPoints,Vector2.create(-firstNormal.x,-firstNormal.y),first,Vector2.from(innerPoints[innerPoints.length-1]))
                    outerPoints.push({
                        x: outerPoints[0].x,
                        y: outerPoints[0].y,
                    })
                }
            }
            prevNormal.copy(normal)
            prevUnitNormal.copy(unitNormal)
        }
        prev.copy(cur)
    }
    return outerPoints
}
let setting = {
    reverse: false,
    join: 'round',
    cap: 'butt',
}
let circlesData: { r: number, x: number, y: number }[] = [
    {
        r: 5,
        x: 100,
        y: 100,
    },
    {
        r: 5,
        x: 200,
        y: 100,
    },
    // {
    //     r: 5,
    //     x: 200,
    //     y: 200
    // },
    // {
    //     r: 5,
    //     x: 100,
    //     y: 200
    // },
    // {
    //     r: 5,
    //     x: 100,
    //     y: 100
    // }
]
function render() {
    const ctx = canvasRef.value.getContext('2d')!
    ctx.save()
    ctx.clearRect(0, 0, 500, 500)
    let circles = circlesData.slice()

    if (setting.reverse) {
        circles.reverse()
    }
    const colors = ['red', 'green', 'blue', 'yellow', 'orange']
    circles.forEach((circle, i) => {
        ctx.beginPath()
        ctx.fillStyle = colors[i] || '#000'
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
        ctx.fill()
    })
    const path = new curvePaths.Path()
    for (let i = 0; i < circles.length; i++) {
        if (i === 0) {
            path.moveTo(circles[i].x, circles[i].y)
        } else {
            path.lineTo(circles[i].x, circles[i].y)
        }
    }
    const points = path.getPoints()


    ctx.beginPath()

    for (let [index, point] of points.entries()) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y)
        } else {
            ctx.lineTo(point.x, point.y)
        }
    }

    ctx.stroke()

    const newPoints = path.getStrokePoints({ width: 20, join: setting.join, cap: setting.cap })

    ctx.beginPath()
    ctx.strokeStyle = '#0000ff'

    for (let [index, point] of newPoints.entries()) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y)
        } else {
            ctx.lineTo(point.x, point.y)
        }
    }



    ctx.stroke()

    ctx.restore()



}
let rending = false
const requestRender = () => {
    if (rending) {
        return
    }
    rending = true
    requestAnimationFrame(() => {
        render()
        rending = false
    })
}

onMounted(() => {
    let gui = new GUI()
    gui.add(setting, 'reverse').onChange(() => {
        requestRender()
    })
    gui.add(setting, 'join', ['round', 'bevel', 'miter']).onChange(() => {
        requestRender()
    })
    gui.add(setting, 'cap', ['round', 'square', 'butt']).onChange(() => {
        requestRender()
    })
    requestRender()
    let hitCircle: any | undefined, startPoint = Vector2.create()
    canvasRef.value.addEventListener('pointerdown', (e) => {
        const target = e.target as HTMLCanvasElement
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const circle = circlesData.find(circle => Math.sqrt((x - circle.x) * (x - circle.x) + (y - circle.y) * (y - circle.y)) <= circle.r)
        if (circle) {
            hitCircle = circle
            startPoint.set(x - circle.x, y - circle.y)
        } else {
            hitCircle = undefined
        }

        target.setPointerCapture(e.pointerId)
    })
    canvasRef.value.addEventListener('pointerup', (e) => {
        hitCircle = undefined
        const target = e.target as HTMLCanvasElement
        target.releasePointerCapture(e.pointerId)
    })
    canvasRef.value.addEventListener('pointermove', (e) => {
        const target = e.target as HTMLCanvasElement
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (hitCircle) {
            hitCircle.x = x - startPoint.x
            hitCircle.y = y - startPoint.y
            requestRender()
        }
    })
})
</script>
<template>
    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>