import { markRaw, reactive } from 'vue'
import type { AllFieldSchema, ArrayFieldSchema, AtomFieldSchema, ObjectFieldSchema } from './types'
import { cloneValue, createItemBySchema, isNullOrUndefined, isObject, normalizeSchema } from '../SchemaForm3/util'

// ============================================================================
// ReactiveUI：基于 reactive 的 UI 树模型
// 与 DataUI 的区别：节点由 reactive 包装，修改节点即可触发视图刷新；
// DataUI 不依赖 Vue，需由 doc.update() 主动通知视图。
// 两者共同点：不再把「字段列表 / 勾选状态」藏进数据对象，
// 而是由 value + schema 一次性构建出与结构一一对应的 UI 节点树：
// - 每个节点持有自己的 schema / 值 / 显隐 / 增删能力；
// - 所有数据操作都发生在对应节点上（addField / removeItem / setValue ...）；
// - 对外值由根节点 toValue() 汇总，节点本身就是唯一数据源。
// ============================================================================

/** 数据中存在、但 schema 未声明的字段 */
const createExtraFieldSchema = (key: string): AtomFieldSchema => ({
    type: 'atom',
    key,
    label: key,
    component: 't-input',
    props: {
        placeholder: `请输入${key}`,
    },
    defaultValue: '',
    wrapper: 'field',
    builtin: false,
    isRoot: false,
})

export abstract class FieldUI {
    static nextUid = 0
    /** 节点唯一标识，列表渲染的 key / 排序定位用 */
    readonly uid: number
    readonly doc: SchemaFormDoc
    schema: AllFieldSchema
    parent: FieldUI | null = null
    /** 是否参与渲染与输出（对应「编辑属性」里的勾选） */
    visible = true
    /** 是否为数据中多出来的字段（可删除） */
    canRemove = false

    constructor(doc: SchemaFormDoc, schema: AllFieldSchema) {
        this.uid = FieldUI.nextUid++
        this.doc = markRaw(doc)
        this.schema = markRaw(schema)
    }

    get key(): string | undefined {
        return this.schema.key
    }

    get label(): string | undefined {
        const { label, formatLabel } = this.schema
        return formatLabel ? formatLabel(label as string, this.schema) : label
    }

    /** 由数据装载自身状态（子节点在这里递归构建） */
    abstract init(value: any, parent: FieldUI | null): void
    /** 汇总为对外纯值 */
    abstract toValue(): any

    setVisible(visible: boolean) {
        if (this.visible === visible) return
        this.visible = visible
        this.notify()
    }

    notify() {
        this.doc.notify()
    }
}

export class AtomFieldUI extends FieldUI {
    declare schema: AtomFieldSchema
    value: any = ''

    init(value: any, parent: FieldUI | null) {
        this.parent = parent
        this.value = isNullOrUndefined(value) ? cloneValue(this.schema.defaultValue) : value
    }

    get label(): string | undefined {
        const { label, formatLabel } = this.schema
        return formatLabel ? formatLabel(this.value, this.schema) : label
    }

    setValue(value: any) {
        this.value = value
        this.notify()
    }

    toValue() {
        return this.value
    }
}

export class ObjectFieldUI extends FieldUI {
    declare schema: ObjectFieldSchema
    children: FieldUI[] = []

    init(value: any, parent: FieldUI | null) {
        this.parent = parent
        const data = isObject(value) ? value : {}
        // schema 声明的字段全部建节点：数据里存在的默认显示，不存在的先隐藏
        for (const schema of this.schema.schemas) {
            if (schema.key === undefined) continue
            const child = createField(this.doc, schema, this, data[schema.key])
            child.visible = schema.key in data
            this.children.push(child)
        }
        // 数据里有、schema 没有的字段：追加为可删除节点
        for (const key of Object.keys(data)) {
            if (this.children.some((child) => child.key === key)) continue
            const child = createField(this.doc, createExtraFieldSchema(key), this, data[key])
            child.canRemove = true
            this.children.push(child)
        }
    }

    get visibleChildren() {
        return this.children.filter((child) => child.visible)
    }

    /** 添加字段：已存在的节点直接勾选，不存在的追加为可删除节点 */
    addField(name: string) {
        const key = name.trim()
        if (!key) return
        const exists = this.children.find((child) => child.key === key)
        if (exists) {
            exists.setVisible(true)
            return
        }
        const schema = this.schema.schemas.find((item) => item.key === key)
        const child = createField(this.doc, schema ?? createExtraFieldSchema(key), this)
        child.canRemove = !schema
        this.children.push(child)
        this.notify()
    }

    /** 删除字段：只允许删除数据中多出来的字段 */
    removeField(name: string) {
        const index = this.children.findIndex((child) => child.key === name && child.canRemove)
        if (index === -1) return
        this.children.splice(index, 1)
        this.notify()
    }

    toValue() {
        return this.children.reduce((result, child) => {
            if (child.visible && child.key !== undefined) {
                result[child.key] = child.toValue()
            }
            return result
        }, {} as Record<string, any>)
    }
}

export class ArrayFieldUI extends FieldUI {
    declare schema: ArrayFieldSchema
    children: FieldUI[] = []

    get isObjectItem() {
        return this.schema.valueType !== 'array<string>'
    }

    init(value: any, parent: FieldUI | null) {
        this.parent = parent
        const list = Array.isArray(value) ? value : []
        list.forEach((item) => this.children.push(this.createItem(item)))
    }

    /** 数组项也是 UI 节点：对象项用 item schema 继续向下构建 */
    private createItem(value: any) {
        if (this.isObjectItem) {
            const itemSchema: ObjectFieldSchema = markRaw({
                type: 'object',
                schemas: this.schema.schemas,
                allowAddedField: this.schema.allowAddedField,
                defaultValue: {},
                isRoot: false,
            })
            return createField(this.doc, itemSchema, this, value)
        }
        return createField(this.doc, this.schema.schemas[0] as AtomFieldSchema, this, value)
    }

    /** 添加数组项，返回新项下标 */
    addItem() {
        this.children.push(this.createItem(createItemBySchema(this.schema)))
        this.notify()
        return this.children.length - 1
    }

    removeItem(index: number) {
        if (!this.children[index]) return
        this.children.splice(index, 1)
        this.notify()
    }

    moveItem(currentIndex: number, targetIndex: number) {
        if (currentIndex === targetIndex || !this.children[currentIndex]) return
        const [item] = this.children.splice(currentIndex, 1)
        this.children.splice(targetIndex, 0, item)
        this.notify()
    }

    itemLabel(index: number) {
        const item = this.children[index]
        if (!this.schema.formatItemLabel || !item) return `选项${index + 1}`
        return this.schema.formatItemLabel(item.toValue(), index, this.schema)
    }

    toValue() {
        return this.children.map((child) => child.toValue())
    }
}

/**
 * 表单文档：持有根节点与 change 回调。
 * 节点操作只改自身，最终由 doc 汇总一次对外值。
 */
export class SchemaFormDoc {
    root: FieldUI | null = null
    onChange?: (value: any) => void

    load(value: any, schema: AllFieldSchema) {
        // 与外部数据解耦：节点树持有自己的值，后续编辑不会反向修改传入对象
        this.root = createField(this, normalizeSchema(schema), null, cloneValue(value))
        return this.root
    }

    getValue() {
        return this.root?.toValue()
    }

    notify() {
        this.onChange?.(this.getValue())
    }
}

/**
 * 创建节点并挂上响应式：先构造裸实例，再用 reactive 包装，
 * 这样 init 内部拿到的 this 就是响应式代理，子节点 / 列表变更可直接触发渲染。
 */
const createField = (doc: SchemaFormDoc, schema: AllFieldSchema, parent: FieldUI | null, value?: any): FieldUI => {
    const raw =
        schema.type === 'array'
            ? new ArrayFieldUI(doc, schema)
            : schema.type === 'object'
              ? new ObjectFieldUI(doc, schema)
              : new AtomFieldUI(doc, schema)
    const node = reactive(raw) as FieldUI
    node.init(value, parent)
    return node
}
