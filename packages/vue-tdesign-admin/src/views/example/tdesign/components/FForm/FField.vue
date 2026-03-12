<script lang="ts">
import {ref,watch,getCurrentInstance,getCurrentScope,reactive,useTemplateRef,defineComponent,useModel,type PropType, toRef,toRefs, computed, shallowRef, onMounted, onBeforeMount, shallowReactive, toRaw} from 'vue'
import type { TdInputProps,TdInputNumberProps,FormInstanceFunctions,TdFormProps, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'


export default defineComponent({
    name:'FField',
    props:{
        ctype:{
            type:String as PropType<string>,
            default:'input'
        }
    },
    setup(props,{attrs,emit,slots,expose}) {
        const compRef=useTemplateRef('comp')
        
        const fieldProps=computed(()=>{
            return {
                ...attrs
            }
        })
        const instance=getCurrentInstance()
        expose({
            fieldRef:compRef
        })
        return {
            type:props.ctype,
            fieldProps
        }
    }
})
</script>
<template>
  <component ref="comp" :is="type" v-bind="fieldProps" >
        <template v-for="(value,name,index) of $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
  </component>
</template>