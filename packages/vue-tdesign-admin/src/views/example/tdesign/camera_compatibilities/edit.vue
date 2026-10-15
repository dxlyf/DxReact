<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import {SchemaForm,useSchemeForm,type ObjectFieldScheme,type ArrayFieldScheme} from '../components/SchemaForm2'

const formValue=shallowRef({})

const formInstance=useSchemeForm({
    value:[],
    scheme:computed(()=>{
        return {
            type:'array',
            key:'compatibility',
            label:'相机兼容性',
            schemes:[{
                type:'atom',
                key:'title',
                label:'标题',
                component:'t-input'
            }]
        }
    })
})
</script>
<template>
    <t-form label-align="top">
        <t-form-item label="相机兼容性" prop="compatibility">
            <t-input :value="formInstance.valueJson.value" />

        </t-form-item>
        <t-form-item>
            <SchemaForm   :form="formInstance"  title="兼容性" />
        </t-form-item>        
    </t-form>
</template>