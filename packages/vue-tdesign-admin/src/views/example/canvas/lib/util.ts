
export const isArray = (value: any): boolean => {
    return Array.isArray(value)
}
export const isObject = (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Object]'
}
export const isPlainObject = (value: any): boolean => {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export const isPrimitive = (value: any): boolean => {
    return typeof value !== 'object' && value !== null && typeof value !== 'function'
}
/**
 * 深度合并多个对象（类似 Object.assign 的深度版本）。
 *
 * - 对象类型递归合并，数组直接覆盖（非 concat）
 * - 后面的 source 优先级更高
 * - 不会修改原对象，返回新对象
 */
export function deepMerge(target: any, ...sources:any[]) {

    for (const source of sources) {
        if (!source || typeof source !== 'object') continue
        for (const key of Object.keys(source) as (keyof T)[]) {
            const val = source[key]
            const existing = target[key]

            if (isPlainObject(val)) {
                target[key] = deepMerge(isPlainObject(existing) ? existing : {}, val)
            } else if (Array.isArray(val)) {
                // 无论 existing 是否存在，都创建新数组
                target[key] = deepMerge(isArray(existing) ? existing : [], val)
            } else {
                target[key] = val
            }
        }
    }

    return target
}
