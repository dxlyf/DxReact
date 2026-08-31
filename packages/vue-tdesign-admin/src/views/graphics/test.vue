<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { GUI } from 'lil-gui'
import { Stats ,EventEmitter} from '@dxyl/math2'
import * as PathKit from 'pathkit-ts'
import { SkConic, SkAutoConicToQuads } from 'pathkit-ts/core/SkGeometry'
const containerRef = shallowRef<HTMLDivElement>();

type ExampleState = {
    type?: string
    min?: number
    max?: number
    step?: number
    options?: string[]
}

class Example  extends EventEmitter<{pointerdown: [e:{x: number, y: number, type: string}]}>{
    gui: GUI
    name: string
    inited: boolean = false
    owner: ExampleManager
    declare state: Record<string, any>
    declare stateOptions: Record<string, ExampleState>
    constructor(owner: ExampleManager) {
        super()
        this.owner = owner
        this.handlePointer = this.handlePointer.bind(this)
    }
    init() {
    }
    initGui(gui: GUI) {
        this.gui = gui
        if (!this.state) {
            return
        }
        this.buildStateGui(gui, this.state, this.stateOptions)
    }
    handlePointer(e: PointerEvent) {
        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newE = { x, y, type: e.type }
        this.onPointer(newE);
        (this as any)['on' + e.type[0].toUpperCase() + e.type.slice(1)]?.(newE)
        this.emit(e.type as string, newE)
    }
    onPointer(e: { x: number, y: number, type: string }) {
        // console.log(e)
    }

    attachPointerEvents(dom: HTMLElement) {
        ['pointerdown', 'pointermove', 'pointerup'].forEach(item => {
            dom.addEventListener(item as any, this.handlePointer)
        })
    }
    detachPointerEvents(dom: Element) {
        ['pointerdown', 'pointermove', 'pointerup'].forEach(item => {
            dom.removeEventListener(item as any, this.handlePointer)
        })
    }
    buildStateGui(gui: GUI, state: any, stateOptions: any) {
        Object.keys(state).forEach(key => {
            const value = state[key]
            let valueType = typeof value
            const config: ExampleState = { type: valueType, min: 0, max: 1000, step: 1, ...(stateOptions?.[key] || {}) }
            if (valueType === 'string' && (value as string).startsWith('#')) {
                config.type = 'color'
            }
            if (config.options) {
                config.type = 'select'
            }
            if (Object.prototype.toString.call(value) === '[object Array]') {
                config.type = 'array'
            }
            if (Object.prototype.toString.call(value) === '[object Object]') {
                config.type = 'object'
            }
            if (config.type === 'number') {
                console.log('config', config)
                gui.add(state, key, config.min, config.max, config.step)
            } else if (config.type === 'color') {
                gui.addColor(state, key)
            } else if (config.type === 'select') {
                gui.add(state, key, config.options)
            } else if (config.type === 'object') {
                const folder = gui.addFolder(key)
                this.buildStateGui(folder, value, stateOptions?.[key])
            }
            else {
                gui.add(state, key)
            }

        })
    }
    onStateChange(e: {
        object: object;
        property: string;
        value: any;
        controller: any
    }) {

    }
    enter() { }
    exit() { }
    update() { }
    render() { }
    destroy() { }
}

class ExampleManager {
    static create(examples: { new(owner: ExampleManager): Example }[]) {
        return new ExampleManager(examples)
    }
    examples: Example[] = []
    gui: GUI = new GUI()
    stats: Stats = new Stats()
    currentExample: Example = null!
    animationId: number = -1
    needsUpdateRender: boolean = false
    constructor(examples: { new(owner: ExampleManager): Example }[]) {
        document.body.appendChild(this.gui.domElement)
        this.tick = this.tick.bind(this)
        this.onStateChange = this.onStateChange.bind(this)
        this.examples = examples.map(item => new item(this))
        const exampleControl = this.gui.add(this, 'example', this.examples.map(item => item.name))
        this.activeExample(this.examples[0].name)
        exampleControl.updateDisplay()
        this.gui.onChange(this.onStateChange)
        document.body.appendChild(this.stats.dom)
    }
    get example() {
        return this.currentExample?.name || ''
    }
    set example(value: string) {
        this.activeExample(value)
    }
    activeExample(name: string) {
        if (this.currentExample) {
            this.currentExample.gui.destroy()
            this.currentExample.gui = null
            this.currentExample.exit()
        }
        this.currentExample = this.examples.find(item => item.name === name)
        if (!this.currentExample.inited) {
            this.currentExample.inited = true
            this.currentExample.init()
        }
        this.currentExample.initGui(this.gui.addFolder(this.currentExample.name))
        this.currentExample.enter()
        this.refresh()
        this.startTick()
    }
    startTick() {
        if (this.animationId > -1) {
            cancelAnimationFrame(this.animationId)
        }
        this.animationId = requestAnimationFrame(this.tick)
    }
    stopTick() {
        if (this.animationId > -1) {
            cancelAnimationFrame(this.animationId)
            this.animationId = -1
        }
    }
    tick() {
        this.stats.update()
        this.update()
        if (this.needsUpdateRender) {
            this.render()
            this.needsUpdateRender = false
        }
        requestAnimationFrame(this.tick)
    }
    update() {
        this.currentExample.update()
    }
    render() {
        this.currentExample.render()
    }
    refresh() {
        this.needsUpdateRender = true
    }
    onStateChange(e: { object: object; property: string; value: any; controller: any; }): void {
        this.currentExample.onStateChange(e)
        this.refresh()
    }
    destroy() {
        this.stopTick()
        this.gui.destroy()
        this.examples.forEach(item => item.exit())
        this.examples.forEach(item => item.destroy())
    }
}
class CanvasExample extends Example {
    name: string = 'Canvas'
    createCanvas(width: number, height: number, dpr: number = 1) {
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(height * dpr)
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        return canvas
    }
    leftCanvas: HTMLCanvasElement = null!
    rightCanvas: HTMLCanvasElement = null!
    leftCtx: CanvasRenderingContext2D = null!
    rightCtx: CanvasRenderingContext2D = null!
    dpr: number = window.devicePixelRatio
    init() {
    }
    enter(): void {
        const nativeCanvas = this.createCanvas(400, 400, this.dpr)
        const pathkitCanvas = this.createCanvas(400, 400, this.dpr)
        containerRef.value?.appendChild(nativeCanvas)
        containerRef.value?.appendChild(pathkitCanvas)
        this.leftCanvas = nativeCanvas
        this.rightCanvas = pathkitCanvas
        this.leftCtx = nativeCanvas.getContext('2d')!
        this.rightCtx = pathkitCanvas.getContext('2d')!
        this.attachPointerEvents(this.leftCanvas)

    }
    clear(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
    save(ctx: CanvasRenderingContext2D) {
        ctx.save()
    }
    restore(ctx: CanvasRenderingContext2D) {
        ctx.restore()
    }
    draw(id: string, ctx: CanvasRenderingContext2D) {

    }
    render(): void {
        this.clear(this.leftCtx)
        this.clear(this.rightCtx)
        this.save(this.leftCtx)
        this.save(this.rightCtx)
        this.leftCtx.scale(this.dpr, this.dpr)
        this.rightCtx.scale(this.dpr, this.dpr)
        this.draw('left', this.leftCtx)
        this.draw('right', this.rightCtx)

        this.restore(this.leftCtx)
        this.restore(this.rightCtx)
    }
    onStateChange(e: { object: object; property: string; value: any; controller: any; }): void {

    }
    exit(): void {
        this.detachPointerEvents(this.leftCanvas)
        containerRef.value?.removeChild(this.leftCtx.canvas)
        containerRef.value?.removeChild(this.rightCtx.canvas)
    }
    destroy(): void {

    }
}
class PathKitExample extends CanvasExample {
    name: string = 'Line'
    state = {
        fillStyle: '#ff0000',
        strokeStyle: '#0000ff',
        lineWidth: 10,
        lineJoin: 'miter',
        lineCap: 'butt',
        miterLimit: 10,
        closePath: false,
        left: {
            fill: false,
            stroke: true,
        },
        right: {
            fill: false,
            stroke: true,
            fillStroke: true,
        },
    }
    stateOptions: Record<string, ExampleState> = {
        miterLimit: {
            min: 1,
            max: 100,
            step: 1,
        },
        lineWidth: {
            min: 1,
            max: 100,
            step: 1,
        },
        lineJoin: {
            options: ['miter', 'round', 'bevel'],
        },
        lineCap: {
            options: ['round', 'square', 'butt']
        }
    }
    drawLeft(ctx: CanvasRenderingContext2D) {

    }
    drawRight(ctx: CanvasRenderingContext2D) {

    }
    draw(id: string, ctx: CanvasRenderingContext2D): void {
        ctx.save()

        ctx.fillStyle = this.state.fillStyle
        ctx.strokeStyle = this.state.strokeStyle
        ctx.lineWidth = this.state.lineWidth
        ctx.lineJoin = this.state.lineJoin as any
        ctx.lineCap = this.state.lineCap as any
        ctx.miterLimit = this.state.miterLimit
        if (id === 'left') {
            this.drawLeft(ctx)
        } else {
            this.drawRight(ctx)
        }
        ctx.restore()
    }
    toCap(cap: string) {
        switch (cap) {
            case 'round':
                return PathKit.SkPaint.kRound_Cap
            case 'square':
                return PathKit.SkPaint.kSquare_Cap
            case 'butt':
                return PathKit.SkPaint.kButt_Cap
        }
    }
    toJoin(join: string) {
        switch (join) {
            case 'miter':
                return PathKit.SkPaint.kMiter_Join
            case 'round':
                return PathKit.SkPaint.kRound_Join
            case 'bevel':
                return PathKit.SkPaint.kBevel_Join
        }
    }
    convertPath(ctx: CanvasRenderingContext2D, path: PathKit.SkPath): void {
        const iter = new PathKit.SkPathRawIter(path);
        const pts = [new PathKit.SkPoint(), new PathKit.SkPoint(), new PathKit.SkPoint(), new PathKit.SkPoint()];
        let verb: number;
        let lastX = 0;
        let lastY = 0;
        while ((verb = iter.next(pts)) !== PathKit.kDone_Verb) {
            switch (verb) {
                case PathKit.kMove_Verb:
                    ctx.moveTo(pts[0].fX, pts[0].fY);
                    lastX = pts[0].fX;
                    lastY = pts[0].fY;
                    break;
                case PathKit.kLine_Verb:
                    ctx.lineTo(pts[1].fX, pts[1].fY);
                    lastX = pts[1].fX;
                    lastY = pts[1].fY;
                    break;
                case PathKit.kQuad_Verb:
                    ctx.quadraticCurveTo(pts[1].fX, pts[1].fY, pts[2].fX, pts[2].fY);
                    lastX = pts[2].fX;
                    lastY = pts[2].fY;
                    break;
                case PathKit.kCubic_Verb:
                    ctx.bezierCurveTo(pts[1].fX, pts[1].fY, pts[2].fX, pts[2].fY, pts[3].fX, pts[3].fY);
                    lastX = pts[3].fX;
                    lastY = pts[3].fY;
                    break;
                case PathKit.kConic_Verb: {
                    // Canvas 2D has no native conic; approximate with quadratic Bézier
                    // segments via SkAutoConicToQuads (Skia's conic -> quads converter),
                    // keeping the tolerance fixed at 0.25 (sub-pixel). The conic's start
                    // point is pts[0] from the iterator.
                    const conic = new SkConic();
                    conic.set4(pts[0], pts[1], pts[2], iter.fConicWeight);
                    const skAutoConicToQuads = new SkAutoConicToQuads()
                    const quads = skAutoConicToQuads.computeQuads(conic, 0.25);
                    const quadCount = skAutoConicToQuads.countQuads();
                    for (let i = 0; i < quadCount; ++i) {
                        const o = i * 2;
                        ctx.quadraticCurveTo(quads[o + 1].fX, quads[o + 1].fY,
                            quads[o + 2].fX, quads[o + 2].fY);
                    }
                    lastX = pts[2].fX;
                    lastY = pts[2].fY;
                    break;
                }
                case PathKit.kClose_Verb:
                    ctx.closePath();
                    break;
                default:
                    break;
            }
        }
    }

}
class LineExample extends PathKitExample {
    name: string = 'Line'
    points: { x: number, y: number }[] = []
    initGui(gui: GUI): void {
        super.initGui(gui)
        gui.add(this, 'clearPoints')
    }
    clearPoints() {
        this.points = []
    }
    onPointerdown(e) {
        this.points.push({ x: e.x, y: e.y })
        this.owner.refresh()
    }
    drawLeft(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) {
            return
        }
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y)
        }
        if (this.state.closePath) {
            ctx.closePath()
        }
        if (this.state.left.fill) {
            ctx.fill()
        }
        if (this.state.left.stroke) {
            ctx.stroke()
        }
    }
    drawRight(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) {
            return
        }
        ctx.beginPath()
        const path = new PathKit.SkPath()
        path.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length; i++) {
            path.lineTo(this.points[i].x, this.points[i].y)
        }
        if (this.state.closePath) {
            path.close()
        }
        if (this.state.right.fill) {
            this.convertPath(ctx, path)
            ctx.fill()
        }
        if (this.state.right.stroke) {
            const stroke = new PathKit.SkStroke()

            stroke.setWidth(this.state.lineWidth)
            stroke.setJoin(this.toJoin(this.state.lineJoin))
            stroke.setCap(this.toCap(this.state.lineCap))
            stroke.setMiterLimit(this.state.miterLimit)
            const strokePath = new PathKit.SkPath()
            stroke.strokePath(path, strokePath)
            ctx.beginPath()
            this.convertPath(ctx, strokePath)
            if (this.state.right.fillStroke) {
                ctx.fill()
            } else {
                ctx.lineWidth = 1
                ctx.stroke()
            }

        }

    }
}
class ArcToExample extends PathKitExample {
    name: string = 'ArcTo'
    arc = {
        x0: 100,
        y0: 100,
        x1: 200,
        y1: 100,
        x2: 200,
        y2: 200,
        radius: 50,
    }
    initGui(gui: GUI): void {
        super.initGui(gui)
        this.buildStateGui(gui,this.arc, {})
    }
    drawLeft(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.moveTo(this.arc.x0, this.arc.y0)
        ctx.arcTo(this.arc.x1, this.arc.y1, this.arc.x2, this.arc.y2, this.arc.radius)
        if (this.state.closePath) {
            ctx.closePath()
        }
        if (this.state.left.fill) {
            ctx.fill()
        }
        if (this.state.left.stroke) {
            ctx.stroke()
        }
    }
    drawRight(ctx: CanvasRenderingContext2D) {

        ctx.beginPath()
        const path = new PathKit.SkPath()
        path.moveTo(this.arc.x0, this.arc.y0)
        path.arcTo(this.arc.x1, this.arc.y1, this.arc.x2, this.arc.y2, this.arc.radius)
        if (this.state.closePath) {
            path.close()
        }
        if (this.state.right.fill) {
            this.convertPath(ctx, path)
            ctx.fill()
        }
        if (this.state.right.stroke) {
            const stroke = new PathKit.SkStroke()

            stroke.setWidth(this.state.lineWidth)
            stroke.setJoin(this.toJoin(this.state.lineJoin))
            stroke.setCap(this.toCap(this.state.lineCap))
            stroke.setMiterLimit(this.state.miterLimit)
            const strokePath = new PathKit.SkPath()
            stroke.strokePath(path, strokePath)
            ctx.beginPath()
            this.convertPath(ctx, strokePath)
            if (this.state.right.fillStroke) {
                ctx.fill()
            } else {
                ctx.lineWidth = 1
                ctx.stroke()
            }

        }

    }
}
onMounted(() => {
    ExampleManager.create([LineExample, ArcToExample])
})

</script>
<template>
    <div ref="containerRef" class="flex"></div>
</template>