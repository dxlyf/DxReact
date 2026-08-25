<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { curvePaths, normalizeAngles ,Vector2} from '@dxyl/math2'
import GUI from "lil-gui"
const canvasRef = shallowRef<HTMLCanvasElement>()



let gui = new GUI()
let setting = {
    type: 'arcTo',
    arcTo: {
        x0: 100,
        y0: 100,
        x1: 200,
        y1: 100,
        x: 200,
        y: 200,
        raduis: 100
    }
}
gui.add(setting, 'type', ['arcTo'])
const arcToGui = gui.addFolder('arcTo')
arcToGui.add(setting.arcTo, 'x0')
arcToGui.add(setting.arcTo, 'x0')
arcToGui.add(setting.arcTo, 'x1')
arcToGui.add(setting.arcTo, 'y1')
arcToGui.add(setting.arcTo, 'raduis')
arcToGui.add(setting.arcTo, 'x')
arcToGui.add(setting.arcTo, 'y')

let ctx: CanvasRenderingContext2D

function drawCircle(x: number, y: number, color: string) {
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, 5, 0, Math.PI * 2, false)
    ctx.fill()
    ctx.restore()
}
function render() {
    ctx.save()
    ctx.clearRect(0, 0, 500, 500)

    if (setting.type === 'arcTo') {
        ctx.save()
        let path2d = new Path2D()
        let path = new curvePaths.Path()
        const arcTo = setting.arcTo
        drawCircle(arcTo.x0, arcTo.y0, 'red')
        drawCircle(arcTo.x1, arcTo.y1, 'blue')
        drawCircle(arcTo.x, arcTo.y, 'green')
        ctx.beginPath()
        ctx.strokeStyle = '#000'
        ctx.moveTo(arcTo.x0, arcTo.y0)
        ctx.arcTo(arcTo.x1, arcTo.y1, arcTo.x, arcTo.y, arcTo.raduis)
        ctx.stroke()

        let p0=Vector2.create(arcTo.x0,arcTo.y0)
        let p1=Vector2.create(arcTo.x1,arcTo.y1)
        let p2=Vector2.create(arcTo.x,arcTo.y)

        let n0=p1.clone().subtract(p0).normalize()
        let n1=p2.clone().subtract(p1).normalize()
        
        let points = path.getPoints()
        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.moveTo(arcTo.x0, arcTo.y0)
        let sins =n0.cross(n1)
        if (Math.abs(sins) <= 1e-6) {
            ctx.lineTo(arcTo.x, arcTo.y)
        } else {
            let dist=arcTo.raduis*Math.abs(Math.tan(Math.asin(sins)/2))

            let 
        }

        ctx.stroke()
        ctx.restore()

    }

    ctx.restore()
}

onMounted(() => {
    let dpr = window.devicePixelRatio
    const canvas = canvasRef.value
    canvas.width = 500 * dpr
    canvas.height = 500 * dpr
    canvas.style.width = '500px'
    canvas.style.height = '500px'
    ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    render()
    let rendering = false
    const requestRender = () => {
        if (rendering) {
            return
        }
        rendering = true
        requestAnimationFrame(() => {
            rendering = false
            render()
        })
    }
    gui.onChange(() => {
        requestRender()
    })

})
onUnmounted(() => {
    gui.destroy()
})
</script>
<template>
    <canvas ref="canvasRef"></canvas>
</template>