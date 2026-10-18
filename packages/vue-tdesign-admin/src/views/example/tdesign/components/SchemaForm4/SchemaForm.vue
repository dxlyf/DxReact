<script setup lang="ts">
// ============================================================================
// SchemaForm4
// 与 SchemaForm3 的差异：
// - 3：编辑状态（字段列表 / 勾选）藏在数据对象的 Symbol 上，组件靠 path 读写数据；
// - 4：init(value, schema) 直接构建 UI 节点树，页面迭代节点渲染，
//      数据操作全部收敛到对应节点的方法上，对外值由根节点 toValue() 汇总。
// ============================================================================
import { shallowRef, watch } from 'vue'
import CollapseCard from '../SchemaForm3/components/CollapseCard.vue'
import FieldNode from './fields/FieldNode.vue'
import { SchemaFormDoc, type FieldUI } from './ReactiveUI'
import type { AllFieldSchema } from './types'

type SchemaFormProps = {
    title?: string
    schema: AllFieldSchema
}
const props = defineProps<SchemaFormProps>()
const emit = defineEmits<{ change: [value: any] }>()

const doc = new SchemaFormDoc()
doc.onChange = (value) => emit('change', value)

/** UI 树根节点：节点树即数据源，渲染只依赖它 */
const root = shallowRef<FieldUI | null>(null)

/** 唯一数据入口：按 value + schema 构建整棵 UI 树 */
const init = (value: any) => {
    root.value = doc.load(value, props.schema)
    emit('change', doc.getValue())
}

/** 读取当前对外值（节点树汇总，已排除未勾选字段） */
const getValue = () => doc.getValue()

/** schema 变更时按当前值重建 UI 树 */
watch(
    () => props.schema,
    () => {
        if (root.value) init(doc.getValue())
    }
)

defineExpose({ init, getValue })
</script>
<template>
    <CollapseCard v-if="title" :title="title">
        <FieldNode v-if="root" :key="root.uid" :field="root" />
    </CollapseCard>
    <FieldNode v-else-if="root" :key="root.uid" :field="root" />
</template>
