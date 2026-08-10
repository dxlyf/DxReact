import { EventEmitter } from "./event_emitter"
import { Renderer } from "./renderer"

export interface StageOptions{
    container?: HTMLDivElement
    width: number
    height: number
    dpr?:number
    renderMode?:'canvas'|'svg'
}
export type StageEvents = {
    preinit:[stage:Stage]
    init:[stage:Stage]
    tick:[delta: number]
}
export interface Stage extends EventEmitter<StageEvents>{
    options: StageOptions
    width: number
    height: number
    dpr: number
    renderMode: string
    renderer: Renderer
    domElement: HTMLDivElement
    tick(delta: number): void
    render(): void
    destroy():void
}