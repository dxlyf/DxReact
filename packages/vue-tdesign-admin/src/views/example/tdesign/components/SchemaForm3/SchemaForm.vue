<script setup lang="ts">
import {useSchemaForm,USE_SCHEMA_CONTEXT_KEY} from './composables/useSchemaForm'
import { computed, provide, ref, shallowRef,watch } from 'vue';
import { FormSchema } from './types';
import CollapseCard from './components/CollapseCard.vue';
import FormField from './fields/FormField.vue';
import { normalizeSchema } from './util';
type SchemaFormProps={
    title?:string;
    modelValue?:any;
    schema:FormSchema;
}
const emit=defineEmits(['change','update:modelValue'])
const props=defineProps<SchemaFormProps>() 


const resolveSchema=computed(()=>{
 return normalizeSchema(props.schema)
})
const path=shallowRef([])
const innerUpdate=ref(false)
const form=useSchemaForm({
  onChange(val:any){
    innerUpdate.value=true
    emit('update:modelValue',val)
    emit('change',val)

  }
})
provide(USE_SCHEMA_CONTEXT_KEY,form)

/**
 * 初始化 / 切换数据：外部数据不再走 v-model，必须通过该方法注入。
 * 会按 schema 递归构造 data 中已有值节点的字段状态，缺值字段等添加 / 显示时再构造。
 */
const init=(data:any)=>{
    form.init(data,resolveSchema.value)
}
/** 读取当前对外值（已完成隐藏字段过滤） */
const getValue=()=>form.value.value
defineExpose({init,getValue})

watch(()=>props.modelValue,(val)=>{
    if(innerUpdate.value){
        innerUpdate.value=false
        return
    }
    if(val){
       init(val)
    }
},{
  immediate:true
})
</script>

<template>
  <CollapseCard v-if="title" :title="title">
    <FormField :schema="resolveSchema" :path="path"></FormField>
  </CollapseCard>
  <FormField v-else :schema="resolveSchema" :path="path"></FormField>
</template>
