import {PathBuilder} from '@dxyl/math2'


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

    /**
     * 把当前像素数据放大后画到 canvas 上（便于观察像素），不改动 data
     * 起点为 margin，每个像素放大成 size×size 的格子；有颜色的像素填成该颜色，网格线为黑色
     */
    drawGrid(ctx:CanvasRenderingContext2D,size:number,margin:number){
        if(size<=0){
            return
        }
        const cols=this.width
        const rows=this.height
        // 先按数据填格子，再画网格线，避免线被格子覆盖
        for(let row=0;row<rows;row++){
            for(let col=0;col<cols;col++){
                const i=this.index(col,row)
                const alpha=this.data[i+3]
                if(alpha>0){
                    ctx.fillStyle=`rgba(${this.data[i]},${this.data[i+1]},${this.data[i+2]},${alpha/255})`
                    ctx.fillRect(margin+col*size,margin+row*size,size,size)
                }
            }
        }
        // 网格线放进同一条 path，一次 stroke 画完
        const gridWidth=cols*size
        const gridHeight=rows*size
        ctx.beginPath()
        for(let col=0;col<=cols;col++){
            // +0.5 让 1px 线落在像素中心，避免描边发虚
            const x=margin+col*size+0.5
            ctx.moveTo(x,margin)
            ctx.lineTo(x,margin+gridHeight)
        }
        for(let row=0;row<=rows;row++){
            const y=margin+row*size+0.5
            ctx.moveTo(margin,y)
            ctx.lineTo(margin+gridWidth,y)
        }
        ctx.strokeStyle='#000'
        ctx.lineWidth=1
        ctx.stroke()
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

/** 定点数小数位数：1/64 像素，与 FreeType 的 26.6 定点坐标一致 */
const PIXEL_BITS=6
/** 1 像素对应的定点长度 */
const ONE_PIXEL=1<<PIXEL_BITS

/** 灰度光栅化的格（cell）：同一行内按 x 升序串成链表 */
interface Cell {
    /** 列号 */
    x:number
    /** 纵向绕数累计（定点数单位） */
    cover:number
    /** 边对格左边界的有向面积积分（2 倍，定点数平方单位） */
    area:number
    next:Cell|null
}

/** 扫描出的水平区段（span）：一行上连续 len 个像素共用同一覆盖率 */
interface Span {
    x:number
    y:number
    len:number
    /** 覆盖率 0~255 */
    coverage:number
}

/**
 * 路径光栅化：参考 FreeType 灰度光栅化（ftgrays.c），分三步：
 * 1. 轮廓按 1/64 像素的定点数拆进格（cell），每格累计 cover 与 area；
 * 2. 逐行扫描格，把覆盖率（0~255）相同的连续像素合成水平区段（span）；
 * 3. 按 span 把覆盖率乘进颜色 alpha，做抗锯齿填充。
 * @param pixmap 输出目标，路径按原有坐标落在图上，超出图外的部分自动裁剪
 * @param path 待填充路径
 * @param color 填充色，alpha 会再乘以像素覆盖率
 */
export function rasterization(pixmap:Pixmap,path:PathBuilder,color:RGBA=[0,0,0,255]):Pixmap{
    // 轮廓一次性转成 26.6 定点数（1/64 像素），后续拆分不再重复换算
    const polygons=path.toPolygons(true).map(polygon=>polygon.map(p=>({
        x:Math.round(p.x*ONE_PIXEL),
        y:Math.round(p.y*ONE_PIXEL)
    })))

    // 尺寸由目标 pixmap 决定，路径坐标不平移，保持调用者给定的位置
    const width=pixmap.width
    const height=pixmap.height
    if(width<=0||height<=0||polygons.length===0){
        return pixmap
    }

    // 每行一条按 x 升序的格链表（对应 FreeType 的 ycells）
    const ycells:Array<Cell|null>=new Array(height).fill(null)

    /** 取指定行的 x 格，不存在则按序插入新格 */
    const getCell=(x:number,y:number):Cell=>{
        let cell=ycells[y]
        let prev:Cell|null=null
        while(cell&&cell.x<x){
            prev=cell
            cell=cell.next
        }
        if(cell&&cell.x===x){
            return cell
        }
        const created:Cell={x,cover:0,area:0,next:cell}
        if(prev){
            prev.next=created
        }else{
            ycells[y]=created
        }
        return created
    }

    /** 把一条落在单个格内的线段累计进去：cover 为纵向长度，area 为 2 倍面积积分 */
    const addCell=(x:number,y:number,cover:number,area:number)=>{
        const cell=getCell(x,y)
        cell.cover+=cover
        cell.area+=area
    }

    /** 图底在定点数中的 y 上界 */
    const limitY=height*ONE_PIXEL

    /** 把一条定点数线段按行、列边界拆进格 */
    const addEdge=(x0:number,y0:number,x1:number,y1:number)=>{
        if(y0===y1){
            return
        }
        // 统一成 y 递增，原始方向记在 dir 上（影响 cover/area 符号）
        let dir=1
        if(y1<y0){
            dir=-1
            let t=x0
            x0=x1
            x1=t
            t=y0
            y0=y1
            y1=t
        }
        if(y1<=0||y0>=limitY){
            return
        }
        // 纵向裁剪到图内
        if(y0<0){
            x0+=Math.trunc((x1-x0)*(0-y0)/(y1-y0))
            y0=0
        }
        if(y1>limitY){
            x1=x0+Math.trunc((x1-x0)*(limitY-y0)/(y1-y0))
            y1=limitY
        }
        const dx=x1-x0
        const dy=y1-y0
        if(dy<=0){
            return
        }

        // 逐行遍历这条边覆盖到的像素行（y 为行号，y*ONE_PIXEL 是该行在定点数中的 y）
        for(let y=y0>>PIXEL_BITS;y*ONE_PIXEL<y1;y++){
            // 当前行的上下边界（定点数）
            const top=y*ONE_PIXEL
            const bottom=Math.min(top+ONE_PIXEL,y1)
            // 边在本行内的实际起点：行顶与边起点取大（第一行可能从边中间开始）
            const ya=top>y0?top:y0
            if(bottom<=ya){
                continue
            }
            // 线性插值：边在 ya 与 bottom 处的 x（定点数）
            const xa=x0+Math.trunc(dx*(ya-y0)/dy)
            const xb=x0+Math.trunc(dx*(bottom-y0)/dy)
            // 本行内这条边最终落在哪一列（列号即格子的 x）
            const end=Math.floor(xb/ONE_PIXEL)
            // 沿 x 方向跨列的方向：一般是从左到右，只有极端退化时才为 -1
            const step=xb>=xa?1:-1
            // ex：当前正在处理的列号；px/py：上一个断点（初始为本行起点）
            let ex=Math.floor(xa/ONE_PIXEL)
            let px=xa
            let py=ya
            // 一条边在一行里可能横跨多个像素列，而每个格只负责一列，
            // 所以在每条列边界处把边打断，逐段累计到所在列的格里
            while(ex!==end){
                // 当前列的边界：向右走取右边界 (ex+1)*ONE_PIXEL，向左走取左边界 ex*ONE_PIXEL
                const boundary=(step>0?ex+1:ex)*ONE_PIXEL
                // 边在列边界处的 y（线性插值）
                const ny=ya+Math.trunc((boundary-xa)*(bottom-ya)/(xb-xa))
                // 本段在 y 上的长度（>0 才真正落在这个格里）
                const dv=ny-py
                if(dv>0){
                    // cover 累加纵向长度；area 是梯形公式 (x起+x止)*dv，
                    // 其中 x 换成相对该格左边界的局部坐标，用于稍后算格内覆盖率
                    addCell(ex,y,dir*dv,dir*((px-ex*ONE_PIXEL)+(boundary-ex*ONE_PIXEL))*dv)
                }
                // 断点前移，进入下一列
                px=boundary
                py=ny
                ex+=step
            }
            // 跨完所有列边界后，[py, bottom] 这一段整体落在最后一列 end 里
            const dv=bottom-py
            if(dv>0){
                addCell(end,y,dir*dv,dir*((px-end*ONE_PIXEL)+(xb-end*ONE_PIXEL))*dv)
            }
        }
    }

    for(const polygon of polygons){
        const count=polygon.length
        if(count<2){
            continue
        }
        for(let i=0;i<count;i++){
            const p=polygon[i]
            const q=polygon[(i+1)%count]
            addEdge(p.x,p.y,q.x,q.y)
        }
    }

    /** 2 倍面积换算成 0~255 覆盖率：满格为 2 * ONE_PIXEL² */
    const coverageOf=(area:number):number=>{
        const coverage=(Math.abs(area)+(1<<(PIXEL_BITS*2-8)))>>(PIXEL_BITS*2-7)
        return coverage>255?255:coverage
    }

    // 逐行扫描格，合成 span（对应 FreeType 的 gray_sweep）
    const spans:Span[]=[]
    for(let y=0;y<height;y++){
        let cover=0
        let x=0
        for(let cell=ycells[y];cell;cell=cell.next){
            const left=x>0?x:0
            // 两格之间整段像素的覆盖率只由累计 cover 决定
            if(cell.x>left&&cover!==0){
                spans.push({x:left,y,len:cell.x-left,coverage:coverageOf(cover*ONE_PIXEL*2)})
            }
            cover+=cell.cover
            // 格内像素：用累计 cover 减去格内已积分的面积得到剩余覆盖
            const area=cover*ONE_PIXEL*2-cell.area
            if(area!==0&&cell.x>=0&&cell.x<width){
                spans.push({x:cell.x,y,len:1,coverage:coverageOf(area)})
            }
            x=cell.x+1
        }
        if(cover!==0&&x<width){
            const left=x>0?x:0
            if(left<width){
                spans.push({x:left,y,len:width-left,coverage:coverageOf(cover*ONE_PIXEL*2)})
            }
        }
    }

    // 按 span 渲染：覆盖率乘进 alpha 后做 source-over 混合
    for(const span of spans){
        const alpha=Math.round(color[3]*span.coverage/255)
        if(alpha<=0){
            continue
        }
        const rgba:RGBA=[color[0],color[1],color[2],alpha]
        for(let i=0;i<span.len;i++){
            pixmap.blend(span.x+i,span.y,rgba)
        }
    }

    return pixmap
}


export function rasterization2(pixmap:Pixmap,path:PathBuilder,color:RGBA=[0,0,0,255]):Pixmap{

    const PIXEL_BITS=8
    const ONE_PIXEL=1<<PIXEL_BITS // 256
    // 轮廓一次性转成 26.6 定点数（1/64 像素），后续拆分不再重复换算
    const polygons=path.toPolygons(true).map(polygon=>polygon.map(p=>({
        x:Math.round(p.x*ONE_PIXEL),
        y:Math.round(p.y*ONE_PIXEL)
    })))

    // 尺寸由目标 pixmap 决定，路径坐标不平移，保持调用者给定的位置
    const width=pixmap.width
    const height=pixmap.height
    if(width<=0||height<=0||polygons.length===0){
        return pixmap
    }

    // 每行一条按 x 升序的格链表（对应 FreeType 的 ycells）
    const ycells:Array<Cell|null>=new Array(height).fill(null)

    /** 取指定行的 x 格，不存在则按序插入新格 */
    const getCell=(x:number,y:number):Cell=>{
        let cell=ycells[y]
        let prev:Cell|null=null
        while(cell&&cell.x<x){
            prev=cell
            cell=cell.next
        }
        if(cell&&cell.x===x){
            return cell
        }
        const created:Cell={x,cover:0,area:0,next:cell}
        if(prev){
            prev.next=created
        }else{
            ycells[y]=created
        }
        return created
    }

    /** 把一条落在单个格内的线段累计进去：cover 为纵向长度，area 为 2 倍面积积分 */
    const addCell=(x:number,y:number,cover:number,area:number)=>{
        const cell=getCell(x,y)
        cell.cover+=cover
        cell.area+=area
    }

    /** 图底在定点数中的 y 上界 */
    const limitY=height*ONE_PIXEL

    /** 把一条定点数线段按行、列边界拆进格 */
    const addEdge=(x0:number,y0:number,x1:number,y1:number)=>{
        if(y0===y1){
            return
        }
        // 统一成 y 递增，原始方向记在 dir 上（影响 cover/area 符号）
        let dir=1
        if(y1<y0){
            dir=-1
            let t=x0
            x0=x1
            x1=t
            t=y0
            y0=y1
            y1=t
        }
        if(y1<=0||y0>=limitY){
            return
        }
        // 纵向裁剪到图内
        if(y0<0){
            x0+=Math.trunc((x1-x0)*(0-y0)/(y1-y0))
            y0=0
        }
        if(y1>limitY){
            x1=x0+Math.trunc((x1-x0)*(limitY-y0)/(y1-y0))
            y1=limitY
        }
        const dx=x1-x0
        const dy=y1-y0
        if(dy<=0){
            return
        }

        // 逐行遍历这条边覆盖到的像素行（y 为行号，y*ONE_PIXEL 是该行在定点数中的 y）
        for(let y=y0>>PIXEL_BITS;y*ONE_PIXEL<y1;y++){
            // 当前行的上下边界（定点数）
            const top=y*ONE_PIXEL
            const bottom=Math.min(top+ONE_PIXEL,y1)
            // 边在本行内的实际起点：行顶与边起点取大（第一行可能从边中间开始）
            const ya=top>y0?top:y0
            if(bottom<=ya){
                continue
            }
            // 线性插值：边在 ya 与 bottom 处的 x（定点数）
            const xa=x0+Math.trunc(dx*(ya-y0)/dy)
            const xb=x0+Math.trunc(dx*(bottom-y0)/dy)
            // 本行内这条边最终落在哪一列（列号即格子的 x）
            const end=Math.floor(xb/ONE_PIXEL)
            // 沿 x 方向跨列的方向：一般是从左到右，只有极端退化时才为 -1
            const step=xb>=xa?1:-1
            // ex：当前正在处理的列号；px/py：上一个断点（初始为本行起点）
            let ex=Math.floor(xa/ONE_PIXEL)
            let px=xa
            let py=ya
            // 一条边在一行里可能横跨多个像素列，而每个格只负责一列，
            // 所以在每条列边界处把边打断，逐段累计到所在列的格里
            while(ex!==end){
                // 当前列的边界：向右走取右边界 (ex+1)*ONE_PIXEL，向左走取左边界 ex*ONE_PIXEL
                const boundary=(step>0?ex+1:ex)*ONE_PIXEL
                // 边在列边界处的 y（线性插值）
                const ny=ya+Math.trunc((boundary-xa)*(bottom-ya)/(xb-xa))
                // 本段在 y 上的长度（>0 才真正落在这个格里）
                const dv=ny-py
                if(dv>0){
                    // cover 累加纵向长度；area 是梯形公式 (x起+x止)*dv，
                    // 其中 x 换成相对该格左边界的局部坐标，用于稍后算格内覆盖率
                    addCell(ex,y,dir*dv,dir*((px-ex*ONE_PIXEL)+(boundary-ex*ONE_PIXEL))*dv)
                }
                // 断点前移，进入下一列
                px=boundary
                py=ny
                ex+=step
            }
            // 跨完所有列边界后，[py, bottom] 这一段整体落在最后一列 end 里
            const dv=bottom-py
            if(dv>0){
                addCell(end,y,dir*dv,dir*((px-end*ONE_PIXEL)+(xb-end*ONE_PIXEL))*dv)
            }
        }
    }

    for(const polygon of polygons){
        const count=polygon.length
        if(count<2){
            continue
        }
        for(let i=0;i<count;i++){
            const p=polygon[i]
            const q=polygon[(i+1)%count]
            addEdge(p.x,p.y,q.x,q.y)
        }
    }

    /** 2 倍面积换算成 0~255 覆盖率：满格为 2 * ONE_PIXEL² */
    const coverageOf=(area:number):number=>{
        const coverage=(Math.abs(area)+(1<<(PIXEL_BITS*2-8)))>>(PIXEL_BITS*2-7)
        return coverage>255?255:coverage
    }

    // 逐行扫描格，合成 span（对应 FreeType 的 gray_sweep）
    const spans:Span[]=[]
    for(let y=0;y<height;y++){
        let cover=0
        let x=0
        for(let cell=ycells[y];cell;cell=cell.next){
            const left=x>0?x:0
            // 两格之间整段像素的覆盖率只由累计 cover 决定
            if(cell.x>left&&cover!==0){
                spans.push({x:left,y,len:cell.x-left,coverage:coverageOf(cover*ONE_PIXEL*2)})
            }
            cover+=cell.cover
            // 格内像素：用累计 cover 减去格内已积分的面积得到剩余覆盖
            const area=cover*ONE_PIXEL*2-cell.area
            if(area!==0&&cell.x>=0&&cell.x<width){
                spans.push({x:cell.x,y,len:1,coverage:coverageOf(area)})
            }
            x=cell.x+1
        }
        if(cover!==0&&x<width){
            const left=x>0?x:0
            if(left<width){
                spans.push({x:left,y,len:width-left,coverage:coverageOf(cover*ONE_PIXEL*2)})
            }
        }
    }

    // 按 span 渲染：覆盖率乘进 alpha 后做 source-over 混合
    for(const span of spans){
        const alpha=Math.round(color[3]*span.coverage/255)
        if(alpha<=0){
            continue
        }
        const rgba:RGBA=[color[0],color[1],color[2],alpha]
        for(let i=0;i<span.len;i++){
            pixmap.blend(span.x+i,span.y,rgba)
        }
    }

    return pixmap
}
