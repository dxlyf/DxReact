export interface RendererOptions{
    
}
export type RendererEvents={
    resize:[width:number,height:number,dpr:number]
}
export interface Renderer {
    type: string
    width: number
    height: number
    dpr: number
    domElement:HTMLElement
    setDpr(dpr: number): void
    setSize(width: number, height: number,updateStyle:boolean): void
    destroy():void
    // 绘制
   // drawPath()

}
export interface RendererConstructor {
    new(): Renderer
}