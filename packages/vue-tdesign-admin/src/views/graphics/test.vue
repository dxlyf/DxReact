<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { GUI } from 'lil-gui'
import { Stats, EventEmitter, curvePaths, type Vector2Like, Vector2, normalizeAngles, normalizeAnglePositive } from '@dxyl/math2'
const canvasRef = shallowRef<HTMLCanvasElement>();

Vector2.perp = function (out: Vector2, v: Vector2Like) {
    return out.set(-v.y, v.x)
}
curvePaths.Curve.prototype.getStrokePoints = function (options: { miterLimit?: number, width?: number, cap?: 'butt' | 'round' | 'square', join?: 'round' | 'bevel' | 'miter' }) {
    let { miterLimit = 10, width = 1, cap = 'butt', join = 'miter' } = options
    const points = this.getPoints()
    const halfWidth = width / 2
    const invMiterLimit = 1 / miterLimit

    let newLength = points.length
    let closed = Vector2.equalsEpsilon(points[0], points[newLength - 1], 1e-6)
    let innerPoints: Vector2Like[] = []
    let outerPoints: Vector2Like[] = []

    let first = Vector2.create(points[0])
    let last = Vector2.create(points[newLength - 1])
    let prev = Vector2.create()
    let cur = Vector2.create()

    let prevNormal = Vector2.create()
    let prevUnitNormal = Vector2.create()

    let normal = Vector2.create()
    let unitNormal = Vector2.create()

    let buildArc = (points: Vector2Like[], cx: number, cy: number, r: number, start: number, end: number, ccw: boolean = false) => {
        const { startAngle, endAngle } = normalizeAngles(start, end, ccw)
        const delta = endAngle - startAngle
        if (Math.abs(delta) <= 1e-6) {
            return
        }
        let segmentCount = Math.ceil(Math.PI / (Math.acos(1 - 0.5 / r)))
        let segmentAngle = delta / segmentCount
        let angle = startAngle
        for (let i = 0; i <= segmentCount; i++) {
            let x = cx + r * Math.cos(angle)
            let y = cy + r * Math.sin(angle)
            points.push({ x: x, y: y })
            angle += segmentAngle
        }
    }

    for (let i = 0; i < newLength; i++) {
        cur.copy(points[i])
        if (i === 0) {
            first.copy(cur)
        } else {
            unitNormal.copy(cur).subtract(prev).perp().negate().normalize()
            normal.copy(unitNormal).multiplyScalar(halfWidth)

            if (!cur.equalsEpsilon(last)) {
                // start
                if (i === 1 && !closed) {
                    // cap
                    if (cap === 'round') {
                        // 圆角
                        let v0 = Vector2.from(normal)
                        let v1 = Vector2.from(normal).negate()
                        let startAngle = Math.atan2(v1.y, v1.x)
                        let endAngle = Math.atan2(v0.y, v0.x)
                        buildArc(outerPoints, prev.x, prev.y, halfWidth, startAngle, endAngle, false)
                        innerPoints.push({
                            x: prev.x - normal.x,
                            y: prev.y - normal.y,
                        })
                    }
                    else if (cap === 'square') {
                        // 方角
                        let newFirst = Vector2.from(prev).subtract(Vector2.from(normal).perp())
                        outerPoints.push({
                            x: newFirst.x + normal.x,
                            y: newFirst.y + normal.y,
                        })
                        innerPoints.push({
                            x: newFirst.x - normal.x,
                            y: newFirst.y - normal.y,
                        })
                    }
                    else if (cap === 'butt') {
                        //  butt角
                        outerPoints.push({
                            x: first.x + normal.x,
                            y: first.y + normal.y,
                        })
                        innerPoints.push({
                            x: first.x - normal.x,
                            y: first.y - normal.y,
                        })
                    }
                }
                if (i > 1 && i < newLength && newLength > 2) {

                    const cosh = prevUnitNormal.dot(unitNormal)
                    const sinh = prevUnitNormal.cross(unitNormal)
                    const isClockwise = sinh > 0

                    if (Math.abs(sinh) > 1e-6) {
                        if (join === 'miter') {
                            // 锐角
                            const halfSin = Math.sqrt((1 + cosh) * 0.5)
                            if (halfSin < invMiterLimit) {
                                join = 'bevel'
                            } else {
                                const miterNormal = Vector2.from(prevUnitNormal).add(unitNormal).normalize().multiplyScalar(halfWidth / halfSin)

                                if (isClockwise) {
                                    outerPoints.push({
                                        x: prev.x + miterNormal.x,
                                        y: prev.y + miterNormal.y,
                                    })
                                    innerPoints.push({
                                        x: prev.x - prevNormal.x,
                                        y: prev.y - prevNormal.y,
                                    })
                                    innerPoints.push({
                                        x: prev.x - normal.x,
                                        y: prev.y - normal.y,
                                    })
                                } else {
                                    innerPoints.push({
                                        x: prev.x - miterNormal.x,
                                        y: prev.y - miterNormal.y,
                                    })
                                    outerPoints.push({
                                        x: prev.x + prevNormal.x,
                                        y: prev.y + prevNormal.y,
                                    })
                                    outerPoints.push({
                                        x: prev.x + normal.x,
                                        y: prev.y + normal.y,
                                    })
                                }
                            }
                        }
                        // join
                        if (join === 'round') {
                            // 圆角
                        }
                        if (join === 'bevel') {
                            // 锐角
                            outerPoints.push({
                                x: prev.x + prevNormal.x,
                                y: prev.y + prevNormal.y,
                            })
                            innerPoints.push({
                                x: prev.x - prevNormal.x,
                                y: prev.y - prevNormal.y,
                            })

                            outerPoints.push({
                                x: prev.x + normal.x,
                                y: prev.y + normal.y,
                            })
                            innerPoints.push({
                                x: prev.x - normal.x,
                                y: prev.y - normal.y,
                            })
                        }
                    }

                }
                // end
                if (i === newLength - 1 && !closed) {
                    // cap
                    if (cap === 'round') {
                        // 圆角
                        let v0 = Vector2.from(normal)
                        let v1 = Vector2.from(normal).negate()
                        let startAngle = Math.atan2(v0.y, v0.x)
                        let endAngle = Math.atan2(v1.y, v1.x)
                        buildArc(outerPoints, cur.x, cur.y, halfWidth, startAngle, endAngle, false)
                        innerPoints.push({
                            x: cur.x - normal.x,
                            y: cur.y - normal.y,
                        })
                    } else if (cap === 'square') {
                        // 方角
                        let newFirst = Vector2.from(cur).add(Vector2.from(normal).perp())
                        outerPoints.push({
                            x: newFirst.x + normal.x,
                            y: newFirst.y + normal.y,
                        })
                        innerPoints.push({
                            x: newFirst.x - normal.x,
                            y: newFirst.y - normal.y,
                        })
                    } else if (cap === 'butt') {
                        //  butt角
                        outerPoints.push({
                            x: cur.x + normal.x,
                            y: cur.y + normal.y,
                        })
                        innerPoints.push({
                            x: cur.x - normal.x,
                            y: cur.y - normal.y,
                        })
                    }
                }

            }
            prevNormal.copy(normal)
            prevUnitNormal.copy(unitNormal)
        }
        prev.copy(cur)
    }
    if (!closed && outerPoints.length > 0) {
        innerPoints.unshift({
            x: outerPoints[0].x,
            y: outerPoints[0].y,
        })
    }
    return outerPoints.concat(innerPoints.reverse())
}
let setting = {
    reverse: false,
    join: 'miter',
    cap: 'butt',
}
let circlesData:{r:number,x:number,y:number}[]=[
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
    {
        r: 5,
        x: 200,
        y: 200
    }
]
function render() {
    const ctx = canvasRef.value.getContext('2d')!
    ctx.save()
    ctx.clearRect(0, 0, 500, 500)
    let circles=circlesData.slice()

    if (setting.reverse) {
        circles.reverse()
    }
    const colors=['red','green','blue']
    circles.forEach((circle,i)=>{
        ctx.beginPath()
        ctx.fillStyle=colors[i]
        ctx.arc(circle.x,circle.y,circle.r,0,Math.PI*2)
        ctx.fill()
    })
    const path = new curvePaths.Path()
    path.moveTo(circles[0].x, circles[0].y)
    path.lineTo(circles[1].x, circles[1].y)
    path.lineTo(circles[2].x, circles[2].y)
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

    const strokePoints = path.getStrokePoints({ width: 20, join: setting.join, cap: setting.cap })
    console.log('strokePoints', strokePoints)
    ctx.beginPath()
    ctx.strokeStyle = '#0000ff'

    for (let [index, point] of strokePoints.entries()) {
        if (index === 0) {
            ctx.moveTo(point.x, point.y)
        } else {
            ctx.lineTo(point.x, point.y)
        }
    }

    ctx.stroke()
    ctx.restore()

}
let rending=false
const requestRender=()=>{
    if(rending){
        return
    }
    rending=true
    requestAnimationFrame(()=>{
        render()
        rending=false
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
    let hitCircle:any|undefined,startPoint=Vector2.create()
    canvasRef.value.addEventListener('pointerdown',(e)=>{
        const target=e.target as HTMLCanvasElement
        const rect=target.getBoundingClientRect()
        const x=e.clientX-rect.left
        const y=e.clientY-rect.top
        const circle=circlesData.find(circle=>Math.sqrt((x-circle.x)*(x-circle.x)+(y-circle.y)*(y-circle.y))<=circle.r)
        if(circle){
            hitCircle=circle
            startPoint.set(x-circle.x,y-circle.y)
            console.log('ffffff')
        }else{
            hitCircle=undefined
        }
        target.setPointerCapture(e.pointerId)
    })
    canvasRef.value.addEventListener('pointerup',(e)=>{
        hitCircle=undefined
        const target=e.target as HTMLCanvasElement
        target.releasePointerCapture(e.pointerId)
    })
     canvasRef.value.addEventListener('pointermove',(e)=>{
        const target=e.target as HTMLCanvasElement
        const rect=target.getBoundingClientRect()
        const x=e.clientX-rect.left
        const y=e.clientY-rect.top
        if(hitCircle){
            hitCircle.x=x-startPoint.x
            hitCircle.y=y-startPoint.y
            requestRender()
        }
    })
})
</script>
<template>
    <canvas  ref="canvasRef" width="500" height="500"></canvas>
</template>