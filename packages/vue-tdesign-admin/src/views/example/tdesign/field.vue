<script setup lang="ts">
import FField from './components/FForm/FField.vue'
import FFormFeild from './components/FForm/FFormFeild.vue'
import {shallowRef,onMounted, reactive, toRaw,ref, watch} from 'vue'

const formRef=shallowRef()

onMounted(()=>{
    console.log('formRef',formRef.value.fieldRef.submit)
})
const handleSubmit=()=>{
    console.log('formData',toRaw(formData))
}
const formData=reactive({
    name:''
})
const rules={
    name:[{required:true,message:'请输入名称'}]
}
const switchValue=ref('1')
watch(switchValue,(val)=>{
    console.log('switchValue',val)
})
</script>
<template>

<FField @submit="handleSubmit" ctype="t-form" ref="formRef" :data="formData" :rules="rules">
    <FFormFeild label="Name" type="t-input" name="name" :field-props="{modelValue:formData.name,'onUpdate:modelValue':(val)=>{console.log('v',val);formData.name=val}}"></FFormFeild>
    <FField ctype="t-button" type="submit" >提交</FField>
</FField>
<t-switch v-model="switchValue" :custom-value="['1','0']"></t-switch>
</template>