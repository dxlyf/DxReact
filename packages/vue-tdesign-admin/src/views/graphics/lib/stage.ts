import type { StageOptions, Stage as IStage, StageEvents } from "./types/stage"
import type { Renderer,RendererConstructor } from "./types/renderer"
import { EventEmitter } from "./events/event_emitter"


export class Stage extends EventEmitter<StageEvents> implements IStage {
    static renderers = new Map<string, RendererConstructor>()
    static registerRenderer(name:string,renderer: RendererConstructor){
        this.renderers.set(name, renderer)
    }
    options: StageOptions
    renderer: Renderer
    domElement: HTMLDivElement
    dpr: number = 1
    width: number = 0
    height: number = 0
    renderMode:string
    async initialize(options: StageOptions) {
        this.options = options
        this.dpr = options.dpr || window.devicePixelRatio
        this.width = options.width || window.innerWidth
        this.height = options.height || window.innerHeight
        this.renderMode = options.renderMode || 'canvas'
        // 初始渲染器前
        this.emit('preinit',this)
        const Renderer=Stage.renderers.get(this.renderMode)!
        this.renderer = new Renderer()
        if(this.options.container){
            this.domElement=this.options.container
        }else{
            this.domElement=document.createElement("div")
            document.body.appendChild(this.domElement)
        }
        this.setSize(this.width, this.height)
        // 初始渲染器后
        this.emit('init',this)
    }
    setSize(width: number, height: number): void {
        this.width=width
        this.height=height
        this.domElement.style.width=`${width}px`
        this.domElement.style.height=`${height}px`

        this.renderer.dpr=this.dpr
        this.renderer.setSize(width, height,true)
    }

    tick(delta: number): void {
        throw new Error("Method not implemented.")
    }
    render(): void {
        throw new Error("Method not implemented.")
    }
    destroy(){
        this.renderer.destroy()
        this.domElement.remove()
    }
}