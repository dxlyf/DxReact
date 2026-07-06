<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue';
import { ck, initCK, type CanvasKit } from './ck'
import ret from '../../../../lib/claygl/src/util/dds';

const canvasRef = shallowRef()
onMounted(async () => {
    await initCK()

    let rows = 10, cols = 10, cellSize = 64;
    let gridWidth = cols * cellSize
    let gridHeight = rows * cellSize

    let dpr = window.devicePixelRatio;
    let width = gridWidth + 20
    let height = gridHeight + 20
    canvasRef.value.width = Math.floor(width * dpr)
    canvasRef.value.height = Math.floor(height * dpr)
    canvasRef.value.style.width = width + 'px'
    canvasRef.value.style.height = height + 'px'
    let surface = ck.MakeWebGLCanvasSurface(canvasRef.value, ck.ColorSpace.SRGB, {
        depth: 0,
        stencil: 0,
        antialias: 1
    })

    let canvas = surface.getCanvas()
    let drawSubGrid = () => {
        canvas.save()
        canvas.translate(10, 10)
        let pathBuilder = new ck.PathBuilder()

        let subCellSize = cellSize / 4
        for (let r = 0; r <= rows * 4; r++) {
            if (r % 4 !== 0) {
                pathBuilder.moveTo(0, r * subCellSize)
                pathBuilder.lineTo(gridWidth, r * subCellSize)
            }
        }
        for (let c = 0; c <= cols * 4; c++) {
            if (c % 4 !== 0) {
                pathBuilder.moveTo(c * subCellSize, 0)
                pathBuilder.lineTo(c * subCellSize, gridHeight)
            }
        }
        let path = pathBuilder.detach()
        let paint = new ck.Paint()
        paint.setStrokeWidth(1)
        paint.setColorComponents(0, 0, 0, 0.1)
        paint.setStyle(ck.PaintStyle.Stroke)
        canvas.drawPath(path, paint)
        canvas.restore()
        paint.delete()
        pathBuilder.delete()
    }
    let drawGrid = () => {
        canvas.save()
        canvas.translate(10, 10)
        let pathBuilder = new ck.PathBuilder()


        for (let r = 0; r <= rows; r++) {
            pathBuilder.moveTo(0, r * cellSize)
            pathBuilder.lineTo(gridWidth, r * cellSize)
        }
        for (let c = 0; c <= cols; c++) {
            pathBuilder.moveTo(c * cellSize, 0)
            pathBuilder.lineTo(c * cellSize, gridHeight)
        }
        let path = pathBuilder.detach()
        let paint = new ck.Paint()
        paint.setStrokeWidth(1)
        paint.setColorComponents(0, 0, 0, 0.2)
        paint.setStyle(ck.PaintStyle.Stroke)
        canvas.drawPath(path, paint)
        canvas.restore()
        paint.delete()
        pathBuilder.delete()
    }
    let draw = () => {
        canvas.save()
        canvas.clear([1, 1, 1, 1])
        canvas.scale(dpr, dpr)
        drawSubGrid()
        drawGrid()
        let paint = new ck.Paint()
        sceen.traverseVisible((node) => {
            node.update()
            canvas.save()
            const props = node.props

            if (props.position) {
                canvas.translate(props.position[0], props.position[1])
            }
            if (props.rotation) {
                canvas.rotate(props.rotation, 0, 0)
            }
            if (props.scale) {
                canvas.scale(props.scale[0], props.scale[1])
            }
            paint.setColorComponents(props.color[0], props.color[1], props.color[2], props.color[3])
            paint.setStyle(ck.PaintStyle.Fill)
            node.draw(canvas, paint)
            canvas.restore()
        })
        canvas.restore()
        //surface.flush()
        surface.requestAnimationFrame(draw)
    }
    const pointEvents=['mousemove','mosuedown','mouseup']
    const findHit=(x:number,y:number)=>{
        return sceen.contains(x,y)
    }
    const handle=(e)=>{
        let type=e.type;
        let rect=e.target.getBoundingClientRect()
        let x=e.clientX-rect.left;
        let y=e.clientY-rect.top;

    }
    pointEvents.forEach((e)=>{
        canvasRef.value.addEventListener(e,handle)
    })
    onUnmounted(()=>{
        pointEvents.forEach((e)=>{
        canvasRef.value.removeEventListener(e,handle)
    })
    })
    type NodeProps = {
        position?: number[]
        scale?: number[]
        rotation?: number
        color?: number[]
    }
    class Shape<Props extends NodeProps> {
        type = 'Shape'
        props: Props
        parent: Shape<Props> = null
        visible: boolean = true
        children: Shape<Props>[] = []
        constructor(props?: Props) {
            this.props = { ...(props || {}) } as Props
        }
        add(child: Shape<Props>) {
            this.children.push(child)
        }
        remove(child: Shape<Props>) {
            let index = this.children.indexOf(child)
            if (index !== -1) {
                this.children.splice(index, 1)
            }
        }
        contains(x:number,y:number):boolean{
            const children=this.children
            if(this.type==='Shape'){
                for(let i=children.length-1;i>=0;i--){
                    if(children[i].contains(x,y)){
                        return true
                    }
                }
            }
            return false
            
        }
        update() {

        }

        draw(canvas: CanvasKit.Canvas, paint: CanvasKit.Paint) {

        }
        traverseVisible(callback: (node: Shape<Props>) => boolean | void) {
            if (!this.visible) {
                return true
            }
            if (this.type!='Shape'&&callback(this) === false) {
                return false
            }
            let children = this.children
            for (let i = 0, len = children.length; i < len; i++) {
                if (children[i].traverseVisible(callback) === false) {
                    return false
                }
            }
            return true
        }
    }
    type CircleProps = NodeProps & {
        cx: number
        cy: number
        r: number
    }
    class Circle extends Shape<CircleProps> {
        type = 'Circle'
        contains(x: number, y: number) {
            return Math.sqrt((x - this.props.cx) * (x - this.props.cx) + (y - this.props.cy) * (y - this.props.cy)) <= this.props.r
        }
        draw(canvas: CanvasKit.Canvas, paint: CanvasKit.Paint) {
            canvas.drawCircle(this.props.cx, this.props.cy, this.props.r, paint)
        }
    }
    class Point {
        static default() {
            return new Point(0, 0)
        }
        x: number = 0
        y: number = 0
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y
        }
    }
    let sceen = new Shape()
    let A = new Circle({ cx: 100, cy: 100, r: 5, color: [255, 0, 0, 255] })
    let B = new Circle({ cx: 100, cy: 100, r: 5, color: [255, 0, 0, 255] })
    let C = new Circle({ cx: 100, cy: 100, r: 5, color: [255, 0, 0, 255] })
    sceen.add(A)
    //draw()
    surface.requestAnimationFrame(draw)

})

</script>
<template>
    <canvas ref="canvasRef"></canvas>
</template>