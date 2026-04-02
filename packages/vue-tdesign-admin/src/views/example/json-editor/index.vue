<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import {JsonEditor,type JsonScheme} from './components/JsonEditor'
const formData=reactive({
    content:''
})

const handleSubmit=()=>{
    console.log('formData',toRaw(formData))
}
const scheme:JsonScheme={
    type:'array',
    items:[]
}
</script>
<template>
    <t-form @submit="handleSubmit" label-align="top">
        <t-form-item label="内容" name="content">
            <t-input v-model="formData.content" />
        </t-form-item>
        <t-form-item label="内容" name="content">
           <JsonEditor :scheme="scheme"></JsonEditor>
        </t-form-item>
        <t-form-item>
            <t-button type="submit" theme="primary">提交</t-button>
        </t-form-item>
    </t-form>
</template>
