/**
 * 结构去重缓存工具
 * WebGPU 的 bindGroupLayout / pipelineLayout / bindGroup / pipeline 创建开销大，
 * 但描述符里往往混有原生句柄（GPUBuffer / GPUTexture / GPUPipelineLayout 等）无法直接序列化。
 * 这里提供两级 key 生成：
 * - structKey：把纯数据（数字 / 字符串 / 数组 / 普通对象 / Map / Set）稳定序列化
 * - objectId：为句柄类对象分配一个进程内唯一且稳定的身份 id，参与序列化
 * 二者组合即可在「同结构同句柄」时命中去重，在「结构或句柄不同」时区分。
 */

/** 身份 id 分配表：WeakMap 保证不影响对象回收 */
const identityIds = new WeakMap<object, number>()
let identityCounter = 0

/** 为对象分配/读取稳定身份 id（同一对象多次调用返回同一值） */
export function objectId(value: object): number {
    let id = identityIds.get(value)
    if (id === undefined) {
        id = ++identityCounter
        identityIds.set(value, id)
    }
    return id
}

/** 生成结构化稳定 key */
export function structKey(value: unknown): string {
    return serialize(value, new Set())
}

function serialize(value: unknown, seen: Set<object>): string {
    if (value === null) {
        return 'null'
    }
    const type = typeof value
    switch (type) {
        case 'number':
        case 'boolean':
        case 'bigint':
        case 'undefined':
            return String(value)
        case 'string':
            return JSON.stringify(value)
        case 'symbol':
            return 'sym:' + String((value as symbol).description)
        case 'function':
            // 函数一般以身份参与，避免把函数体纳入 key
            return '@' + objectId(value as object)
    }
    const obj = value as object
    if (seen.has(obj)) {
        // 出现循环引用时退化为身份 id，防止无限递归
        return '@' + objectId(obj)
    }
    if (Array.isArray(obj)) {
        seen.add(obj)
        const parts: string[] = []
        for (let i = 0; i < obj.length; i++) {
            parts.push(serialize(obj[i], seen))
        }
        seen.delete(obj)
        return '[' + parts.join(',') + ']'
    }
    if (ArrayBuffer.isView(obj)) {
        // 类型化数组 / DataView：按内容序列化，便于按值去重
        seen.add(obj)
        const view = obj as unknown as ArrayBufferView
        const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
        const parts: string[] = []
        for (let i = 0; i < bytes.length; i++) {
            parts.push(bytes[i].toString(16))
        }
        seen.delete(obj)
        return 'b:' + parts.join('')
    }
    if (obj instanceof Map) {
        seen.add(obj)
        const parts: string[] = []
        obj.forEach((v, k) => {
            parts.push(serialize(k, seen) + '=>' + serialize(v, seen))
        })
        seen.delete(obj)
        return 'm{' + parts.join(',') + '}'
    }
    if (obj instanceof Set) {
        seen.add(obj)
        const parts: string[] = []
        obj.forEach((v) => {
            parts.push(serialize(v, seen))
        })
        seen.delete(obj)
        return 's{' + parts.join(',') + '}'
    }
    // 普通对象：逐字段序列化；键排序保证字段顺序无关
    if (isPlainObject(obj)) {
        seen.add(obj)
        const record = obj as Record<string, unknown>
        const keys = Object.keys(record).sort()
        const parts: string[] = []
        for (const key of keys) {
            parts.push(key + ':' + serialize(record[key], seen))
        }
        seen.delete(obj)
        return '{' + parts.join(',') + '}'
    }
    // 其余对象（GPUBuffer / GPUTexture / GPUPipelineLayout……）按身份去重
    return '@' + objectId(obj)
}

function isPlainObject(value: object): boolean {
    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
}
