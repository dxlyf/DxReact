<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { curvePaths, normalizeAngles ,Vector2} from '@dxyl/math2'
import GUI from "lil-gui"
const canvasRef = shallowRef<HTMLCanvasElement>()



let gui = new GUI()
let setting = {
    type: 'arcTo',
    show:true,
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
gui.add(setting, 'show')
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
function arcToWithArc(ctx:CanvasRenderingContext2D, x0:number, y0:number, x1:number, y1:number, x2:number, y2:number, r:number) {
  const dx0 = x0 - x1;
  const dy0 = y0 - y1;
  const dx2 = x2 - x1;
  const dy2 = y2 - y1;

  const len0 = Math.hypot(dx0, dy0);
  const len2 = Math.hypot(dx2, dy2);

  if (len0 === 0 || len2 === 0 || r <= 0) {
    ctx.lineTo(x1, y1);
    return;
  }

  const ux0 = dx0 / len0;
  const uy0 = dy0 / len0;
  const ux2 = dx2 / len2;
  const uy2 = dy2 / len2;

  const dot = Math.max(-1, Math.min(1, ux0 * ux2 + uy0 * uy2));
  const theta = Math.acos(dot);

  if (theta < 1e-6 || Math.PI - theta < 1e-6) {
    ctx.lineTo(x1, y1);
    return;
  }

  // 切点到控制点的距离
  const d = r / Math.tan(theta / 2);

  // 两个切点
  const tx1 = x1 + ux0 * d;
  const ty1 = y1 + uy0 * d;
  const tx2 = x1 + ux2 * d;
  const ty2 = y1 + uy2 * d;

  // 圆心在角平分线上
  const bx = ux0 + ux2;
  const by = uy0 + uy2;
  const blen = Math.hypot(bx, by);
  const cx = x1 + (bx / blen) * (r / Math.sin(theta / 2));
  const cy = y1 + (by / blen) * (r / Math.sin(theta / 2));

  const start = Math.atan2(ty1 - cy, tx1 - cx);
  const end = Math.atan2(ty2 - cy, tx2 - cx);

  // 判断顺时针还是逆时针
  const cross = ux0 * uy2 - uy0 * ux2;
  const ccw = cross > 0;

  ctx.lineTo(tx1, ty1);
  ctx.arc(cx, cy, r, start, end, ccw);
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

        if(setting.show){
            let p0=Vector2.create(arcTo.x0,arcTo.y0)
        let p1=Vector2.create(arcTo.x1,arcTo.y1)
        let p2=Vector2.create(arcTo.x,arcTo.y)

        let n0=p1.clone().subtract(p0).normalize()
        let n1=p2.clone().subtract(p1).normalize()
        
        let points = path.getPoints()
        ctx.beginPath()
        ctx.strokeStyle = 'blue'
        ctx.moveTo(arcTo.x0,arcTo.y0)
        arcToWithArc(ctx,arcTo.x0,arcTo.y0,arcTo.x1, arcTo.y1, arcTo.x, arcTo.y, arcTo.raduis)
      //  ctx.moveTo(arcTo.x0, arcTo.y0)
        // let sins =n0.cross(n1)
        // if (Math.abs(sins) <= 1e-6) {
        //     ctx.lineTo(arcTo.x, arcTo.y)
        // } else {
        //     let dist=Math.abs(arcTo.raduis*Math.tan(Math.asin(sins)/2))

        //     let tangent0=Vector2.from(p1).subtract(n0.clone().multiplyScalar(dist))
        //     let tangent1=Vector2.from(p1).add(n1.clone().multiplyScalar(dist))
        // }


        ctx.stroke()
        }
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