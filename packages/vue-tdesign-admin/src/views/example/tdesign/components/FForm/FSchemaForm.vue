<script lang="ts">
import {ref,reactive,defineComponent,useModel,type PropType, toRef} from 'vue'
import type { TdInputProps,TdInputNumberProps,FormInstanceFunctions,TdFormProps, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'

export const FieldValueTypeMap={
  text:'t-input',
  number:'t-input-number',
  select:'t-select',
}
export type FieldComponentPropsMap={
  text:TdInputProps,
  number:TdInputNumberProps,
  select:TdSelectProps
}
export type ValueOrGetter<T> = T | (() => T)
export type FieldType<T extends keyof FieldComponentPropsMap = keyof FieldComponentPropsMap> ={
  name?: string
  label?: string
  type?:T

  formItemProps?:ValueOrGetter<TdFormItemProps>
  fieldProps?:ValueOrGetter<FieldComponentPropsMap[T]>
}
export type InternalFieldType=Omit<FieldType,'formItemProps'|'fieldProps'>&{
  
}

export default defineComponent({
    name:'FSchemaForm',
    props:{
        columns:{
            type:Array as PropType<FieldType[]>,
            default:()=>[]
        },
        modelForm:{
            type:Object as PropType<Record<string,any>>,
            default:()=>{}
        },
        formProps:{
            type:Object as PropType<Partial<TdFormProps>>,
            default:()=>{}
        }
    },
    emits:['update:modelForm'],
    setup(props,{emit}){
        const formData=useModel(props,'modelForm')
        const formProps=toRef(props,'formProps')
        return {
            formData
        }
    }

})
</script>

<template>
    <t-form :data="formData"  v-bind="formProps" >
        <template v-for="(item,index) of columns" :key="index">
            <FField :type="item.type" v-bind="item.formItemProps" >
                <template #label="{label}">
                    {{ label }}
                </template>
            </FField>
        </template>
    </t-form>
</template>