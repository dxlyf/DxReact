<script setup lang="ts">
// ============================================================================
// ObjectField：对象字段
// - 卡片 + 收起/展开，子字段递归渲染
// - 右侧「编辑属性」Popover 勾选字段：勾选状态记在对象自身的隐藏集合上，
//   数据始终完整保留，对外输出时按隐藏集合裁剪即可
// ============================================================================
import { computed, inject } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import { type UseSchemaFormInstance, USE_SCHEMA_CONTEXT_KEY } from '../composables/useSchemaForm';
import { type ObjectFieldSchema, type FieldPath } from '../types';

const props = defineProps<{
    schema: ObjectFieldSchema;
    path: FieldPath;
}>()
const form = inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)!
const title = computed(() => {
    return props.schema.formatLabel ? props.schema.formatLabel(props.schema.label, props.schema) : props.schema.label
})

/**
 * 字段列表直接读取节点上已构造的状态（init / 添加字段 / 重新勾选时已就绪），
 * 读取 form.getValue（依赖表单数据）即自动刷新，此处不再惰性构建。
 */
const visibleFields = computed(() =>
    form.getFields(props.path, props.schema.schemas)
)

/** 实际渲染的字段（仅勾选中的） */
const renderFields = computed(() => visibleFields.value.filter((item) => item.checked).map((item) => item.schema))

const handleVisibleField = (name: string, visible: boolean) => {
    form.setFieldVisible(props.path, name, visible, props.schema.schemas)
}
const handleRemoveVisibleField = (name: string) => {
    form.removeField(props.path, name)
}
const handleAddVisibleField = (key: string) => {
    form.addField(props.path, key, undefined, props.schema.schemas)
}
</script>
<template>
    <CollapseCard :title="title">
        <template #extra>
            <FieldPopover v-if="schema.allowAddedField" :fields="visibleFields"
                @add="handleAddVisibleField" @remove="handleRemoveVisibleField" @visibleField="handleVisibleField" />
        </template>
         <div class="sm-object-field-wrap">
               <div v-for="(field, fieldIndex) in renderFields" :key="field.key || fieldIndex">
            <FormField :schema="field" :path="[...path, field.key]"></FormField>
        </div>
         </div>
    </CollapseCard>
</template>
<style scoped>
    .sm-object-field-wrap{
        padding: 6px;
    }
    .sm-object-field-wrap>div{
        margin-top: 6px;
    }
</style>