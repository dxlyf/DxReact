<template>
    <t-form-item v-bind="finalFormItemProps">
       <slot>
         <component :is="fieldComp" v-bind="finalFieldProps" v-model="model">
        </component>
       </slot>
    </t-form-item>
</template>
<script setup lang="ts">
import {type FormFieldProps,FormFeildComponents, FormFieldTypes} from './form-field.ts'
import {computed} from 'vue'
const props=withDefaults(defineProps<FormFieldProps>(),{
    type:'text',
    fieldProps:()=>({}),
    formItemProps:()=>({}),
})
const model=defineModel()
const finalFormItemProps=computed<any>(()=>{
    const newProps=typeof props.formItemProps==='function'?props.formItemProps():props.formItemProps
    return {
        name:props.name,
        label:props.label,
        ...newProps,
    }
})
const finalFieldProps=computed<any>(()=>{
    const newProps=typeof props.fieldProps==='function'?props.fieldProps():props.fieldProps
    return newProps
})
const fieldComp=computed(()=>{
    return FormFeildComponents[props.type??FormFieldTypes.Text]
})

</script>
