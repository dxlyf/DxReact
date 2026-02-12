<script setup lang="ts">
import { ref } from 'vue'
import JsonEditor,{type FieldSchema}  from '@/components/json-editor/index.vue'

const schema:FieldSchema[]=[{
    key:'userInfo',
    type:'object',
    label:'用户信息',
    properties:[
        {
            key:'name',
            type:'string',
            label:'姓名'
        },
        {
            key:'age',
            type:'number',
            label:'年龄'
        }
    ]
}]
</script>
<template>
    <json-editor :schema="schema"></json-editor>
    
</template>