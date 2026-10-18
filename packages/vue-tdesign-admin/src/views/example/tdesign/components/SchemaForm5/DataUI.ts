import type { AllFieldSchema, ArrayFieldSchema, AtomFieldSchema, ObjectFieldSchema } from './types'
import { cloneValue, createItemBySchema, isNullOrUndefined, isObject, normalizeSchema } from '../SchemaForm3/util'

// ============================================================================
// DataUI：SchemaForm5 使用的 UI 树模型，无任何 Vue 依赖
// 与 SchemaForm4（ReactiveUI）的区别：
// - 节点是普通对象，不使用 reactive / markRaw；
// - 节点级版本：version 表示自身输出变化，subtreeVersion 表示自身或后代变化；
// - 变更只通知自身订阅者并向上冒泡到祖先，不做全树刷新；
// - 视图侧（context.ts）把节点通知映射为响应式计数器，建立细粒度依赖。
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

export type NodeListener = (node: FieldUI) => void

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
    /** 自身输出（值、可见性、子节点列表）的版本 */
    version = 0
    /** 自身或任意后代的版本，供 label / 汇总值等依赖子树的场景使用 */
    subtreeVersion = 0
    private listeners = new Set<NodeListener>()

    constructor(doc: SchemaFormDoc, schema: AllFieldSchema) {
        this.uid = FieldUI.nextUid++
        this.doc = doc
        this.schema = schema
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

    /** 订阅本节点（含后代冒泡）的变更，返回取消订阅函数 */
    subscribe(listener: NodeListener) {
        this.listeners.add(listener)
        return () => {
            this.listeners.delete(listener)
        }
    }

    setVisible(visible: boolean) {
        if (this.visible === visible) return
        this.visible = visible
        this.touch(true)
    }

    protected emit() {
        this.listeners.forEach((listener) => listener(this))
    }

    /**
     * 自身数据变更：递增自身版本并通知订阅者，再把变更冒泡到祖先。
     * @param structure 结构变化（勾选 / 增删 / 排序）会改变直接父节点的子节点列表，
     *                  因此父节点自身版本也要递增；纯值变化只影响祖先的子树版本。
     */
    protected touch(structure = false) {
        this.version++
        this.subtreeVersion++
        this.emit()
        this.doc.notifyChange()
        this.bubble(structure)
    }

    /** 只更新祖先的子树版本，不触发祖先自身的重算 */
    private bubble(structure: boolean) {
        let parent = this.parent
        if (!parent) return
        if (structure) parent.version++
        while (parent) {
            parent.subtreeVersion++
            parent.emit()
            parent = parent.parent
        }
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
        this.touch()
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
        this.touch(true)
    }

    /** 删除字段：只允许删除数据中多出来的字段 */
    removeField(name: string) {
        const index = this.children.findIndex((child) => child.key === name && child.canRemove)
        if (index === -1) return
        this.children.splice(index, 1)
        this.touch(true)
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
            const itemSchema: ObjectFieldSchema = {
                type: 'object',
                schemas: this.schema.schemas,
                allowAddedField: this.schema.allowAddedField,
                defaultValue: {},
                isRoot: false,
            }
            return createField(this.doc, itemSchema, this, value)
        }
        return createField(this.doc, this.schema.schemas[0] as AtomFieldSchema, this, value)
    }

    /** 添加数组项，返回新项下标 */
    addItem() {
        this.children.push(this.createItem(createItemBySchema(this.schema)))
        this.touch(true)
        return this.children.length - 1
    }

    removeItem(index: number) {
        if (!this.children[index]) return
        this.children.splice(index, 1)
        this.touch(true)
    }

    moveItem(currentIndex: number, targetIndex: number) {
        if (currentIndex === targetIndex || !this.children[currentIndex]) return
        const [item] = this.children.splice(currentIndex, 1)
        this.children.splice(targetIndex, 0, item)
        this.touch(true)
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
 * 数据文档：持有根节点，并把节点变更汇总出的最新值回调给视图层。
 * 节点只在自身变更时通知订阅者并向上冒泡，不再做全树刷新。
 */
export class SchemaFormDoc {
    root: FieldUI | null = null
    /** 任一节点数据变化时回调最新值 */
    onChange?: (value: any) => void

    load(value: any, schema: AllFieldSchema) {
        // 与外部数据解耦：节点树持有自己的值，后续编辑不会反向修改传入对象
        this.root = createField(this, normalizeSchema(schema), null, cloneValue(value))
        return this.root
    }

    getValue() {
        return this.root?.toValue()
    }

    /** 由节点调用：把最新值回调给视图层 */
    notifyChange() {
        this.onChange?.(this.getValue())
    }
}

/** 创建节点：无响应式包装，直接初始化 */
const createField = (doc: SchemaFormDoc, schema: AllFieldSchema, parent: FieldUI | null, value?: any): FieldUI => {
    const node =
        schema.type === 'array'
            ? new ArrayFieldUI(doc, schema)
            : schema.type === 'object'
              ? new ObjectFieldUI(doc, schema)
              : new AtomFieldUI(doc, schema)
    node.init(value, parent)
    return node
}
