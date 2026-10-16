<script setup lang="ts">
import {useSchemaForm,USE_SCHEMA_CONTEXT_KEY} from './composables/useSchemaForm'
import { computed, provide, shallowRef } from 'vue';
import { FormSchema } from './types';
import CollapseCard from './components/CollapseCard.vue';
import FormField from './fields/FormField.vue';
import { normalizeSchema } from './util';
type SchemaFormProps={
    title?:string;
    schema:FormSchema;
}
const emit=defineEmits(['change'])
const props=defineProps<SchemaFormProps>() 


const resolveSchema=computed(()=>{
 return normalizeSchema(props.schema)
})
const path=shallowRef([])
const form=useSchemaForm({
  onChange(val:any){
     emit('change',val)
  }
})
provide(USE_SCHEMA_CONTEXT_KEY,form)

/**
 * 初始化 / 切换数据：外部数据不再走 v-model，必须通过该方法注入。
 * 会清空表单内部所有页面状态，并按 schema 重新构建初始隐藏字段。
 */
const init=(data:any)=>{
    form.init(data,resolveSchema.value)
}
/** 读取当前对外值（已完成隐藏字段过滤） */
const getValue=()=>form.value.value
defineExpose({init,getValue})
</script>

<template>
  <CollapseCard v-if="title" :title="title">
    <FormField :schema="resolveSchema" :path="path"></FormField>
  </CollapseCard>
  <FormField v-else :schema="resolveSchema" :path="path"></FormField>
</template>



