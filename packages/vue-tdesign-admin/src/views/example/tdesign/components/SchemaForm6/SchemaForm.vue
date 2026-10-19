<script setup lang="ts">

import { shallowRef, watch,provide, ref, computed } from 'vue'
import CollapseCard from '../SchemaForm3/components/CollapseCard.vue'
import FieldNode from './fields/FieldNode.vue'
import type { AllFieldSchema } from './types'
import { useSchemaForm,SCHEMA_FORM_PROVIDE, normalizeSchema} from './composables/useSchemaForm.ts';

type SchemaFormProps = {
    title?: string
    schema: AllFieldSchema
    modelValue:any
}
const props = defineProps<SchemaFormProps>()
const emit = defineEmits<{ change: [value: any],'update:modelValue': [value: any] }>()
const resolveSchema=computed(()=>normalizeSchema(props.schema))

const form=useSchemaForm(props.modelValue,{
    onChange(val){
        isInternalUpdate.value=true;
        emit('update:modelValue',val)
    }
})
provide(SCHEMA_FORM_PROVIDE,form)
const init=(data:any)=>{
    form.init(data)
}
const isInternalUpdate = ref(false)
watch(()=>props.modelValue,(val)=>{
    // 如果是内部 emit 引起的回流，直接跳过
    if (isInternalUpdate.value) {
      isInternalUpdate.value = false
      return
    }
    init(val)
})

defineExpose({ init })
</script>
<template>
    <CollapseCard v-if="title" :title="title">
        <FieldNode :schema="resolveSchema" :path="[]" />
    </CollapseCard>
    <FieldNode v-else :schema="resolveSchema" :path="[]" />
</template>
