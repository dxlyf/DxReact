<template>
  <div class="flex bg-white rounded-md shadow p-4">
    <t-form class="w-full" @submit="handleSearch" :data="searchParams" @reset="handleReset">
          <t-row :gutter="[8,8]">
            <t-col :span="4">
               <t-form-item name="name" label="名称">
                 <t-input v-model="searchParams.name"></t-input>
               </t-form-item>
            </t-col>    
            <t-col :span="4">
               <t-space>
                    <t-button type="submit" theme="primary">查询</t-button>
                    <t-button type="reset">重置</t-button>
               </t-space>
            </t-col>
        </t-row>
    </t-form>
  </div>
  <div class="mt-4 p-4 bg-white">
    <t-table class="w-full" :pagination="pagination" @change="onTableChange" :loading="state.loading" row-key="id" bordered empty="暂无数据" :data="state.data.records" :columns="columns" >
        <template #actions="{row}">
            <t-space :size="4">
                <t-button tag="a" @click.prevent="console.log(row.name)"  variant="text" theme="primary" size="small">编辑</t-button>
                <t-button tag="a"  variant="text" theme="danger" size="small">删除</t-button>
            </t-space>
        </template>
    </t-table>
  </div>
</template>

<script setup lang="ts">
import useRequest from 'src/hooks/useRequest'
import { request } from 'src/utils/request';
import {Button, Space, type PrimaryTableCol} from 'tdesign-vue-next'
import { computed, reactive, ref } from 'vue';

const searchParams=reactive({
    name:undefined,
})
const columns:PrimaryTableCol[]=[
    {
        title:'序号',
        width:80,
        cell:(h,{row,rowIndex})=>{
            return (rowIndex+1)+''
        }
    },
    {   
        title:'ID',
        colKey:'id',
        width:100
    },
    {
        title:'名称',
        colKey:'name'
    },
    {
        title:'操作',
        width:120,
        colKey:'actions',
        // cell:(h,{row})=>{
        //     return h(Space,{},[
        //         h(Button,{tag:'a',key:'a',variant:'text',theme:'primary',size:'small'},'编辑'),
        //         h(Button,{tag:'a',key:'b',variant:'text',theme:'danger',size:'small'},'删除'),
        //     ])
        // }
    }
]
const delay=(t:number)=>{
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve(null)
        },t)
    })
}
const [state,{query,refresh,onTableChange}]=useRequest({
    defaultValue:{records:[],total:0},
    pagination:{},
    service:async (params)=>{
        await delay(2000)
        const res= await request<{records:any[],total:number}>({
            url:`/list`,
            method:'post',
            data:params
        })
        return res.data
    }
})
const pagination = computed(()=>{
    return {
        total: state.data.total,
        current: state.current,
        pageSize: state.pageSize,
    }
});
const handleSearch=(values:any)=>{
    console.log('search',values)
    refresh(searchParams)

}
const handleReset=(values:any)=>{
   console.log('reset',values)
   refresh(searchParams)
}

</script>
