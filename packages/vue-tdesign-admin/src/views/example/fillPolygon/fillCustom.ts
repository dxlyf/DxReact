export interface PolyVertex { x: number, y: number }
/** 填充颜色（0-255） */
export interface FillColor { r: number, g: number, b: number }

type Span={
    x:number,
    y:number,
    len:number,
}
type Edge={
    x:number,
    minY:number,
    maxY:number,
    inveseSlope:number

}
type FT_Pos = number
class Fx28 {
    static SHIFT = 8 // 小数位位数：2^8 = 256，即每个浮点单位对应 256 个定点单位
    static VALUE = 1 << 8      // 256：定点缩放因子，1.0（像素） = 256（定点）
    /**
     * 浮点 → 定点。四舍五入是为了让误差均匀分布在 ±0.5 定点单位内，
     * 避免向下取整导致的系统性偏移。
     */
    static from(v: number): FT_Pos { return Math.round(v * Fx28.VALUE) }
    /** 定点 → 浮点（仅用于求像素列范围等需要真实坐标的场景） */
    static to(v: FT_Pos): number { return v / Fx28.VALUE }
    /** 定点乘法：四舍五入保留精度 */
    static mul(a: FT_Pos, b: FT_Pos): FT_Pos { return Math.round((a * b) / Fx28.VALUE) }
    /**
     * 定点除法：除零返回 0（水平边已在建表时跳过）。
     * 先将被除数放大 VALUE 倍再除以除数，使商保持 26.6 定点格式。
     */
    static div(a: FT_Pos, b: FT_Pos): FT_Pos {
        if (b === 0) return 0
        return Math.round((a * Fx28.VALUE) / b)
    }
}
export function fillPolygonCustom(vertices: PolyVertex[], imageData: ImageData, color: FillColor){

    let pts=vertices.map(v=>({
        x:Fx28.from(v.x),
        y:Fx28.from(v.y),
    }))
    // 计算高度
    let minY=Infinity
    let maxY=-Infinity
    let edges:Edge[]=[]
    for(let i=0;i<pts.length;i++){

        const p0=pts[i]
        const p1=pts[(i+1)%pts.length]
        minY=Math.min(minY,p0.y)
        maxY=Math.max(maxY,p0.y)
        if(p0.y==p1.y){
            continue
        }
        let inveseSlope=Fx28.div(p1.x-p0.x,p1.y-p0.y)
        edges.push({
            x:p0.x<p1.x?p0.x:p1.x,
            minY:Math.min(p0.y,p1.y),
            maxY:Math.max(p0.y,p1.y),
            inveseSlope,
        })
    }
    // 填充扫描线
    let low=Math.max(0,Math.floor(Fx28.to(minY)))
    let high=Math.min(imageData.height-1,Math.ceil(Fx28.to(maxY)))
    for(let y=low;y<high;y++){
        let y0=y;
        let y1=y+1
        
        
    }

}