<script lang="ts">
import {ref,watch,getCurrentInstance,getCurrentScope,reactive,useTemplateRef,defineComponent,useModel,type PropType, toRef,toRefs, computed, shallowRef, onMounted, onBeforeMount, shallowReactive, toRaw} from 'vue'
import type { TdInputProps,TdInputNumberProps,FormInstanceFunctions,TdFormProps, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'


export default defineComponent({
    name:'FField',
    props:{
        ctype:{
            type:String as PropType<string>,
            default:'input'
        },
        fieldRef:{}
    },
    setup(props,{attrs,emit,slots,expose}) {
        const compRef=useTemplateRef('comp')
        
        const fieldProps=computed(()=>{
            console.log('attrs',attrs)
            console.log('props',props)
            return {
                ...attrs
            }
        })
        const instance=getCurrentInstance()
        let currentExpose={}
        //expose(currentExpose)
        const fieldRef=toRef(props,'fieldRef')

        return {
            fieldRef,
            type:props.ctype,
            fieldProps
        }
    }
})
</script>
<template>
  <component ref="fieldRef" :is="type" v-bind="fieldProps" >
        <template v-for="(value,name,index) of $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData || {}" />
        </template>
  </component>
</template>