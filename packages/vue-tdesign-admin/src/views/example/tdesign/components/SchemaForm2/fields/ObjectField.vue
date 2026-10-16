<script setup lang="ts">
// ============================================================================
// ObjectField：对象字段
// - 卡片 + 收起/展开，子字段递归渲染
// - 右侧「编辑属性」Popover 勾选字段：取消勾选只把该路径加入排除列表，
//   提交给 update:modelValue 时排除即可，表单内部数据不变，重新勾选即恢复
// ============================================================================
import { computed, inject, ref, watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import { type UseSchemaFormInstance, USE_SCHEMA_CONTEXT_KEY } from '../composables/useSchemaForm';
import { type AllFieldSchema, type FieldPath, type ObjectFieldSchema } from '../types';
import { createAtomFieldSchema, hasSameFieldNames, isObject, mergeFieldsByPrevOrder } from '../util';

type VisibleField = {
    name: string
    checked: boolean
    canRemove: boolean
    schema: AllFieldSchema
}

const props = defineProps<{
    schema: ObjectFieldSchema;
    path: FieldPath;
}>()
const form = inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)
const title = computed(() => {
    return props.schema.formatLabel ? props.schema.formatLabel(props.schema.label, props.schema) : props.schema.label
})

/** 字段列表（含被排除的字段，供 Popover 展示勾选状态） */
const fieldCache = ref<VisibleField[]>([])

/** 构建字段列表：schema 字段不可删；值中存在但不在 schema 里的 key 视为可删的额外字段 */
const buildVisibleFields = (): VisibleField[] => {
    const value = form.getValue(props.path, props.schema.defaultValue)
    const schemas = props.schema.schemas
    const extraKeys = isObject(value)
        ? Object.keys(value).filter((key) => !schemas.some((item) => item.key === key))
        : []
    const curFields: VisibleField[] = schemas.map((item) => ({
        name: item.key,
        checked:true,
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

/**
 * 该字段是否存在于初始化数据中（由 initHiddenPaths 判定）。
 * - 存在 → 勾选状态交由字段自身的 checked 维护（可被用户勾选 / 取消）；
 * - 不存在 → 强制未勾选。
 */
const isChecked = (name: string) => !form.isInitHidden([...props.path, name])

const getVisibleFields = (): VisibleField[] => {
    const curFields = buildVisibleFields()
    const prev = fieldCache.value
    // 字段名集合没变就复用缓存，避免在渲染过程中反复写入响应式状态
    if (!prev.length || !hasSameFieldNames(prev, curFields)) {
        // 按上次顺序合并：取消勾选的额外字段需要留在原位置以便重新勾选 / 删除
        fieldCache.value = mergeFieldsByPrevOrder(prev, curFields)
    }
    // 存在于初始数据的字段，勾选状态由字段自身的 checked 维护；初始不存在的字段强制未勾选
    return fieldCache.value.map((field) => ({
        ...field,
        checked: isChecked(field.name) ? field.checked : false,
    }))
}

const visibleFields = computed(() => getVisibleFields())

/** 实际渲染的字段（仅勾选中的） */
const renderFields = computed(() => visibleFields.value.filter((item) => item.checked).map((item) => item.schema))

/** 用户手动勾选 / 取消勾选：改写字段自身的 checked，并同步表单的隐藏记录 */
const handleVisibleField = (name: string, visible: boolean) => {
    const path = [...props.path, name]
    // 字段存在于初始数据时，其勾选状态由自身维护，这里直接改写缓存中的 checked
    const target = fieldCache.value.find((field) => field.name === name)
    if (target) target.checked = visible
    // 同步表单隐藏状态：勾选恢复、取消勾选排除（表单内部数据不变）
    if (visible) {
        form.restorePath(path)
    } else {
        form.hidePath(path)
    }
}

/** 数据被重新初始化时，清空页面状态（字段勾选缓存） */
watch(() => form.initVersion.value, () => {
    fieldCache.value = []
})

/** 删除运行时新增的字段：真正从数据中移除该属性 */
const handleRemoveVisibleField = (name: string) => {
    form.removePath([...props.path, name])
    fieldCache.value = fieldCache.value.filter((item) => item.name !== name)
}

const handleAddVisibleField = (fields: VisibleField[]) => {
    fieldCache.value = fields
    const lastField = fields[fields.length - 1]
    form.setValue([...props.path, lastField.name], lastField.schema.defaultValue)
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover v-if="schema.allowAddedField" :fields="visibleFields"
                @add="handleAddVisibleField" @remove="handleRemoveVisibleField" @visibleField="handleVisibleField" />
        </template>
        <template v-for="(field, fieldIndex) in renderFields" :key="field.key || fieldIndex">
            <FormField :schema="field" :path="[...path, field.key]"></FormField>
        </template>
    </CollapseCard>
</template>
