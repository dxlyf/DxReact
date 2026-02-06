<template>
    <t-button theme="default" @click="handleOpen"><slot></slot></t-button>

      <t-dialog attach="body" :footer="!disabled" :destroy-on-close="true" :header="title" :visible="visible" @confirm="handleConfirm" @close="handleClose">
       <div class="flex justify-end mb-4">
        <t-button type='button' @click="handleAutoFill">用英文一键填充</t-button>
       </div>
        <t-form :disabled="disabled"  :data="formData" @submit="handleSubmit"  ref="formRef">
            <t-form-item  v-for="item in langList" :key="item.value" :label="item.label" :name="`text_${item.suffix}`">
                <t-input  v-model="formData[`text_${item.suffix}`]" />
            </t-form-item>
        </t-form>
    </t-dialog>
</template>
<script setup lang="ts">
import { ref, shallowRef} from 'vue'
import { type TdFormProps,type FormInstanceFunctions } from 'tdesign-vue-next'
import { useLang } from '@/hooks/useLang'
type Props={
    title:string
    disabled?:boolean
}

const props=withDefaults(defineProps<Props>(),{
    disabled:false,
    title:'',
})
const formRef=shallowRef<FormInstanceFunctions>()
const visible=ref(false)
const model=defineModel<Record<string,string>>({default:()=>({})})
const formData=ref<any>({})
const [langList]=useLang()

const handleOpen=()=>{
    visible.value=true
    formData.value={...model.value}
}
const handleConfirm=()=>{
    formRef.value.submit()
}
const handleClose=()=>{
    visible.value=false
}
const handleSubmit:TdFormProps['onSubmit']=(e)=>{
   model.value={...formData.value}
   visible.value=false
}
// 一键填充
const handleAutoFill=()=>{
    langList.value.forEach((item,i)=>{
        if(i>0){
            formData.value['text_'+item.suffix]=formData.value['text_'+langList.value[0].suffix]
        }
    })
}
defineOptions({
    name:'LabelText',
})
</script>
