<script lang="ts">
import {ref,watch,getCurrentInstance,getCurrentScope,reactive,useTemplateRef,defineComponent,useModel,type PropType, toRef,toRefs, computed, shallowRef, onMounted, onBeforeMount, shallowReactive, toRaw} from 'vue'
import type { TdFormItemProps } from 'tdesign-vue-next'
import {omit} from 'lodash-es'

export default defineComponent({
    name:'FromField',
    props:{
        type:{
            type:String,
            default:'t-input'
        },
        fieldProps:{
            type:Object,
            default:()=>({})
        }
    },
    setup(props,{attrs,emit,slots,expose}) {
        const fieldRef=useTemplateRef('fieldRef')
        const formItemRef=useTemplateRef('formItemRef')
        const fieldProps=computed(()=>props.fieldProps||{})
        const formItemProps=computed(()=>{
            return {
                ...attrs
            }
        })
        console.log('ss',slots)
        const fieldSlots={}
        const formItemSlots={}
        const instance=getCurrentInstance()
        expose({
            formItemRef,
            fieldRef
        })
        return {
            type:props.type,
            fieldProps,
            formItemProps,
            fieldSlots
        }
    }
})
</script>
<template>
  <t-form-item ref="formItemRef" name="" v-bind="formItemProps">
       <component ref="fieldRef" :is="type" v-bind="fieldProps">
            <template v-for="(value,name,index) of fieldSlots" :key="name" #[name]="slotData">
                <slot v-if="name" :name="name" v-bind="slotData || {}" />
            </template>
       </component>
  </t-form-item>
</template>