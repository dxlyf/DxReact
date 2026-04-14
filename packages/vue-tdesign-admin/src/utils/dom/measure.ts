
type MeasureOptions={
    width?:number // 宽度
    height?:number // 高度
    text?:string|HTMLElement // 文本内容或元素
    breakWord?:boolean // 是否换行
    fontSize?:number // 字体大小
    fontWeight?:number // 字体粗细
    fontFamily?:string // 字体系列
    fontStyle?:string // 字体样式
    textDecoration?:string // 文本装饰
    lineHeight?:number // 行高
    
}
type MeasureResult={
    width:number // 宽度
    height:number // 高度
    row:number // 行数
}
export const measureText = (options:MeasureOptions) => {
  const measureDom=document.createElement('div')
  
  return metrics
}