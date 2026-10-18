<script setup lang="ts">
// ============================================================================
// SchemaForm5
// 数据层使用 DataUI（无任何 Vue 依赖），节点变更只在节点级通知并向上冒泡；
// 渲染层通过节点自身的版本号建立细粒度依赖，不再依赖全局版本。
// ============================================================================
import { shallowRef, watch } from 'vue'
import CollapseCard from '../SchemaForm3/components/CollapseCard.vue'
import FieldNode from './fields/FieldNode.vue'
import { SchemaFormDoc, type FieldUI } from './DataUI'
import type { AllFieldSchema } from './types'

type SchemaFormProps = {
    title?: string
    schema: AllFieldSchema
}
const props = defineProps<SchemaFormProps>()
const emit = defineEmits<{ change: [value: any] }>()

const doc = new SchemaFormDoc()
/** 任一节点变化时把最新值抛给外部 */
doc.onChange = (value) => {
    emit('change', value)
}

/** UI 树根节点 */
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
