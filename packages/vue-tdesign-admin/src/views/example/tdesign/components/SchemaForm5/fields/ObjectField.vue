<script setup lang="ts">
// ============================================================================
// ObjectField：对象节点
// 直接迭代节点 children 渲染；字段勾选 / 添加 / 删除都调用节点自身方法。
// 只订阅本节点的 version：后代的值变化不会导致对象节点重渲染。
// ============================================================================
import { computed } from 'vue'
import CollapseCard from '../../SchemaForm3/components/CollapseCard.vue'
import FieldPopover from '../../SchemaForm3/components/FieldPopover.vue'
import FieldNode from './FieldNode.vue'
import type { ObjectFieldUI } from '../DataUI'
import { getNodeState } from '../context'

const props = defineProps<{
    field: ObjectFieldUI
}>()

const title = computed(() => props.field.label ?? '')
/** 自身版本 + 子节点列表快照 */
const snapshot = computed(() => {
    const state = getNodeState(props.field)
    return {
        version: state.version,
        children: props.field.children,
        visibleChildren: props.field.visibleChildren,
    }
})
/** 供「编辑属性」展示的字段列表（包含已隐藏的 schema 字段与可删除的额外字段） */
const fields = computed(() =>
    snapshot.value.children.map((child) => ({
        name: child.key ?? '',
        checked: child.visible,
        canRemove: child.canRemove,
        schema: child.schema,
    }))
)
const renderChildren = computed(() => snapshot.value.visibleChildren)

const handleVisibleField = (name: string, visible: boolean) => {
    props.field.children.find((child) => child.key === name)?.setVisible(visible)
}
const handleAddField = (name: string) => {
    props.field.addField(name)
}
const handleRemoveField = (name: string) => {
    props.field.removeField(name)
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover v-if="field.schema.allowAddedField" :fields="fields" @visibleField="handleVisibleField"
                @add="handleAddField" @remove="handleRemoveField" />
        </template>
        <FieldNode v-for="child in renderChildren" :key="child.uid" :field="child" />
    </CollapseCard>
</template>
