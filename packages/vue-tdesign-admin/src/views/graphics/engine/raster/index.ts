import {PathBuilder, Vector2Like} from '@dxyl/math2'


/** RGBA 像素值，各分量 0~255（straight alpha，与 canvas ImageData 一致） */
export type RGBA = [number, number, number, number]

/**
 * 像素图（软件光栅化的目标缓冲）
 * RGBA8 存储，每像素 4 字节，行主序排列：
 * data[(y * width + x) * 4 + 0..3] = r, g, b, a
 */
export class Pixmap {
    data: Uint8ClampedArray
    constructor(public width:number,public height:number){
        this.data=new Uint8ClampedArray(width*height*4)
    }

    /** 像素在缓冲中的起始下标 */
    protected index(x:number,y:number):number{
        return (y*this.width+x)<<2
    }

    /** 坐标是否落在图内 */
    contains(x:number,y:number):boolean{
        return x>=0&&y>=0&&x<this.width&&y<this.height
    }

    /** 直写像素（覆盖式，不做混合）；越界忽略，便于光栅化时免裁剪 */
    write(x:number,y:number,rgba:[number,number,number,number]){
        if(!this.contains(x,y)){
            return
        }
        const i=this.index(x,y)
        this.data[i]=rgba[0]
        this.data[i+1]=rgba[1]
        this.data[i+2]=rgba[2]
        this.data[i+3]=rgba[3]
    }

    /** 读取像素；越界返回透明黑 */
    read(x:number,y:number):RGBA{
        if(!this.contains(x,y)){
            return [0,0,0,0]
        }
        const i=this.index(x,y)
        return [this.data[i],this.data[i+1],this.data[i+2],this.data[i+3]]
    }

    /**
     * source-over 混合写入（straight alpha 合成）
     * outA = srcA + dstA * (1 - srcA)，颜色按双方 alpha 加权
     * 抗锯齿光栅化时先把 coverage 乘进 rgba[3] 再调用本方法
     */
    blend(x:number,y:number,rgba:RGBA){
        if(!this.contains(x,y)){
            return
        }
        const srcA=rgba[3]/255
        if(srcA<=0){
            return
        }
        if(srcA>=1){
            this.write(x,y,rgba)
            return
        }
        const i=this.index(x,y)
        const dstA=this.data[i+3]/255
        const outA=srcA+dstA*(1-srcA)
        if(outA<=0){
            this.data[i]=this.data[i+1]=this.data[i+2]=this.data[i+3]=0
            return
        }
        for(let c=0;c<3;c++){
            const src=rgba[c]/255
            const dst=this.data[i+c]/255
            this.data[i+c]=(src*srcA+dst*dstA*(1-srcA))/outA*255
        }
        this.data[i+3]=outA*255
    }

    /** 整图填充（缺省清成透明黑） */
    clear(rgba:RGBA=[0,0,0,0]){
        const data=this.data
        for(let i=0;i<data.length;i+=4){
            data[i]=rgba[0]
            data[i+1]=rgba[1]
            data[i+2]=rgba[2]
            data[i+3]=rgba[3]
        }
    }

    /** 矩形填充，自动裁剪到图内 */
    fillRect(x:number,y:number,width:number,height:number,rgba:RGBA){
        const x0=Math.max(0,Math.floor(x))
        const y0=Math.max(0,Math.floor(y))
        const x1=Math.min(this.width,Math.ceil(x+width))
        const y1=Math.min(this.height,Math.ceil(y+height))
        for(let yy=y0;yy<y1;yy++){
            for(let xx=x0;xx<x1;xx++){
                this.write(xx,yy,rgba)
            }
        }
    }

    /** 转成 ImageData，可配合 2d canvas 的 putImageData 展示 */
    toImageData():ImageData{
        const image=new ImageData(this.width,this.height)
        image.data.set(this.data)
        return image
    }

    /** 转成 canvas，便于预览光栅化结果 */
    toCanvas():HTMLCanvasElement{
        const canvas=document.createElement('canvas')
        canvas.width=this.width
        canvas.height=this.height
        const ctx=canvas.getContext('2d')
        if(ctx){
            ctx.putImageData(this.toImageData(),0,0)
        }
        return canvas
    }
}

/** 路径光栅化入口（待实现） */
export function rasterization(path:PathBuilder){

    const polygons=path.toPolygons(true)

    const out:Vector2Like[][]=[]

}
