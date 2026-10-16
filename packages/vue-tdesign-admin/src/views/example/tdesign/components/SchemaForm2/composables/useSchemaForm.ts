import { shallowRef } from 'vue'
import {
    getDeepValue,
    setDeepValue,
    omitByPaths,
    removeDeepKey,
    moveArrayIndex,
} from '../util'
import type { FieldPath } from '../types'

export type UseSchemaForm = {
    value: any
    onChange?: (value: any) => void
}
export const USE_SCHEMA_CONTEXT_KEY = 'USE_Schema_CONTEXT_KEY'
const ROOT_KEY = 'root'

/** 把字段路径转成便于比较的字符串键，如 [0,'title'] -> '0.title' */
const toPathKey = (path: FieldPath) => path.join('.')

export const useSchemaForm = (props: UseSchemaForm) => {

    /** 表单内部持有的原始数据，始终保持原样（取消勾选只记录排除路径，不改动这里，键顺序不会变） */
    const localValue = shallowRef({
        [ROOT_KEY]: JSON.parse(JSON.stringify(props.value))
    })
    /** 需要从对外值中排除的路径（相对值根节点，格式与 omitByPaths 一致：'0.title'、'user.name'） */
    const hiddenPaths = shallowRef<string[]>([])
    /** 对外提交的值：原始数据按 hiddenPaths 排除隐藏属性后的结果 */
    const emittedValue = shallowRef<any>(localValue.value[ROOT_KEY])

    const getValue = (path: FieldPath, defaultValue?: any) => {
        return getDeepValue(localValue.value, [ROOT_KEY, ...path], defaultValue)
    }
    const emitUpdate = (silent: boolean = false) => {
        const root = localValue.value[ROOT_KEY]
        // 仅在存在隐藏路径时按路径排除，数据本体不做任何删改
        const visible = hiddenPaths.value.length
            ? omitByPaths(root, hiddenPaths.value)
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

    const addHiddenPaths = (path: string[]) => {
        const newPaths = Array.from(new Set([...hiddenPaths.value, ...path]))
        hiddenPaths.value = newPaths
    }
    const removeHiddenPaths = (path: string[]) => {
        const drop = new Set(path)
        hiddenPaths.value = hiddenPaths.value.filter((p) => !drop.has(p))
    }
    /** 清理某路径及其子路径的隐藏记录 */
    const clearHidden = (path: FieldPath) => {
        const prefix = toPathKey(path)
        const isUnder = (key: string) => key === prefix || key.startsWith(`${prefix}.`)
        hiddenPaths.value = hiddenPaths.value.filter((key) => !isUnder(key))
    }

    /** 取消勾选：只把该路径加入排除列表，localValue 里的数据保持不变 */
    const hidePath = (path: FieldPath) => {
        addHiddenPaths([toPathKey(path)])
        emitUpdate()
    }
    /** 重新勾选：从排除列表移除即可，数据始终是原来那份，属性顺序不会变 */
    const restorePath = (path: FieldPath) => {
        clearHidden(path)
        emitUpdate()
    }
    /** 删除字段：这才是真正从数据中移除该属性 */
    const removePath = (path: FieldPath) => {
        clearHidden(path)
        removeDeepKey(localValue.value, [ROOT_KEY, ...path])
        emitUpdate()
    }

    /**
     * 数组项下标发生变化（删除 / 拖拽排序）时，按映射函数迁移排除路径，
     * 否则排除列表会错误地作用到别的项上。mapper 返回 null 表示该记录应丢弃。
     */
    const remapHiddenIndex = (parentPath: FieldPath, mapper: (index: number) => number | null) => {
        const parentKey = toPathKey(parentPath)
        const prefix = parentKey ? `${parentKey}.` : ''
        hiddenPaths.value = hiddenPaths.value
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
        removePath,
        removeArrayItem,
        reorderArrayItem,
        hidePath,
        restorePath,
        hiddenPaths,
        addHiddenPaths,
        removeHiddenPaths,
        value: emittedValue,
        getValue,
        setValue
    }
    return instance
}
export type UseSchemaFormInstance = ReturnType<typeof useSchemaForm>
