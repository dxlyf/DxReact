<script setup lang="ts">
import {shallowReactive, shallowRef} from 'vue'
import { useDialog } from '@/hooks/useDialog'
import type { FormInstanceFunctions } from 'tdesign-vue-next'

type FormData={
    locale:string
}
type Props={
    onSubmit?:(data:FormData)=>Promise<void>
}
const props=defineProps<Props>()
const formData=shallowReactive<FormData>({
    locale:''
})
const rules={
    locale:[
        {required:true,message:'请选择语言'}
    ]
}
const loading=shallowRef(false)
const formRef=shallowRef<FormInstanceFunctions>()
const [dialogProps, dialogInst] = useDialog({
    header: '发布',
    width: 600
})
const handleOpen=()=>{
    formData.locale=''
    dialogInst.open()
}
const handleSubmit=async ()=>{
    try{
        loading.value=true
        const res=await formRef.value.validate()
        if(res!==true){
            return
        }
        await props.onSubmit?.(formData)
        dialogInst.close()

    }catch(e){

    }finally{
        loading.value=false
    }
}
</script>
<template>
   <slot>
    <t-button theme="default" @click="handleOpen">克隆</t-button>
   </slot>
    <t-dialog v-bind="dialogProps" >
        <t-form :data="formData" label-position="top" :rules="rules" ref="formRef">
            <t-form-item label="发布原因" name="locale">
                <t-select clearable filterable v-model="formData.locale" :options="[{label:'中文',value:'zh-CN'},{label:'英文',value:'en-US'}]" />
            </t-form-item>
        </t-form>
        <template #footer>
            <t-button theme="default" :disabled="loading" @click="dialogInst.close">取消</t-button>
            <t-button theme="primary" :loading="loading" @click="handleSubmit">确定</t-button>
        </template>
    </t-dialog>
</template>
