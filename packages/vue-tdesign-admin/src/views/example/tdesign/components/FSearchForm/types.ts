import type {TdColProps} from 'tdesign-vue-next'
export type SearchField={
    name:string
    type:string
    span?:number
    colProps?:TdColProps
    visible?:boolean
    defaultValue?:any
    props?:Record<string,any>
}
export type InnerSearchField=Omit<SearchField,'span'>&{
    key:string
    hidden:boolean
    slots?:Record<string,any>
}
export type SearchFormProps={
    loading?:boolean // 加载中
    ready?:Promise<void> // 组件初始化完成
    mountedQuery?:boolean // 是否在组件挂载时查询查询参数
    defaultColumns?:number // 默认列数
    spans?:number // 总列数
    collapseShowRows?:number // 折叠显示行数
    syncParamsToUrl?:boolean // 是否同步查询参数到URL参数
    showExpand?:boolean // 是否显示展开按钮
    defaultExpand?:boolean // 默认展开
    columns:SearchField[] // 查询表单列
}