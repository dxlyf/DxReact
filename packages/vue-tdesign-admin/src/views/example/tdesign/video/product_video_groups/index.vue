<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, shallowRef } from 'vue';
// import Table from '../components/FTable/index.vue'
import type { TableProps } from 'tdesign-vue-next';
import { useTable } from '../../hooks/useTable';
import { useSearchForm } from '../../hooks/useSearchForm';
import { useRouter } from 'vue-router'
const router=useRouter()
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '视频列表',
        to: '/example/tdesign/video/list'
    },
    {
        content: 'index'
    }
]
type ProductVideoGroupDTO={
    id:number
    slug:string
    title:string
    childCount?:number
    nodes?:ProductVideoGroupDTO[]
}
const data:ProductVideoGroupDTO[]=[
    {
        id:1,
        slug:'group-1',
        title:'分组1',
        childCount:null,
        nodes:null
    },
    {
        id:2,
        slug:'group-2',
        title:'分组2',
        childCount:20,
        nodes:[{
            id:21,
            slug:'group-2-1',
            title:'分组2-1',
            childCount:null,
            nodes:null
        },{
            id:22,
            slug:'group-2-2',
            title:'分组2-2',
            childCount:null,
            nodes:null
        }]
    },
]


const [searchForm, searchInst] = useSearchForm({
    defaultParams: {
        slug:'',
        title:'',
    },
    onSearch: (params) => {
        tableInst.query(params)
    },
    onReset: (params) => {
        tableInst.query(params)
    }
})


const [tableProps, tableInst] = useTable({
    defaultParams: searchInst.searchParams.value,
    request: async (params) => {
        const newParams = {
            ...params,
            ...searchForm
        }
        console.log('request', newParams)
        return {
            success: true,
            records: data.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: data.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        title: '视频分组名称',
        colKey: 'title'
    },{
        title: '',
        colKey: 'childCount',
        width:60
    }
]
const handleCreate=()=>{
    router.push({path:'./new'})
}
const handleEdit=(item)=>{
    router.push('./show?id='+item.id)
}
</script>
<template>

    <MainLayout layout='list' show-lang title="产品视频分组" :breadcrumb-options="breadcrumbOptions">
        <template #actions>
            <t-space>
                <t-button theme="primary" @click="handleCreate">创建视频分组</t-button>
            </t-space>
        </template>
        <div class="grid grid-cols-4 2xl:grid-cols-5 gap-2">
            <div>
                <t-input placeholder="输入slug" v-model="searchForm.slug"></t-input>
            </div>
            <div>
                <t-input placeholder="输入分组名称" v-model="searchForm.title"></t-input>
            </div>
            <div>
                <div class="flex gap-4">
                    <t-button theme="default" @click="searchInst.reset">重置</t-button>
                    <t-button theme="primary" @click="searchInst.search">查询</t-button>
                </div>
            </div>
        </div>
        <t-enhanced-table  v-bind="tableProps"  :columns="columns" :tree="{childrenKey:'nodes'}">
           <template #treeExpandAndFoldIcon="{row,type}">
                <t-icon :name="type==='expand' ? 'caret-right-small' : 'caret-down-small'" size="16" />
            </template>
            <template #title="{row}">
                <t-link @click="handleEdit(row)" theme="primary">{{row.title||row.slug}}</t-link>
            </template>
            <template #childCount="{row}">
                <div v-if="row.childCount!==null" class="rounded-full bg-gray-600 text-white text-xs inline-block min-w-6 text-center p-1">
                    {{row.childCount}}
                </div>
            </template>
        </t-enhanced-table>

    </MainLayout>
</template>
<style scoped>

</style>
