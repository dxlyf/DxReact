<script setup lang="ts">
import FField from './components/FForm/FField.vue'
import {shallowRef,onMounted, reactive, toRaw,ref} from 'vue'

const formRef=shallowRef()

onMounted(()=>{
    console.log('formRef',formRef.value)
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
</script>
<template>

<FField @submit="handleSubmit" ctype="t-form" :field-ref="formRef" :data="formData" :rules="rules">
    <t-form-item name="name" label="name">
        <FField ctype="t-input" v-model="formData.name"></FField>
    </t-form-item>
    <FField ctype="t-button" type="submit" >提交</FField>
</FField>
</template>