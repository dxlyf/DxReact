<script  lang="ts">
import { ref, computed, watch, type PropType, defineComponent } from 'vue'
import type { FormInstanceFunctions, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'
import type { TdInputProps,TdInputNumberProps } from 'tdesign-vue-next'

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
export type InternalFieldType<T extends keyof FieldComponentPropsMap = keyof FieldComponentPropsMap>=Omit<FieldType<T>,'formItemProps'|'fieldProps'>&{
  fieldProps:FieldComponentPropsMap[T]
  formItemProps:TdFormItemProps

}


export default defineComponent({
  props:{
    columns:{
      type:Array as PropType<InternalFieldType[]>,
      default:()=>[]
    }
  },
  setup(props){
     return {
        columns:props.columns
     }
  }
})
</script>

<template>
    <t-form
      ref="formRef"
      :data="formData"
      :colon="true"
      label-align="right"
      class="search-form"
    >
      <t-row :gutter="16">
        <t-col
          v-for="field in displayedFields"
          :key="field.name"
          :span="field.span || fieldSpan"
        >
        
        </t-col>
      </t-row>
    </t-form>
</template>

<style scoped>

</style>
