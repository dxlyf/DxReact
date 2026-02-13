<script  lang="ts">
import { ref,onMounted,defineComponent,type PropType, reactive } from 'vue'
import type {TdFormProps,TdFormItemProps} from 'tdesign-vue-next'


const FieldTypeMap={
    text:'t-input',
    select:'t-select',
    date:'t-date-picker',
    datetime:'t-datetime-picker',
    time:'t-time-picker',
    radio:'t-radio-group',
    checkbox:'t-checkbox-group',
    switch:'t-switch',
    slider:'t-slider',
    rate:'t-rate',
    upload:'t-upload',
    textarea:'t-textarea',
    tree:'t-tree-select',
    cascader:'t-cascader',
    color:'t-color-picker',
}
type FieldComponentType=keyof typeof FieldTypeMap
type FSearchColumnProps={
    label?:string
    name?:string
    type?:|string|FieldComponentType
    formItemProps?:TdFormItemProps|(()=>TdFormItemProps)
    fieldProps?:any|(()=>any)
}
type RenderFSearchColumnProps={
    label?:string
    name?:string
    type?:string
    formItemProps?:TdFormItemProps
}&Omit<FSearchColumnProps,'label'|'name'|'type'|'formItemProps'>

type FSearchFormProps={
    columns?:FSearchColumnProps[]
}

export default defineComponent({
    name:'FSearchForm',
    props:{

    },
    setup(props){
        const formRef=ref()
        const formData=reactive({})
        return {
            formRef,
            formData
        }
    }
})
</script>

<template>
    <t-form :data="formData" ref="formRef">
    </t-form>
</template>