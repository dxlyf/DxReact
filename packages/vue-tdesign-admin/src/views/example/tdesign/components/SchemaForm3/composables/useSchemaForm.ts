import { ref, shallowRef } from 'vue'
import {
    getDeepValue,
    setDeepValue,
    setFieldChecked,
    addNodeField,
    removeNodeField,
    getNodeState,
    getNodeFields,
    buildFieldList,
    initRootFields,
    toPlainValue,
    cloneValue,
    isNullOrUndefined,
    isObject,
} from '../util'
import type { VisibleField } from '../util'
import type { AllFieldSchema, FieldPath } from '../types'

export type UseSchemaForm = {
    onChange?: (value: any) => void
}
export const USE_SCHEMA_CONTEXT_KEY = 'USE_Schema_CONTEXT_KEY'
const ROOT_KEY = 'root'

/**
 * SchemaForm3 的数据核心。
 * 与 SchemaForm2 不同：不再维护 hiddenPaths / initHiddenPaths / 路径下标迁移，
 * 字段勾选状态直接记在数据对象自身的不可访问字段（Symbol + 不可枚举）上，
 * 因此输出只需按节点状态递归裁剪，数组增删排序也无需迁移任何状态。
 */
export const useSchemaForm = (props: UseSchemaForm = {}) => {
    /** 表单内部持有的原始数据（始终保留完整字段，取消勾选只改节点隐藏集合） */
    const localValue = shallowRef<any>({ [ROOT_KEY]: {} })
    /** 对外提交的值：按节点隐藏集合裁剪后的结果 */
    const emittedValue = shallowRef<any>({})
    /** 初始化版本号：每次 init 自增，字段组件据此清空页面状态（如当前选中项） */
    const initVersion = ref(0)

    /**
     * 唯一的数据入口：切换 / 初始化数据必须走这里。
     * 传入 schema 后会立即递归构造 data 中已有值节点的字段状态（已有值即勾选），
     * 缺值的字段先不构造，等添加字段 / 显示字段时再按需构造。
     */
    const init = (data: any, schema?: AllFieldSchema) => {
        const root = cloneValue(data)
        const rootValue = isNullOrUndefined(root) ? {} : root
        initRootFields(rootValue, schema)
        localValue.value = { [ROOT_KEY]: rootValue }
        initVersion.value++
        emitUpdate()
    }

    const getValue = (path: FieldPath, defaultValue?: any) => {
        return getDeepValue(localValue.value, [ROOT_KEY, ...path], defaultValue)
    }

    const emitUpdate = (silent: boolean = false) => {
        const root = localValue.value[ROOT_KEY]
        const newData = toPlainValue(root)
        emittedValue.value = Array.isArray(newData) ? [...newData] : { ...newData }
        // 替换外层包装对象触发一次浅层刷新，root 引用与键顺序保持不变
        localValue.value = { [ROOT_KEY]: root }
        if (!silent) {
            props.onChange?.(newData)
        }
    }

    const setValue = (path: FieldPath, value: any, silent: boolean = false) => {
        setDeepValue(localValue.value, [ROOT_KEY, ...path], value)
        emitUpdate(silent)
    }

    /** 取节点对象，缺失时建空对象挂回父级 */
    const ensureNode = (path: FieldPath) => {
        let node = getValue(path)
        if (!isObject(node)) {
            node = {}
            setDeepValue(localValue.value, [ROOT_KEY, ...path], node)
        }
        return node
    }

    /**
     * 读取某节点已构造的字段列表（副本，供组件展示勾选状态与渲染）。
     * 此处只读不构造：状态已在 init / 添加字段 / 重新勾选时按需构造好。
     * 非对象节点（如 array<string> 的项）没有节点状态，退回按 schema 生成。
     */
    const getFields = (path: FieldPath, schemas: AllFieldSchema[]): VisibleField[] => {
        const node = getValue(path)
        const fields = getNodeState(node)?.fields
        if (fields) {
            return fields.map((item) => ({ ...item }))
        }
        return buildFieldList(node, schemas)
    }

    /**
     * 按需构造节点字段状态：节点不存在时先按 schema 默认值物化并写回，再递归构造。
     * 用于「添加字段」「重新勾选字段」时，确保其子节点在渲染前已有状态可读。
     */
    const initFields = (path: FieldPath, schema: AllFieldSchema) => {
        if (schema.type === 'atom') return
        let node = getValue(path)
        if (!isObject(node)) {
            const fallback = cloneValue(schema.defaultValue)
            node = isObject(fallback) ? fallback : schema.type === 'array' ? [] : {}
            setDeepValue(localValue.value, [ROOT_KEY, ...path], node)
        }
        initRootFields(node, schema)
    }

    /** 勾选 / 取消勾选字段：只改节点上的字段列表，数据不增删 */
    const setFieldVisible = (path: FieldPath, key: string, visible: boolean, schemas?: AllFieldSchema[]) => {
        const node = ensureNode(path)
        // 节点状态未构造时（如刚被 ensureNode 建出）先按 schema 构造，否则勾选会被丢弃
        if (schemas) getNodeFields(node, schemas)
        setFieldChecked(node, key, visible)
        // 重新勾选时按需构造该字段自身的子节点状态，否则其渲染时读不到状态
        if (visible && schemas) {
            const fieldSchema = schemas.find((item) => item.key === key)
            if (fieldSchema) initFields([...path, key], fieldSchema)
        }
        emitUpdate()
    }
    /** 新增字段：写入节点数据并置为勾选 */
    const addField = (path: FieldPath, key: string, defaultValue: any = '', schemas?: AllFieldSchema[]) => {
        const node = ensureNode(path)
        if (schemas) getNodeFields(node, schemas)
        addNodeField(node, key, defaultValue)
        emitUpdate()
    }
    /** 删除字段：从节点数据与字段列表中一并移除 */
    const removeField = (path: FieldPath, key: string) => {
        removeNodeField(getValue(path), key)
        emitUpdate()
    }

    return {
        init,
        initVersion,
        value: emittedValue,
        getValue,
        setValue,
        getFields,
        initFields,
        setFieldVisible,
        addField,
        removeField,
    }
}
export type UseSchemaFormInstance = ReturnType<typeof useSchemaForm>
