import type { AllFieldSchema, FieldPath, ObjectFieldSchema, AtomFieldSchema, ArrayFieldSchema } from './types'

// ============================================================================
// 节点状态
// 字段列表（顺序 + 勾选）与字段值一起挂在数据对象自身的「不可访问字段」上：
// - 键为 Symbol，非字符串，业务代码 / JSON 序列化天然看不到；
// - 不可枚举，Object.keys / 展开运算符 / JSON.stringify 都会忽略它。
// 这样字段列表随对象一起移动 / 删除，数组项增删排序时字段顺序与勾选都不会错位，
// 因此不再需要任何路径簿记（hiddenPaths / 下标迁移 / 字段缓存）代码。
// ============================================================================
export const NODE_STATE = Symbol('schemaFormNodeState')
export type NodeState = { fields?: VisibleField[] }

const getNodeState = (node: any): NodeState | undefined => (isObject(node) ? node[NODE_STATE] : undefined)

/** 读取节点状态，不存在时挂载一个空状态（fields 首次访问时惰性构建） */
const ensureNodeState = (node: any): NodeState => {
    let state = getNodeState(node)
    if (!state) {
        state = {}
        Object.defineProperty(node, NODE_STATE, {
            value: state,
            enumerable: false,
            configurable: true,
            writable: false,
        })
    }
    return state
}

export type VisibleField = {
    name: string
    checked: boolean
    canRemove: boolean
    schema: AllFieldSchema
}

const createExtraFieldSchema = (key: string) =>
    createAtomFieldSchema({
        key,
        label: key,
        component: 't-input',
        props: {
            placeholder: `请输入${key}`,
        },
    })

/**
 * 由「节点数据 + schema」构建字段列表：
 * - schema 字段：对象节点中数据存在该键即勾选，否则未勾选；非对象节点（如 array<string> 的项）默认勾选（不可删）
 * - 额外字段：数据中存在但 schema 里没有的键（可删，始终勾选）
 * 仅在首次访问时构建，结果缓存在节点状态上；之后勾选变化只改缓存，不再重建，
 * 因此取消勾选后数据仍完整保留，仅在输出时按勾选裁剪。
 */
const buildFieldList = (node: any, schemas: AllFieldSchema[]): VisibleField[] => {
    const isNode = isObject(node)
    const schemaFields: VisibleField[] = schemas
        .filter((item) => item.key !== undefined)
        .map((item) => ({
            name: item.key as string,
            checked: isNode ? (item.key as string) in node : true,
            canRemove: false,
            schema: item,
        }))
    const extraKeys = isNode
        ? Object.keys(node).filter((key) => !schemas.some((item) => item.key === key))
        : []
    const extraFields: VisibleField[] = extraKeys.map((key) => ({
        name: key,
        checked: true,
        canRemove: true,
        schema: createExtraFieldSchema(key),
    }))
    return [...schemaFields, ...extraFields]
}

/** 读取节点字段列表，未构建时按当前数据 + schema 惰性构建并缓存 */
const getNodeFields = (node: any, schemas: AllFieldSchema[]): VisibleField[] => {
    const state = ensureNodeState(node)
    if (!state.fields) {
        state.fields = buildFieldList(node, schemas)
    }
    return state.fields
}

/**
 * 递归构造节点状态：按「schema + 节点数据」构建字段列表。
 * 只对 data 中已有值的 schema key 继续向下构造；
 * 缺值的字段先不构造，等添加字段 / 显示字段（勾选）时再构造。
 */
const initNodeFields = (node: any, schemas: AllFieldSchema[]) => {
    if (!isObject(node)) return
    getNodeFields(node, schemas)
    for (const schema of schemas) {
        const key = schema.key
        if (key === undefined || !(key in node)) continue
        const child = node[key]
        if (schema.type === 'object') {
            initNodeFields(child, schema.schemas)
        } else if (schema.type === 'array' && schema.valueType !== 'array<string>' && Array.isArray(child)) {
            child.forEach((item) => initNodeFields(item, schema.schemas))
        }
    }
}

/** 初始化根节点状态：按根 schema 类型分发（object 取 schemas；array 取各子项） */
const initRootFields = (node: any, schema?: AllFieldSchema) => {
    if (!schema || !isObject(node)) return
    if (schema.type === 'object') {
        initNodeFields(node, schema.schemas)
    } else if (schema.type === 'array' && schema.valueType !== 'array<string>' && Array.isArray(node)) {
        node.forEach((item) => initNodeFields(item, schema.schemas))
    }
}

/** 设置某字段的勾选状态（只改节点状态，不动数据） */
const setFieldChecked = (node: any, key: string, checked: boolean) => {
    const field = getNodeState(node)?.fields?.find((item) => item.name === key)
    if (field) field.checked = checked
}

/** 新增字段：写入数据并标记为勾选 */
const addNodeField = (node: any, key: string, defaultValue: any = '') => {
    if (!isObject(node)) return
    node[key] = defaultValue
    const state = ensureNodeState(node)
    const fields = state.fields ?? (state.fields = buildFieldList(node, []))
    const field = fields.find((item) => item.name === key)
    if (field) {
        field.checked = true
    } else {
        fields.push({
            name: key,
            checked: true,
            canRemove: true,
            schema: createExtraFieldSchema(key),
        })
    }
}

/** 删除字段：从数据与字段列表中一并移除 */
const removeNodeField = (node: any, key: string) => {
    if (!isObject(node)) return
    delete node[key]
    const state = getNodeState(node)
    if (state?.fields) {
        state.fields = state.fields.filter((item) => item.name !== key)
    }
}

/** 对外输出的纯值：递归重建对象，跳过未勾选的字段（替代原有的路径排除逻辑） */
const toPlainValue = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map((item) => toPlainValue(item))
    }
    if (!isObject(value)) {
        return value
    }
    const fields = getNodeState(value)?.fields
    const hidden = fields
        ? new Set(fields.filter((item) => !item.checked).map((item) => item.name))
        : undefined
    const result: Record<string, any> = {}
    for (const key of Object.keys(value)) {
        if (hidden?.has(key)) continue
        result[key] = toPlainValue((value as any)[key])
    }
    return result
}

// ============================================================================
// Schema 归一化 / 创建
// ============================================================================
const normalizeSchema = (Schema: AllFieldSchema): AllFieldSchema => {
    if (Schema.type === 'array') {
        return normalizeArrayFieldSchema(Schema)
    } else if (Schema.type === 'object') {
        return normalizeObjectFieldSchema(Schema)
    } else {
        return normalizeAtomFieldSchema(Schema)
    }
}

const normalizeAtomFieldSchema = (Schema: AtomFieldSchema) => {
    return {
        type: 'atom',
        props: {},
        builtin: true,
        wrapper: 'field',
        isRoot: false,
        defaultValue: '',
        ...Schema,
    } as AtomFieldSchema
}
const normalizeArrayFieldSchema = (Schema: ArrayFieldSchema) => {
    const { schemas, ...restSchema } = Schema
    return {
        valueType: 'array<object>',
        sortable: false,
        allowAdded: true,
        allowAddedField: true,
        isRoot: false,
        defaultValue: [],
        schemas: (schemas as AllFieldSchema[]).map((item) => normalizeSchema(item)),
        ...restSchema,
    } as ArrayFieldSchema
}
const normalizeObjectFieldSchema = (Schema: ObjectFieldSchema) => {
    const { schemas, ...restSchema } = Schema
    return {
        sortable: false,
        allowAddedField: true,
        isRoot: false,
        defaultValue: {},
        schemas: (schemas as AllFieldSchema[]).map((item) => normalizeSchema(item)),
        ...restSchema,
    } as ObjectFieldSchema
}
const createAtomFieldSchema = (options: Partial<AtomFieldSchema>) => {
    return {
        type: 'atom',
        props: {},
        builtin: false,
        wrapper: 'field',
        isRoot: false,
        defaultValue: '',
        ...options,
    } as AtomFieldSchema
}
const createArrayFieldSchema = (options: Partial<ArrayFieldSchema>) => {
    return {
        type: 'array',
        valueType: 'array<object>',
        sortable: false,
        allowAdded: true,
        allowAddedField: true,
        isRoot: false,
        defaultValue: [],
        ...options,
    } as ArrayFieldSchema
}
const createObjectFieldSchema = (options: Partial<ObjectFieldSchema>) => {
    return {
        type: 'object',
        allowAddedField: true,
        isRoot: false,
        defaultValue: {},
        ...options,
    } as ObjectFieldSchema
}
const createItemBySchema = (schema: AllFieldSchema): any => {
    if (schema.type === 'array') {
        if (schema.valueType === 'array<string>') {
            return getDeepValue(schema.schemas, [0, 'defaultValue'], '')
        } else {
            return (schema.schemas as AllFieldSchema[]).reduce((acc, cur) => {
                acc[cur.key as string] = cloneValue(cur.defaultValue)
                return acc
            }, {} as any)
        }
    } else if (schema.type === 'object') {
        return schema.schemas.reduce((acc, cur) => {
            acc[cur.key as string] = cloneValue(cur.defaultValue)
            return acc
        }, {} as Record<string, any>)
    } else {
        return isNullOrUndefined(schema.defaultValue) ? '' : schema.defaultValue
    }
}

// ============================================================================
// 基础工具
// ============================================================================
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
        if (!isObject(currentObj)) {
            return cloneValue(defaultValue)
        }
        currentObj = currentObj[path[i]]
    }
    return isNullOrUndefined(currentObj) ? cloneValue(defaultValue) : currentObj
}
const removeDeepKey = (obj: any, path: (string | number)[]) => {
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
const cloneValue = (value: any) => {
    if (isNullOrUndefined(value)) {
        return value
    }
    return JSON.parse(JSON.stringify(value))
}
/** 数组项从 from 移到 to 后，原下标 index 对应的新下标（用于同步当前选中项） */
const moveArrayIndex = (index: number, from: number, to: number) => {
    if (index === from) return to
    if (from < to && index > from && index <= to) return index - 1
    if (from > to && index >= to && index < from) return index + 1
    return index
}

export {
    getNodeState,
    ensureNodeState,
    buildFieldList,
    getNodeFields,
    initNodeFields,
    initRootFields,
    setFieldChecked,
    addNodeField,
    removeNodeField,
    toPlainValue,
    normalizeArrayFieldSchema,
    normalizeAtomFieldSchema,
    normalizeObjectFieldSchema,
    normalizeSchema,
    createAtomFieldSchema,
    createArrayFieldSchema,
    createObjectFieldSchema,
    createItemBySchema,
    removeDeepKey,
    setDeepValue,
    getDeepValue,
    isNullOrUndefined,
    isObject,
    cloneValue,
    moveArrayIndex,
}
