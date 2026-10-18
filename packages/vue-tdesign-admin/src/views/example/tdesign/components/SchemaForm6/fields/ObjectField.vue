<script setup lang="ts">
// ============================================================================
// ObjectField：对象节点
// 直接迭代节点 children 渲染；字段勾选 / 添加 / 删除都调用节点自身方法
// ============================================================================
import { computed } from 'vue'
import CollapseCard from '../components/CollapseCard.vue'
import FieldPopover from '../components/FieldPopover.vue'
import FieldNode from './FieldNode.vue'
import type {ObjectFieldSchema,FieldPath} from '../types'
import { useSchemaFormContext } from '../composables/useSchemaForm.ts'

const props = defineProps<{
    path:FieldPath
    schema: ObjectFieldSchema
}>()
const form=useSchemaFormContext()
const title = computed(() => {
    const key=typeof props.path[props.path.length-1]
    const index:number|null=typeof key==='number'?key:null
    const label=props.schema.label||''
    return props.schema.formatLabel?props.schema.formatLabel(label,index,props.schema):label
})

const fieldValue=computed({
    get: () => form.getPathValue(props.path,props.schema.defaultValue),
    set: (value) => form.setPathValue(props.path,value),
})
/** 供「编辑属性」展示的字段列表（包含已隐藏的 schema 字段与可删除的额外字段） */
const fields = computed(() =>{
     const state=form.getObjectState(fieldValue.value,props.schema.schemas)
     return state.fields
})
const renderChildren = computed(() => fields.value.filter(v=>v.visible))

const handleVisibleField = (name: string, visible: boolean) => {
    form.setFieldVisible(fieldValue.value,name,visible)
}
const handleAddField = (name: string) => {
    form.addExteralField(fieldValue.value,name)
}
const handleRemoveField = (name: string) => {
    form.removeField(fieldValue.value,name)
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover v-if="schema.allowAddedField" :fields="fields" @visibleField="handleVisibleField"
                @add="handleAddField" @remove="handleRemoveField" />
        </template>
        <div class="object-field-body">
            <div v-for="child in renderChildren" :key="child.key" >
            <FieldNode  :schema="child.schema" :path="[...props.path,child.key]"  />
        </div>
        </div>
    </CollapseCard>
</template>
<style scoped>
    .object-field-body{
        padding:4px;
    }
    .object-field-body>div:nth-of-type(n+2){
        margin-top: 6px;
    }
</style>
