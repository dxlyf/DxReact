<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import {SchemaForm,type FormSchema} from '../components/SchemaForm2'

const formValue=shallowRef([])
const formValueStr=computed(()=>{
    return JSON.stringify(formValue.value)
})
setTimeout(()=>{
    formValue.value=[{"title":"fdfd","groups":[{"title":"fdafda"},{"title":"fdasfdasfda"}]}]
},1000)
const schema=computed<FormSchema>(()=>{
        return {
            type:'array',
            key:'compatibility',
            label:'相机兼容性',
            schemas:[{
                type:'atom',
                key:'title',
                label:'标题',
                component:'t-input'
            },{
                key:'groups',
                type:'array',
                label:'Groups',
                schemas:[
                    {
                        type:'atom',
                        key:'title',
                        label:'标题',
                        component:'t-input'
                    }
                ]
            }]
        }
})
</script>
<template>
    <t-form label-align="top">
        <t-form-item label="相机兼容性" prop="compatibility">
            <t-input :value="formValueStr" />

        </t-form-item>
        <t-form-item>
            <SchemaForm  v-model="formValue"  :schema="schema"  title="兼容性" />
        </t-form-item>        
    </t-form>
</template>