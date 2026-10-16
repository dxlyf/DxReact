<script setup lang="ts">
// ============================================================================
// ArrayField：数组字段（tabs 模式）
// - 每个 tab 对应一个数组项，项内字段由 itemSchema 递归渲染
// - schema.sortable 为 true 时启用 tab 拖拽排序，用于调整数组项顺序
// - 「编辑属性」勾选状态与字段顺序挂在各数组项对象自身的不可访问字段上，项增删 / 排序时
//   字段列表随对象一起移动，无需任何下标迁移
// ============================================================================
import { computed, inject, ref, watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { type UseSchemaFormInstance, USE_SCHEMA_CONTEXT_KEY } from '../composables/useSchemaForm';
import { type ArrayFieldSchema, type FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import { createItemBySchema, moveArrayIndex } from '../util'
import { DialogPlugin } from 'tdesign-vue-next'

const props = defineProps<{
    schema: ArrayFieldSchema;
    path: FieldPath;
}>()
const form = inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)!
const title = computed(() => {
    return props.schema.formatLabel ? props.schema.formatLabel(props.schema.label, props.schema) : props.schema.label
})
const fieldValue = computed(() => form.getValue(props.path, props.schema.defaultValue))
const itemLabel = (index: number) => {
    return props.schema.formatItemLabel ? props.schema.formatItemLabel(fieldValue.value[index], index, props.schema) : `选项${index+1}`
}
const activeKey = ref(0)
const realActiveKey = computed(() => {
    return Math.max(0, Math.min(activeKey.value, fieldValue.value.length - 1))
})

/** 当前项需要渲染的字段（仅勾选中的，读取节点上已构造的状态） */
const getFieldSchemas = (index: number) => {
    return form.getFields([...props.path, index], props.schema.schemas)
        .filter((item) => item.checked)
        .map((item) => item.schema)
}
/** 当前选中项的字段列表（供 Popover 展示勾选状态） */
const visibleFields = computed(() =>
    form.getFields([...props.path, realActiveKey.value], props.schema.schemas)
)

const handleAdd = () => {
    const next = [...fieldValue.value, createItemBySchema(props.schema)]
    form.setValue(props.path, next)
    // 新增项对象尚未有状态，按需构造，否则新 tab 渲染为空
    form.initFields(props.path, props.schema)
    activeKey.value = next.length - 1
}
const handleRemove = ({ index }: { index: number }) => {
    const dialog = DialogPlugin.confirm({
        header: '确认移除吗？',
        body: '确认移除当前项吗？',
        onConfirm: () => {
            // 删除该项即可：其余项对象各自携带状态，无需迁移
            form.setValue(props.path, fieldValue.value.filter((_item: any, i: number) => i !== index))
            if (index <= activeKey.value) {
                activeKey.value = Math.max(0, activeKey.value - 1)
            }
            dialog.destroy()
        }
    })
}
const handleTabChange = (val: any) => {
    activeKey.value = val
}
/** 拖拽排序：调整数组项顺序，状态随对象移动，仅需同步当前选中项 */
const handleDragSort = ({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) => {
    if (currentIndex === targetIndex) return
    const next = [...fieldValue.value]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)
    form.setValue(props.path, next)
    activeKey.value = moveArrayIndex(activeKey.value, currentIndex, targetIndex)
}

const handleVisibleField = (name: string, visible: boolean) => {
    form.setFieldVisible([...props.path, realActiveKey.value], name, visible, props.schema.schemas)
}
const handleRemoveVisibleField = (name: string) => {
    form.removeField([...props.path, realActiveKey.value], name)
}
const handleAddVisibleField = (key: string) => {
    form.addField([...props.path, realActiveKey.value], key, undefined, props.schema.schemas)
}

/** 数据被重新初始化时，回到第一个选项 */
watch(() => form.initVersion.value, () => {
    activeKey.value = 0
})
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover @add="handleAddVisibleField" @remove="handleRemoveVisibleField" @visibleField="handleVisibleField"
                v-if="fieldValue.length > 0 && schema.valueType === 'array<object>' && schema.allowAddedField"
                :fields="visibleFields" />
        </template>
        <t-tabs theme="card" :value="realActiveKey" :addable="schema.allowAdded" :drag-sort="!!schema.sortable"
            @change="handleTabChange" @add="handleAdd" @remove="handleRemove" @drag-sort="handleDragSort">
            <t-tab-panel :label="itemLabel(index as number)" :value="index" removable v-for="(item, index) in fieldValue" :key="index">
                <div class="p-2" >
                    <template v-for="(field, fieldIndex) in getFieldSchemas(index as number)"
                        :key="field.key || fieldIndex">
                        <FormField :schema="field"
                            :path="schema.valueType === 'array<object>' ? [...path, index, field.key] : [...path, index]">
                        </FormField>
                    </template>
                </div>
            </t-tab-panel>
        </t-tabs>
    </CollapseCard>
</template>
