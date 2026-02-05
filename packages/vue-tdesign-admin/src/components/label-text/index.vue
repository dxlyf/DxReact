<template>
    <t-button theme="default" @click="handleOpen"><slot></slot></t-button>

      <t-dialog attach="body" :destroy-on-close="true" :header="title" :visible="visible" @confirm="handleConfirm" @close="handleClose">
        <t-form   :data="formData" @submit="handleSubmit"  ref="formRef">
            <t-form-item  :rules="[{required:true,message:'请输入'+item.label}]" class="w-full" v-for="item in LANG_LIST" :key="item.value" :label="item.label" :name="item.value">
                <t-input  v-model="formData[item.value]" />
            </t-form-item>
          
        </t-form>
    </t-dialog>
</template>
<script setup lang="ts">
import {  ref, shallowReactive, shallowRef, watchEffect} from 'vue'
import { MessagePlugin, type FormInstanceFunctions } from 'tdesign-vue-next'
import { LANG_LIST } from '../page-lang/config'
type Props={
    title:string
}
type ModelData={
    lang:string
    value:string
}
const props=withDefaults(defineProps<Props>(),{
    title:'',
})

const formRef=shallowRef<FormInstanceFunctions>()
const visible=ref(false)
const model=defineModel<ModelData[]>({default:[]})
const formData=shallowRef<any>({})
defineOptions({
    name:'LabelText',
})

const handleOpen=()=>{
    visible.value=true
    formData.value=model.value.reduce((prev,cur)=>{
        prev[cur.lang]=cur.value
        return prev
    },shallowReactive({}) as any)
}
const handleConfirm=()=>{
    formRef.value.submit()
}
const handleClose=()=>{
    visible.value=false
    formRef.value.reset()
}

const handleSubmit=(e)=>{
   console.log('submit',e)
   if(e.firstError){
    MessagePlugin.error(e.firstError)
    return
   }
   model.value=LANG_LIST.map(d=>{
    return {
        lang:d.value,
        value:formData.value[d.value]
    }
   })
   visible.value=false
}
watchEffect(()=>{
    console.log('model',model.value)
})

watchEffect(()=>{
    console.log('formData',formData.value)
})

</script>
