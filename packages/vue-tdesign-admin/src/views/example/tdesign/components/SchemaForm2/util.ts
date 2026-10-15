import type { AllFieldSchema,FieldSchema,ObjectFieldSchema,AtomFieldSchema,ArrayFieldSchema,FormSchema, FieldPath } from './types'

const normalizeSchema=(Schema:AllFieldSchema):AllFieldSchema=>{
    if(Schema.type==='array'){
        return normalizeArrayFieldSchema(Schema)
    }
    else if(Schema.type==='object'){
        return normalizeObjectFieldSchema(Schema)
    }
    else {
        return normalizeAtomFieldSchema(Schema)
    }
}

const normalizeAtomFieldSchema=(Schema:AtomFieldSchema)=>{
    return {
        type:'atom',
        props:{},
        builtin:true,
        wrapper:true,
        isRoot:false,
        defaultValue:'',
        ...Schema,
    }
}
const normalizeArrayFieldSchema=(Schema:ArrayFieldSchema)=>{
    const {schemas,valueType,...restSchema}=Schema
    return {
        valueType:'array<object>',
        sortable:false,
        allowAdded:true,
        allowAddedField:true,
        isRoot:false,
        defaultValue:[],
        schemas:(schemas as AllFieldSchema[]).map((item)=>normalizeSchema(item)),
        ...restSchema
    } as ArrayFieldSchema
}
const normalizeObjectFieldSchema=(Schema:ObjectFieldSchema)=>{
    const {schemas,...restSchema}=Schema
    return {
        sortable:false,
        allowAddedField:true,
        isRoot:false,
        defaultValue:{},
        schemas:(schemas as AllFieldSchema[]).map((item)=>normalizeSchema(item)),
        ...restSchema
    } as ObjectFieldSchema
}
const createAtomFieldSchema=(options:Partial<AtomFieldSchema>)=>{
    return {
        type:'atom',
        props:{},
        builtin:false,
        wrapper:true,
        isRoot:false,
        defaultValue:'',
        ...options,
    } as AtomFieldSchema
}
const createArrayFieldSchema=(options:Partial<ArrayFieldSchema>)=>{
    return {
        type:'array',
        valueType:'array<object>',
        sortable:false,
        allowAdded:true,
        allowAddedField:true,
        isRoot:false,
        defaultValue:[],
        ...options,
    } as ArrayFieldSchema
}
const createObjectFieldSchema=(options:Partial<ObjectFieldSchema>)=>{
    return {
        type:'object',
        allowAddedField:true,
        isRoot:false,
        defaultValue:{},
        ...options,
    } as ObjectFieldSchema
}
const createItemBySchema=(schema:AllFieldSchema):any=>{
    if(schema.type==='array'){
        if(schema.valueType==='array<string>'){
            return getDeepValue(schema.schemas,[0,'defaultValue'],'')
        }else{
            return (schema.schemas as AllFieldSchema[]).reduce((acc,cur)=>{
                acc[cur.key]=cloneValue(cur.defaultValue)
                return acc
            },{} as any)
        }
    }
    else if(schema.type==='object'){
        return schema.schemas.reduce((acc,cur)=>{
            acc[cur.key]=cloneValue(cur.defaultValue)
            return acc
        },{} as Record<string,any>)
    }
    else {
        return isNullOrUndefined(schema.defaultValue)?'':schema.defaultValue
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
        currentObj = currentObj[path[i]]
        if (!isObject(currentObj)) {
            return defaultValue
        }
    }
    return currentObj[path[path.length - 1]]
}
const removeDeepKey=(obj: any, path: (string | number)[]) => {
    if (path.length <= 0) {
        return
    }
    let currentObj = obj
    for (let i = 0; i < path.length - 1; i++) {
        if (!isObject(currentObj)) {
            return
        }
        currentObj = currentObj[path[i]]
    }
    delete currentObj[path[path.length - 1]]
}
const cloneValue=(value:any)=>{
    return JSON.parse(JSON.stringify(value))
}
/**
 * 按路径排除字段
 * @param obj 原始对象
 * @param excludePaths 要排除的路径，如 ['info.secret', 'user.password']
 *                    支持数组索引，如 'list.0.password'
 */
function omitByPaths<T>(obj: T, excludePaths: string[], currentPath = ''): T {
  if (Array.isArray(obj)) {
    return obj.map((item, i) =>
      omitByPaths(item, excludePaths, currentPath ? `${currentPath}.${i}` : `${i}`)
    ) as T;
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${k}` : k;
      // 命中排除路径，跳过
      if (excludePaths.includes(path)) continue;
      result[k] = omitByPaths(v, excludePaths, path);
    }
    return result;
  }

  return obj;
}



export { 
    omitByPaths,
    removeDeepKey,
    setDeepValue, 
    getDeepValue ,
    isNullOrUndefined,
    isObject,
    cloneValue,
    normalizeArrayFieldSchema,
    normalizeAtomFieldSchema,
    normalizeObjectFieldSchema,
    normalizeSchema,
    createAtomFieldSchema,
    createArrayFieldSchema,
    createObjectFieldSchema,
    createItemBySchema,
}