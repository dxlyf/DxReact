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
        wrapper:'field',
        isRoot:false,
        defaultValue:'',
        ...Schema,
    } as AtomFieldSchema
}
const normalizeArrayFieldSchema=(Schema:ArrayFieldSchema)=>{
    const {schemas,...restSchema}=Schema
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
        wrapper:'field',
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
/**
 * 按路径读取深层值：路径上任意一层不存在（或取到的值为 null/undefined）时返回 defaultValue。
 * 路径为空时直接返回 defaultValue。
 */
const getDeepValue = (obj: any, path: (string | number)[], defaultValue?: any) => {
    if (path.length <= 0) {
        return cloneValue(defaultValue)
    }
    let currentObj = obj
    for (let i = 0, len = path.length; i < len; i++) {
        // 中间层不存在（含 null / 基本类型）时无法继续下钻，直接兜底
        if (!isObject(currentObj)) {
            return cloneValue(defaultValue)
        }
        currentObj = currentObj[path[i]]
    }
    return isNullOrUndefined(currentObj) ? cloneValue(defaultValue) : currentObj
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
    if(isNullOrUndefined(value)){
        return value
    }
    return JSON.parse(JSON.stringify(value))
}
/**
 * 比较两组字段的字段名集合是否一致（顺序无关）。
 * 用于判断字段列表结构是否变化，未变化时复用缓存，避免在渲染过程中反复写入响应式状态。
 */
const hasSameFieldNames = (a: { name: string }[], b: { name: string }[]) => {
    if (a.length !== b.length) return false
    const names = new Set(a.map((item) => item.name))
    return b.every((item) => names.has(item.name))
}
/**
 * 数组项顺序调整：把 from 位置的项移动到 to 位置后，原下标 index 对应的新下标。
 * 用于同步迁移按下标记录的缓存 / 排除路径。
 */
const moveArrayIndex = (index: number, from: number, to: number) => {
    if (index === from) return to
    if (from < to && index > from && index <= to) return index - 1
    if (from > to && index >= to && index < from) return index + 1
    return index
}
/**
 * 按上一次的字段顺序合并字段列表：
 * - 复用上一次的勾选状态
 * - 已从 value 中排除、但需要保留（canRemove）的字段维持在原有位置，避免跳到列表末尾
 * - 新增字段追加到列表末尾
 */
const mergeFieldsByPrevOrder = <T extends { name: string; checked: boolean; canRemove: boolean }>(
    prev: T[],
    cur: T[]
): T[] => {
    const curMap = new Map(cur.map((item) => [item.name, item]))
    const result: T[] = []
    const used = new Set<string>()
    prev.forEach((item) => {
        const next = curMap.get(item.name)
        if (next) {
            next.checked = item.checked
            result.push(next)
            used.add(item.name)
        } else if (item.canRemove) {
            result.push(item)
            used.add(item.name)
        }
    })
    cur.forEach((item) => {
        if (!used.has(item.name)) result.push(item)
    })
    return result
}
/**
 * 遍历一组字段（object 的子字段 / array<object> 项的字段）与对应数据，
 * 收集「schema 有、数据无」的字段路径。
 */
const collectFields = (
    schemas: AllFieldSchema[],
    data: any,
    base: FieldPath,
    out: string[]
): string[] => {
    for (const child of schemas) {
        const key = child.key
        if (key === undefined) continue
        const path = [...base, key]
        if (!isObject(data) || !(key in data)) {
            out.push(path.join('.'))
            continue
        }
        collectHiddenPaths(child, (data as any)[key], path, out)
    }
    return out
}

/**
 * 初始化时收集「初始隐藏」的字段路径：schema 里定义了、但数据里不存在的字段。
 * - object：子字段不在数据里 → 记录该路径并停止下钻；存在则继续递归
 * - array<object>：逐项按 schema.schemas（即项的字段列表）递归
 * - array<string>：无属性面板，跳过
 * 路径相对值根节点，以 '.' 连接，与 hiddenPaths / omitByPaths 的格式一致。
 */
const collectHiddenPaths = (
    schema: AllFieldSchema,
    data: any,
    base: FieldPath = [],
    out: string[] = []
): string[] => {
    if (schema.type === 'object') {
        return collectFields(schema.schemas, data, base, out)
    }
    if (schema.type === 'array') {
        if (schema.valueType === 'array<string>' || !Array.isArray(data)) return out
        data.forEach((item, index) => {
            collectFields(schema.schemas, item, [...base, index], out)
        })
    }
    return out
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

function deepEqual(a: any, b: any) {
    if (a === b) return true
    if (a === null || b === null) return false
    if (typeof a !== typeof b) return false
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false
        }
        return true
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a)
        const bKeys = Object.keys(b)
        if (aKeys.length !== bKeys.length) return false
        for (const key of aKeys) {
            if (!deepEqual(a[key], b[key])) return false
        }
        return true
    }
    return false
}

export { 
    deepEqual,
    omitByPaths,
    collectHiddenPaths,
    removeDeepKey,
    setDeepValue, 
    getDeepValue ,
    isNullOrUndefined,
    isObject,
    cloneValue,
    hasSameFieldNames,
    mergeFieldsByPrevOrder,
    moveArrayIndex,
    normalizeArrayFieldSchema,
    normalizeAtomFieldSchema,
    normalizeObjectFieldSchema,
    normalizeSchema,
    createAtomFieldSchema,
    createArrayFieldSchema,
    createObjectFieldSchema,
    createItemBySchema,
}