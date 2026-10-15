import type { AllFieldScheme,FieldScheme,ObjectFieldScheme,AtomFieldScheme,ArrayFieldScheme,FormScheme, FieldPath } from './types'

const normalizeScheme=(scheme:AllFieldScheme):AllFieldScheme=>{
    if(scheme.type==='array'){
        return normalizeArrayFieldScheme(scheme)
    }
    else if(scheme.type==='object'){
        return normalizeObjectFieldScheme(scheme)
    }
    else {
        return normalizeAtomFieldScheme(scheme)
    }
}

const normalizeAtomFieldScheme=(scheme:AtomFieldScheme)=>{
    return {
        type:'atom',
        props:{},
        builtin:true,
        wrapper:true,
        isRoot:false,
        ...scheme,
    }
}
const normalizeArrayFieldScheme=(scheme:ArrayFieldScheme)=>{
    const {schemes,valueType,...restScheme}=scheme
    return {
        valueType:'array<object>',
        sortable:false,
        allowAdded:true,
        allowAddedField:true,
        isRoot:false,
        defaultValue:[],
        schemes:(schemes as AllFieldScheme[]).map((item)=>normalizeScheme(item)),
        ...restScheme
    } as ArrayFieldScheme
}
const normalizeObjectFieldScheme=(scheme:ObjectFieldScheme)=>{
    const {schemes,...restScheme}=scheme
    return {
        sortable:false,
        allowAddedField:true,
        isRoot:false,
        defaultValue:{},
        schemes:(schemes as AllFieldScheme[]).map((item)=>normalizeScheme(item)),
        ...restScheme
    } as ObjectFieldScheme
}
const createAtomFieldScheme=(options:Partial<AtomFieldScheme>)=>{
    return {
        type:'atom',
        props:{},
        builtin:false,
        wrapper:true,
        isRoot:false,
        defaultValue:'',
        ...options,
    } as AtomFieldScheme
}
const createArrayFieldScheme=(options:Partial<ArrayFieldScheme>)=>{
    return {
        type:'array',
        valueType:'array<object>',
        sortable:false,
        allowAdded:true,
        allowAddedField:true,
        isRoot:false,
        defaultValue:[],
        ...options,
    } as ArrayFieldScheme
}
const createObjectFieldScheme=(options:Partial<ObjectFieldScheme>)=>{
    return {
        type:'object',
        allowAddedField:true,
        isRoot:false,
        defaultValue:{},
        ...options,
    } as ObjectFieldScheme
}
const createItemByScheme=(scheme:AllFieldScheme):any=>{
    if(scheme.type==='array'){
        if(scheme.valueType==='array<string>'){
            return getDeepValue(scheme.schemes,[0,'defaultValue'],'')
        }else{
            return (scheme.schemes as AllFieldScheme[]).reduce((acc,cur)=>{
                acc[cur.key]=createItemByScheme(cur)
                return acc
            },{} as any)
        }
    }
    else if(scheme.type==='object'){
        return scheme.schemes.reduce((acc,cur)=>{
            acc[cur.key]=createItemByScheme(cur)
            return acc
        },{} as Record<string,any>)
    }
    else {
        return isNullOrUndefined(scheme.defaultValue)?'':scheme.defaultValue
    }
}
const isUndefined = (val: any) => val === undefined
const isNullOrUndefined = (val: any) => isUndefined(val) || val === null
const isObject = (val: any) => {
    return typeof val === 'object' && val !== null
}
const setDeepValue = (obj: any, path: (string | number)[], value: any) => {
    if (path.length <= 0) {
        return
    }
    let currentObj = obj
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]
        if (!isObject(currentObj[key])) {
            // 中间容器缺失时新建，并挂回父级（否则写入会落到游离对象上）
            currentObj[key] = typeof path[i + 1] === 'number' ? [] : {}
        }
        currentObj = currentObj[key]
    }
    currentObj[path[path.length - 1]] = value
}
const getDeepValue = (obj: any, path: (string | number)[],defaultValue?:any) => {
    if (path.length <= 0) {
        return defaultValue
    }
    if (path.length === 1) {
        const value=obj[path[0]]
        return isNullOrUndefined(value) ? defaultValue : value
    }
    let currentObj = obj
    for (let i = 0; i < path.length-1; i++) {
        if (!isObject(currentObj)) {
            return defaultValue
        }
        currentObj = currentObj[path[i]]
    }
    return currentObj[path[path.length - 1]]
}
export { 
    setDeepValue, 
    getDeepValue ,
    isNullOrUndefined,
    isObject,
    normalizeArrayFieldScheme,
    normalizeAtomFieldScheme,
    normalizeObjectFieldScheme,
    normalizeScheme,
    createAtomFieldScheme,
    createArrayFieldScheme,
    createObjectFieldScheme,
    createItemByScheme
}