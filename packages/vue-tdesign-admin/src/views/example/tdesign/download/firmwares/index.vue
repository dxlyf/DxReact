<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { type TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import { confirm,confirmDelete,delay } from '@/views/example/tdesign/util'
import {SearchForm,type SearchField} from '@/views/example/tdesign/components/FSearchForm'
import TableAction from '@/views/example/tdesign/components/FTable/TableAction.vue'
const router=useRouter()
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '固件',
        to: '/example/tdesign/download/firmwares'
    },
    {
        content: 'index'
    }
]

type TableDataRecord={
    id:number,
    slug:string,
    category:string,
    version:string
}
const data=Array.from({length:100},(v,i)=>({
    id:i+1,
    slug:'slug'+(i+1),
    category:'category'+(i+1),
    version:'version'+(i+1)
}))
const [tableProps, tableInst] = useTable<TableDataRecord>({
  //  defaultParams: searchInst.searchParams.value,
    manualRequest: false,
    request: async (params) => {
        const newParams = {
            ...params,
        }
        let newData = data.filter((item) => {
            if(newParams.name){
                return item.slug.includes(newParams.name)
            }
            return true
        })
       // console.log('request', newParams)
        return {
            success: true,
            records: newData.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: newData.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        title: '标识符',
        colKey: 'slug',
      //  width: 160,
        ellipsis: true
    }, {
        title: '分类',
        colKey: 'category',
        ellipsis:true,
        width: 180,
    } ,{
        title: '版本',
        colKey: 'version',
        ellipsis:true,
        width: 180,
    },  {
        title: '操作',
        colKey: 'actions',
        width: 160
    }
]



const searchColumns=computed<SearchField[]>(()=>{
    return [
        {
            name: 'slug',
            type: 't-input',
            defaultValue:'',
            props: {
                placeholder: '包含Slug'
            }
        },{
            name: 'firmwareCategoryId',
            type: 't-select',
            defaultValue:'',
            props: {
                options: [
                    {
                        label: '全部',
                        value: ''
                    },{
                        label: '分类1',
                        value: 'category1'
                    },
                    {
                        label: '分类2',
                        value: 'category2'
                    }
                ]
            }
        },{
            name: 'linkVersion',
            type: 't-input',
            defaultValue:'',
            props: {
                placeholder: '包含版本'
            }
        }
    ]
})
const handleSearch=(params:any)=>{
    tableInst.query(params)
    
}
const handleCreate=()=>{
    router.push({path:'./firmwares/new'})
}
const handleEdit=(row:TableDataRecord)=>{
   // console.log('handleEdit',row)
    router.push({path:'./firmwares/edit',query:{id:row.id}})
}

const handleDelete=(row:TableDataRecord)=>{
   confirmDelete({

    onConfirm: async () => {
        await delay(1000)
        throw new Error('删除失败')
      console.log('删除应用', row);
    },
    onCancel: () => {
      console.log('取消删除');
    }
   })
}
const actions=[
    {
        label:'编辑',
        key:'edit',
        order:1000,
        onClick:(data)=>{
            console.log('编辑',data)
            router.push({
                path:'./firmwares/edit',
                query:{id:data.id}
            })
        }
    },
    {
        label:'下载',
        key:'download',
        order:300,
        onClick:(data)=>{
            console.log('下载',data)
        }
    },
    {
        label:'查询',
        key:'more',
        onClick:(data)=>{
            console.log('更多',data)
        }
    },
    {
        label:'删除',
        key:'delete',
        order:900,
        props:{
            theme:'danger'
        },
        confirm:{
            body:'确认删除吗？'
        },
        onClick:async (data)=>{
            await delay(2000)
           console.log('删除',data)
        }
    }
]
</script>
<template>

    <MainLayout layout='list' show-lang title="固件列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新增</t-button>
            </t-space>
        </template>
        <SearchForm :columns="searchColumns" @change="handleSearch"></SearchForm>
        <Table v-bind="tableProps" :columns="columns">

            <template #slug="{ row }">
                <t-link theme="primary">{{ row.slug }}</t-link>
            </template>

            <template #category="{ row }">
                {{ row.category||'-' }}
            </template>
            <template #version="{ row }">
                {{ row.version||'-' }}
            </template>

            <template #actions="{ row }">
                <TableAction :data="row" :items="actions" ></TableAction>
            </template>
        </Table>
    </MainLayout>
</template>
<style scoped>

</style>
