<script setup lang="ts">
import {SearchForm,type SearchField} from '@/views/example/tdesign/components/FSearchForm/index'
import { shallowRef } from 'vue'
const columns=shallowRef<SearchField[]>([{
    name:'name',
    type:'t-input',
    defaultValue:'afd',
    props:{
        placeholder:'请输入名称1'
    }
}])
const handleSubmit=(params:any)=>{
    console.log('查询',params)
}
const handleReset=(params:any)=>{
    console.log('重置',params)
}
const spans=shallowRef(12)
const syncParamsToUrl=shallowRef(false)
const defaultColumns=shallowRef(4)
const collapseShowRows=shallowRef(1)
const addColumn=()=>{
    columns.value=columns.value.concat({
        name:'name'+(columns.value.length+1),
        type:'t-input',
        defaultValue:'',
        props:{
            placeholder:'请输入名称'+(columns.value.length+1)
        }
    })
}
</script>
<template>
    <div>
        <t-button @click="addColumn">添加列</t-button>
        <t-button @click="columns=columns.slice(0,-1)">移除最后一个</t-button>
        <t-button @click="columns=[]">清空列</t-button>
    </div>
    <div>
        <t-input-number v-model="spans" :min="1" :max="24" :step="1" />
        <t-button @click="spans=24">24列</t-button>
        <t-button @click="spans=12">12列</t-button>
        <t-button @click="syncParamsToUrl=!syncParamsToUrl">同步参数到URL</t-button>
    </div>
    <div>
        <t-input-number v-model="defaultColumns" :min="1" :max="12" :step="1" />
    </div>
    <div>
        <t-input-number v-model="collapseShowRows" :min="1" :step="1" />
    </div>
    <SearchForm class="bg-white p-4 mt-4 rounded-sm" :mounted-query="true" :collapse-show-rows="collapseShowRows" :default-columns="defaultColumns" :spans="spans" :sync-params-to-url="syncParamsToUrl" @search="handleSubmit" @reset="handleReset" :columns="columns">
    </SearchForm>
</template>