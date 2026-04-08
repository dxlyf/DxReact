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
    ready?:Promise<void>
    mountedQuery?:boolean
    defaultColumns?:number
    spans?:number
    collapseShowRows?:number
    syncParamsToUrl?:boolean
    showExpand?:boolean
    defaultExpand?:boolean
    columns:SearchField[]
}