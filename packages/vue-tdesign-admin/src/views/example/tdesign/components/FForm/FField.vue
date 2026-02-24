<script lang="ts">
import {ref,reactive,defineComponent,useModel,type PropType, toRef,toRefs, computed} from 'vue'
import type { TdInputProps,TdInputNumberProps,FormInstanceFunctions,TdFormProps, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'


export default defineComponent({
    name:'FField',
    props:{
        type:{
            type:Object as PropType<string>,
            default:()=>{}
        }
    },
    setup(props,{attrs,emit,expose}) {
    
        const type=toRef(props,'type')
        const fieldProps=computed(()=>{
            return attrs
        })
        const compRef=ref()
      
        return {
            compRef,
            type,
            fieldProps
        }
    }
})
</script>
<template>
  <component :is="type" v-bind="fieldProps" >
        <template v-for="(value,name,index) of $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
  </component>
</template>