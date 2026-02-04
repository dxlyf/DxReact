<template>
    <t-form-item v-bind="finalFormItemProps">
       <slot>
         <component :is="fieldComp" v-bind="finalFieldProps" v-model="model">
        </component>
       </slot>
    </t-form-item>
</template>
<script setup lang="ts">
import {type FormFieldProps,FormFeildComponents, FormFieldTypes, getPlaceholder} from './form-field.ts'
import {computed} from 'vue'
const props=withDefaults(defineProps<FormFieldProps>(),{
    type:'text',
    fieldProps:()=>({}),
    formItemProps:()=>({}),
})
const model=defineModel()
const finalFormItemProps=computed(()=>{
    const newProps=typeof props.formItemProps==='function'?props.formItemProps():props.formItemProps
    return {
        name:props.name,
        ...(props.hideLabel?{labelWidth:0}:{label:props.label}),
        ...newProps,
    } as FormFieldProps['formItemProps']
})
const finalFieldProps=computed<any>(()=>{
    const newProps=typeof props.fieldProps==='function'?props.fieldProps():props.fieldProps
    return {
        placeholder:newProps.placeholder?newProps.placeholder:getPlaceholder(props.type,props.label),
        ...newProps,
    }
})
const fieldComp=computed(()=>{
    return FormFeildComponents[props.type??FormFieldTypes.Text]
})

</script>
