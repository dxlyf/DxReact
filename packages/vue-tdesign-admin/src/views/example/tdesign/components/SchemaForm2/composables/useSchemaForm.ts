import { ref, shallowRef } from 'vue'
import {
    getDeepValue,
    setDeepValue,
    omitByPaths,
    removeDeepKey,
    moveArrayIndex,
    cloneValue,
    isNullOrUndefined,
    collectHiddenPaths,
} from '../util'
import type { AllFieldSchema, FieldPath } from '../types'

export type UseSchemaForm = {
    onChange?: (value: any) => void
}
export const USE_SCHEMA_CONTEXT_KEY = 'USE_Schema_CONTEXT_KEY'
const ROOT_KEY = 'root'

/** 把字段路径转成便于比较的字符串键，如 [0,'title'] -> '0.title' */
const toPathKey = (path: FieldPath) => path.join('.')

export const useSchemaForm = (props: UseSchemaForm = {}) => {

    /** 表单内部持有的原始数据，始终保持原样（取消勾选只记录排除路径，不改动这里，键顺序不会变） */
    const localValue = shallowRef({
        [ROOT_KEY]: {}
    })
    /** 用户手动隐藏的字段路径（相对值根节点，格式与 omitByPaths 一致：'0.title'、'user.name'） */
    const hiddenPaths = shallowRef<string[]>([])
    /**
     * 初始隐藏的字段路径：init 时按 schema 收集到的「schema 有、数据无」的字段。
     * 与 hiddenPaths 分离——它只描述初始状态，用户手动勾选 / 取消勾选后会清除对应记录。
     */
    const initHiddenPaths = shallowRef<string[]>([])
    /** 对外提交的值：原始数据按 hiddenPaths 排除用户手动隐藏的属性后的结果 */
    const emittedValue = shallowRef<any>({})

    /**
     * 初始化版本号：每次 init 自增。字段组件监听它来清空自身页面状态
     * （字段勾选缓存、当前选中项等），相当于重新初始化。
     */
    const initVersion = ref(0)

    /**
     * 唯一的数据入口：切换 / 初始化数据必须走这里。
     * - 重置内部数据与对外值
     * - 按 schema 构建初始隐藏集合（schema 有、数据无的字段），写入 initHiddenPaths
     * - hiddenPaths（用户手动隐藏）清空
     * - 自增 initVersion，通知各字段组件清空页面状态
     */
    const init = (data: any, schema?: AllFieldSchema) => {
        const root = cloneValue(data)
        localValue.value = { [ROOT_KEY]: isNullOrUndefined(root) ? {} : root }
        hiddenPaths.value = []
        initHiddenPaths.value = schema ? collectHiddenPaths(schema, localValue.value[ROOT_KEY]) : []
        initVersion.value++
        emitUpdate()
    }

    const getValue = (path: FieldPath, defaultValue?: any) => {
        return getDeepValue(localValue.value, [ROOT_KEY, ...path], defaultValue)
    }
    const emitUpdate = (silent: boolean = false) => {
        const root = localValue.value[ROOT_KEY]
        // 只需排除用户手动隐藏的字段；初始隐藏的字段本就不在数据里，无需排除
        const excludePaths = hiddenPaths.value
        const visible = excludePaths.length
            ? omitByPaths(root, excludePaths)
            : root
        const newData = Array.isArray(visible) ? [...visible] : { ...visible }
        emittedValue.value = newData
        // 只替换外层包装对象来触发一次浅层刷新，root 引用与键顺序保持不变
        localValue.value = { [ROOT_KEY]: root }
        if (!silent) {
            props.onChange?.(newData)
        }
    }
    const setValue = (path: FieldPath, value: any, silent: boolean = false) => {
        setDeepValue(localValue.value, [ROOT_KEY, ...path], value)
        emitUpdate(silent)
    }

    /** 某路径当前是否被用户手动隐藏 */
    const isHidden = (path: FieldPath) => hiddenPaths.value.includes(toPathKey(path))
    /** 某路径当前是否处于初始隐藏状态 */
    const isInitHidden = (path: FieldPath) => initHiddenPaths.value.includes(toPathKey(path))

    const addHiddenPaths = (path: string[]) => {
        const newPaths = Array.from(new Set([...hiddenPaths.value, ...path]))
        hiddenPaths.value = newPaths
    }
    const removeHiddenPaths = (path: string[]) => {
        const drop = new Set(path)
        hiddenPaths.value = hiddenPaths.value.filter((p) => !drop.has(p))
    }
    /** 从一组路径中清理某路径及其子路径 */
    const dropPathAndChildren = (paths: string[], path: FieldPath) => {
        const prefix = toPathKey(path)
        const isUnder = (key: string) => key === prefix || key.startsWith(`${prefix}.`)
        return paths.filter((key) => !isUnder(key))
    }
    /** 清理某路径及其子路径的用户隐藏记录 */
    const clearHidden = (path: FieldPath) => {
        hiddenPaths.value = dropPathAndChildren(hiddenPaths.value, path)
    }
    /** 清理某路径及其子路径的初始隐藏记录（用户手动操作后以手动状态为准） */
    const clearInitHidden = (path: FieldPath) => {
        initHiddenPaths.value = dropPathAndChildren(initHiddenPaths.value, path)
    }

    /** 取消勾选：清除该字段的初始隐藏状态，并把该路径加入手动隐藏列表；localValue 不变 */
    const hidePath = (path: FieldPath) => {
        clearInitHidden(path)
        addHiddenPaths([toPathKey(path)])
        emitUpdate()
    }
    /** 重新勾选：清除该字段的初始隐藏与手动隐藏记录；数据始终是原来那份，属性顺序不会变 */
    const restorePath = (path: FieldPath) => {
        clearInitHidden(path)
        clearHidden(path)
        emitUpdate()
    }
    /** 删除字段：这才是真正从数据中移除该属性 */
    const removePath = (path: FieldPath) => {
        clearInitHidden(path)
        clearHidden(path)
        removeDeepKey(localValue.value, [ROOT_KEY, ...path])
        emitUpdate()
    }

    /**
     * 数组项下标发生变化（删除 / 拖拽排序）时，按映射函数迁移排除路径，
     * 否则排除列表会错误地作用到别的项上。mapper 返回 null 表示该记录应丢弃。
     */
    const remapIndexKeys = (keys: string[], parentPath: FieldPath, mapper: (index: number) => number | null) => {
        const parentKey = toPathKey(parentPath)
        const prefix = parentKey ? `${parentKey}.` : ''
        return keys
            .map((key) => {
                const rest = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key
                const segments = rest.split('.')
                const head = Number(segments[0])
                if (segments[0] === '' || Number.isNaN(head)) return key
                const next = mapper(head)
                if (next === null) return null
                segments[0] = String(next)
                return prefix ? prefix + segments.join('.') : segments.join('.')
            })
            .filter((key): key is string => key !== null)
    }
    const remapHiddenIndex = (parentPath: FieldPath, mapper: (index: number) => number | null) => {
        hiddenPaths.value = remapIndexKeys(hiddenPaths.value, parentPath, mapper)
        initHiddenPaths.value = remapIndexKeys(initHiddenPaths.value, parentPath, mapper)
    }

    /** 删除数组中的某一项：值、排除路径同步前移 */
    const removeArrayItem = (parentPath: FieldPath, index: number) => {
        remapHiddenIndex(parentPath, (i) => (i === index ? null : i > index ? i - 1 : i))
        const list = getValue(parentPath)
        if (Array.isArray(list)) {
            setValue(parentPath, list.filter((_item: any, i: number) => i !== index))
        }
    }

    /** 拖拽排序：把数组项从 from 移到 to，值、排除路径同步迁移 */
    const reorderArrayItem = (parentPath: FieldPath, from: number, to: number) => {
        if (from === to) return
        remapHiddenIndex(parentPath, (i) => moveArrayIndex(i, from, to))
        const list = getValue(parentPath)
        if (!Array.isArray(list)) return
        const next = [...list]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setValue(parentPath, next)
    }

    const instance = {
        init,
        initVersion,
        isHidden,
        isInitHidden,
        removePath,
        removeArrayItem,
        reorderArrayItem,
        hidePath,
        restorePath,
        hiddenPaths,
        initHiddenPaths,
        addHiddenPaths,
        removeHiddenPaths,
        clearInitHidden,
        value: emittedValue,
        getValue,
        setValue
    }
    return instance
}
export type UseSchemaFormInstance = ReturnType<typeof useSchemaForm>
