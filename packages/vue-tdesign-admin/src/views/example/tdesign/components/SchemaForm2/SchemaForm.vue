<script setup lang="ts">
import {useSchemaForm,type UseSchemaFormInstance,USE_SCHEMA_CONTEXT_KEY} from './composables/useSchemaForm.ts'
import { computed, inject, provide, shallowRef, toRaw, watch } from 'vue';
import { FormSchema } from './types.ts';
import CollapseCard from './components/CollapseCard.vue';
import FormField from './fields/FormField.vue';
import { deepEqual, normalizeSchema } from './util.ts';
type SchemaFormProps={
    title?:string;
    schema:FormSchema;
    modelValue:any;
}
const emit=defineEmits(['update:modelValue'])
const props=defineProps<SchemaFormProps>() 


const resolveSchema=computed(()=>{
 return normalizeSchema(props.schema)
})
const path=shallowRef([])
const form=useSchemaForm({
  value:props.modelValue,
  onChange(val:any){
     emit('update:modelValue',val)
  }
})
provide(USE_SCHEMA_CONTEXT_KEY,form)
watch(()=>props.modelValue,(newVal)=>{
    if(!deepEqual(newVal,form.value.value)){
      form.setValue([],newVal,true)
    }
})

</script>

<template>
  <CollapseCard v-if="title" :title="title">
    <FormField :schema="resolveSchema" :path="path"></FormField>
  </CollapseCard>
  <FormField v-else :schema="resolveSchema" :path="path"></FormField>
</template>