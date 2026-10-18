<script setup lang="ts">
// ============================================================================
// ArrayField：数组节点（tabs 模式）
// 每个 tab 对应一个数组项节点；项的增删 / 排序直接操作 ArrayFieldUI.children，
// 因为状态就挂在节点上，不再需要任何下标迁移
// ============================================================================
import { computed, ref } from 'vue'
import { DialogPlugin } from 'tdesign-vue-next'
import CollapseCard from '../../SchemaForm3/components/CollapseCard.vue'
import FieldPopover from '../../SchemaForm3/components/FieldPopover.vue'
import FieldNode from './FieldNode.vue'
import { ObjectFieldUI, type ArrayFieldUI } from '../ReactiveUI'
import { moveArrayIndex } from '../../SchemaForm3/util'

const props = defineProps<{
    field: ArrayFieldUI
}>()

const title = computed(() => props.field.label ?? '')
const activeIndex = ref(0)

/** 数组项节点 + 实际要渲染的子节点（对象项直接渲染其字段，避免多套一层卡片） */
const items = computed(() =>
    props.field.children.map((child, index) => {
        const object = child instanceof ObjectFieldUI ? child : null
        return {
            uid: child.uid,
            label: props.field.itemLabel(index),
            fields: object ? object.visibleChildren : [child],
            object,
        }
    })
)
const realActiveIndex = computed(() => Math.max(0, Math.min(activeIndex.value, items.value.length - 1)))
const activeObject = computed(() => items.value[realActiveIndex.value]?.object ?? null)
const activeFields = computed(() =>
    activeObject.value
        ? activeObject.value.children.map((child) => ({
              name: child.key ?? '',
              checked: child.visible,
              canRemove: child.canRemove,
              schema: child.schema,
          }))
        : []
)

const handleVisibleField = (name: string, visible: boolean) => {
    activeObject.value?.children.find((child) => child.key === name)?.setVisible(visible)
}
const handleAddField = (name: string) => {
    activeObject.value?.addField(name)
}
const handleRemoveField = (name: string) => {
    activeObject.value?.removeField(name)
}

const handleTabChange = (value: any) => {
    activeIndex.value = value as number
}
const handleAdd = () => {
    activeIndex.value = props.field.addItem()
}
const handleRemoveItem = ({ index }: { index: number }) => {
    const dialog = DialogPlugin.confirm({
        header: '确认移除吗？',
        body: '确认移除当前项吗？',
        onConfirm: () => {
            props.field.removeItem(index)
            if (index <= activeIndex.value) {
                activeIndex.value = Math.max(0, activeIndex.value - 1)
            }
            dialog.destroy()
        },
    })
}
const handleDragSort = ({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) => {
    props.field.moveItem(currentIndex, targetIndex)
    activeIndex.value = moveArrayIndex(activeIndex.value, currentIndex, targetIndex)
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover
                v-if="field.schema.valueType !== 'array<string>' && field.schema.allowAddedField && items.length > 0"
                :fields="activeFields" @visibleField="handleVisibleField" @add="handleAddField"
                @remove="handleRemoveField" />
        </template>
        <t-tabs theme="card" :value="realActiveIndex" :addable="field.schema.allowAdded"
            :drag-sort="!!field.schema.sortable" @change="handleTabChange" @add="handleAdd"
            @remove="handleRemoveItem" @drag-sort="handleDragSort">
            <t-tab-panel v-for="(item, index) in items" :key="item.uid" :label="item.label"
                :value="index" removable>
                <div class="p-2">
                    <FieldNode v-for="child in item.fields" :key="child.uid" :field="child" />
                </div>
            </t-tab-panel>
        </t-tabs>
    </CollapseCard>
</template>
