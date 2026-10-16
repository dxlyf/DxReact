<script setup lang="ts">
// ============================================================================
// ArrayField：数组字段（tabs 模式）
// - 每个 tab 对应一个数组项，项内字段由 itemSchema 递归渲染
// - schema.sortable 为 true 时启用 tab 拖拽排序，用于调整数组项顺序
// - 「编辑属性」Popover 可勾选 / 取消勾选字段：取消勾选只把该路径加入排除列表，
//   提交给 update:modelValue 时排除即可，表单内部数据不变，重新勾选即恢复
// ============================================================================
import { computed, inject, ref } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { type UseSchemaFormInstance, USE_SCHEMA_CONTEXT_KEY } from '../composables/useSchemaForm';
import { type AllFieldSchema, type ArrayFieldSchema, type FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import { createItemBySchema, createAtomFieldSchema, isObject, hasSameFieldNames, mergeFieldsByPrevOrder, moveArrayIndex } from '../util'
import { DialogPlugin } from 'tdesign-vue-next'

type VisibleField = {
    name: string
    checked: boolean
    canRemove: boolean
    schema: AllFieldSchema
}

const props = defineProps<{
    schema: ArrayFieldSchema;
    path: FieldPath;
}>()
const title = computed(() => {
    return props.schema.formatLabel ? props.schema.formatLabel(props.schema.label, props.schema) : props.schema.label
})
const itemLabel = (index: number) => {
    return props.schema.formatItemLabel ? props.schema.formatItemLabel(fieldValue.value[index], index, props.schema) : `选项${index+1}`
}
const activeKey = ref(0)
const form = inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)
const fieldValue = computed({
    get() {
        return form.getValue(props.path, props.schema.defaultValue)
    },
    set(val) {
        form.setValue(props.path, val)
    }
})
const realActiveKey = computed(() => {
    return Math.max(0, Math.min(activeKey.value, fieldValue.value.length - 1))
})

/** 每个数组项各自的字段勾选状态，key 为项下标 */
const arrayFieldMap = ref<Record<number, VisibleField[]>>({})

/** 构建某一项的字段列表：schema 字段不可删；值中存在但不在 schema 里的 key 视为可删的额外字段 */
const buildVisibleFields = (index: number): VisibleField[] => {
    const value = fieldValue.value[index]
    const schemas = props.schema.schemas
    const extraKeys = isObject(value)
        ? Object.keys(value).filter((key) => !schemas.some((item) => item.key === key))
        : []

    const curFields: VisibleField[] = schemas.map((item) => ({
        name: item.key,
        checked: true,
        canRemove: false,
        schema: item
    }))
    const extraFields: VisibleField[] = extraKeys.map((key) => ({
        name: key,
        checked: true,
        canRemove: true,
        schema: createAtomFieldSchema({
            key: key,
            label: key,
            component: 't-input',
            props: {
                placeholder: `请输入${key}`
            }
        })
    }))
    return [...curFields, ...extraFields]
}

/** 读取（首次访问时构建）某项的字段列表，并保留已有的勾选状态 */
const getOrCreateVisibleFields = (index: number): VisibleField[] => {
    const curFields = buildVisibleFields(index)
    const prev = arrayFieldMap.value[index]
    // 字段名集合没变就复用缓存，避免在渲染过程中反复写入响应式状态
    if (prev && hasSameFieldNames(prev, curFields)) return prev
    // 按上次顺序合并：取消勾选的额外字段需要留在原位置以便重新勾选 / 删除
    const merged = mergeFieldsByPrevOrder(prev ?? [], curFields)
    arrayFieldMap.value[index] = merged
    return merged
}

/** 当前项需要渲染的字段（仅勾选中的） */
const getFieldSchemas = (index: number) => {
    return getOrCreateVisibleFields(index).filter(d => d.checked).map(d => d.schema)
}

const visibleFields = computed(() => {
    return getOrCreateVisibleFields(realActiveKey.value)
})
const handleAdd = () => {
    fieldValue.value = [...fieldValue.value, createItemBySchema(props.schema)]
    activeKey.value = fieldValue.value.length - 1
}
const handleRemove = ({ index }: { index: number }) => {
    const dialog = DialogPlugin.confirm({
        header: '确认移除吗？',
        body: '确认移除当前项吗？',
        onConfirm: () => {
            // 删除该项的值，并把其后的排除路径整体前移
            form.removeArrayItem(props.path, index)
            if (index <= activeKey.value) {
                activeKey.value = Math.max(0, activeKey.value - 1)
            }
            // 字段勾选缓存同样随下标前移，避免与其它项错位
            const nextMap: Record<number, VisibleField[]> = {}
            Object.keys(arrayFieldMap.value).forEach((key) => {
                const i = Number(key)
                if (i === index) return
                nextMap[i > index ? i - 1 : i] = arrayFieldMap.value[i]
            })
            arrayFieldMap.value = nextMap
            dialog.destroy()
        }
    })
}
const handleTabChange = (val: any) => {
    activeKey.value = val
}

/** 拖拽排序：调整数组项顺序，并同步勾选缓存 / 排除路径 / 当前选中项 */
const handleDragSort = ({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) => {
    if (currentIndex === targetIndex) return
    form.reorderArrayItem(props.path, currentIndex, targetIndex)
    // 勾选缓存同样按下标迁移，避免与其它项错位
    const nextMap: Record<number, VisibleField[]> = {}
    Object.keys(arrayFieldMap.value).forEach((key) => {
        const from = Number(key)
        nextMap[moveArrayIndex(from, currentIndex, targetIndex)] = arrayFieldMap.value[from]
    })
    arrayFieldMap.value = nextMap
    // 选中项跟随它自己的那一项走
    activeKey.value = moveArrayIndex(activeKey.value, currentIndex, targetIndex)
}

const handleVisibleFieldChange = (fields: any[]) => {
    arrayFieldMap.value[realActiveKey.value] = fields

}

/** 取消勾选：把该路径加入排除列表；重新勾选：移除排除（表单内部数据始终不变） */
const handleVisibleField = (name: string, visible: boolean) => {
    if (visible) {
        form.restorePath([...props.path, realActiveKey.value, name])
    } else {
        form.hidePath([...props.path, realActiveKey.value, name])
    }
}

/** 删除运行时新增的字段：值与其隐藏记录一并移除 */
const handleRemoveVisibleField = (name: string) => {
    form.removePath([...props.path, realActiveKey.value, name])
    const fields = arrayFieldMap.value[realActiveKey.value] || []
    arrayFieldMap.value[realActiveKey.value] = fields.filter(f => f.name !== name)
}

const handleAddVisibleField = (fields: VisibleField[]) => {
    arrayFieldMap.value[realActiveKey.value] = fields
    const lastField = fields[fields.length - 1]
    form.setValue([...props.path, realActiveKey.value, lastField.name], lastField.schema.defaultValue)

}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover @add="handleAddVisibleField" @remove="handleRemoveVisibleField" @visibleField="handleVisibleField" @change="handleVisibleFieldChange"
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
