<script setup lang="ts">
import {SearchForm,type SearchField} from '@/views/example/tdesign/components/FSearchForm/index'
import { shallowRef } from 'vue'
const columns:SearchField[]=[
    {
        name:'name',
        type:'t-input',
        defaultValue:'',
        props:{
            placeholder:'请输入名称'
        }
    },{
        name:'slug',
        type:'t-input',
        defaultValue:'',
        props:{  
            placeholder:'请输入slug'
        }
    },
        {
        name:'status',
        type:'t-select',
        defaultValue:'1',
        props:{
            placeholder:'请选择状态',
            options:[
                {
                    label:'正常',
                    value:'1'
                },
                {
                    label:'停用',
                    value:'0'
            }]
        }
    },
    {
        name:'publishTime',
        type:'t-date-range-picker',
        defaultValue:[],
        visible:false,
        props:{
            
            placeholder:['开始时间','结束时间']
        }
    }
]
const handleSubmit=(params:any)=>{
    console.log('查询',params)
}
const handleReset=(params:any)=>{
    console.log('重置',params)
}
const spans=shallowRef(12)
const syncParamsToUrl=shallowRef(false)
</script>
<template>
    <div>
        <t-input-number v-model="spans" :min="1" :max="24" :step="1" />
        <t-button @click="spans=24">24列</t-button>
        <t-button @click="spans=12">12列</t-button>
        <t-button @click="syncParamsToUrl=!syncParamsToUrl">同步参数到URL</t-button>
    </div>
    <SearchForm :spans="spans" :sync-params-to-url="syncParamsToUrl" @search="handleSubmit" @reset="handleReset" :columns="columns"></SearchForm>
</template>