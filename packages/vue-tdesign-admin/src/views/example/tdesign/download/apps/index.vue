<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, shallowRef } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { DialogPlugin, type TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useSearchForm } from '@/views/example/tdesign/hooks/useSearchForm2';
import { useDialog } from '@/hooks/useDialog';
import FCloneDialog from '@/views/example/tdesign/components/FCloneDialog/index.vue';
import { useRouter } from 'vue-router'
import {SearchForm,type SearchField} from '@/views/example/tdesign/components/FSearchForm'
import ProductSelect from '@/views/example/tdesign/components/ProductSelect/index.vue'
const router=useRouter()
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '应用程序',
        to: '/example/tdesign/download/apps'
    },
    {
        content: 'index'
    }
]
const statusOptions = [{
    label: '全部',
    value: ''
}, {
    label: '已发布',
    value: 'Publish'
}, {
    label: '草稿',
    value: 'Draft'
}]

type DownloadAPPDTO={
    id:number,
    slug:string,
    name:string,
    publishAt:string,
    status:string
}
const data=Array.from({length:100},(v,i)=>({
    id:i+1,
    slug:'slug'+(i+1),
    name:'name'+(i+1),
    publishAt:'2023-01-01',
    status:'Publish',
    products:Array.from({length:58},(v,i)=>'product'+(i+1))
}))
const [tableProps, tableInst] = useTable({
  //  defaultParams: searchInst.searchParams.value,
    manualRequest: true,
    tableProps:{
        dragSort:'row-handler',
        onDragSort:({current,target,newData,currentIndex,targetIndex})=>{
           // console.log('onDragSort',current.id,target.id,'currentIndex',currentIndex,'targetIndex',targetIndex)
           let currentId=current.id;
           let targetId=target.id 
           let currentNewIndex=newData.findIndex((item)=>item.id===currentId)
           let targetNewIndex=newData.findIndex((item)=>item.id===targetId)
           let position=currentNewIndex<targetNewIndex?'before':'after'
           console.log('position',position,currentId,targetId)
           tableInst.data.value=newData
        }
    },
    request: async (params) => {
        const newParams = {
            ...params,
        }
        let newData = data.filter((item) => {
            if(newParams.name){
                return item.name.includes(newParams.name)
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
        colKey:'drag',
        width: 40,
    },
    {
        title: '标题',
        colKey: 'slug',
        width: 160,
        ellipsis: true
    }, {
        title: '名称',
        colKey: 'name',
        ellipsis:true,
        width: 160,
    } ,{
        title: '关联产品',
        colKey: 'products',
    }, {
        title: '状态',
        colKey: 'status',
        width: 120
    }, {
        title: '发布时间',
        colKey: 'publishAt',
        width: 120
    }, {
        title: '操作',
        colKey: 'actions',
        width: 160
    }
]
const expandSearch = ref(false)
const handlePreview=(item)=>{
    console.log('handlePreview',item.value)
}
const handleCreate=()=>{
    console.log('handleCreate')
    router.push({path:'./new'})
}
const publishFormData=reactive({
    reason:''
})
const [dialogProps, dialogInst] = useDialog({
    header: '发布',
   // width: 600,
    onConfirm:()=>{
        console.log('reason',publishFormData.reason)
    }
})
const handleOpenPublish=()=>{
    publishFormData.reason=''
    dialogInst.open()
}
const handleSubmitPublish=()=>{
    console.log('handleSubmitPublish',publishFormData.reason)
}
const handleSubmitClone=async (data:any)=>{
    console.log('handleSubmitClone',data)
}
const searchColumns:SearchField[]=[
    {
        name: 'name',
        type: 't-input',
        props: {
            placeholder: '请输入名称'
        }
    },{
        name: 'products',
        type:ProductSelect,
        props: {
            placeholder: '请选择关联产品',
            multiple:true,
            popupProps:{
                // style:{
                //     width:'100%'
                // }
            }
        }
    }
]
const handleSearch=(params:any)=>{
    console.log('handleSearch',params)
    tableInst.query(params)
    
}
const handleEdit=(row)=>{
   // console.log('handleEdit',row)
    router.push({path:'./apps/edit',query:{id:row.id}})
}

const handleDelete=(row)=>{
   DialogPlugin.confirm({
    header: '确认删除',
    body: '确定删除应用吗？',
    onConfirm: () => {
      console.log('删除应用', row);
    },
    onCancel: () => {
      console.log('取消删除');
    },
   })
}
</script>
<template>

    <MainLayout layout='list' show-lang title="应用列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新增</t-button>
            </t-space>
        </template>
        <SearchForm :columns="searchColumns" @change="handleSearch"></SearchForm>
        <Table v-bind="tableProps" :columns="columns">
            <template #image="{ row }">
                <div class="size-[80px] object-cover [&_img]:object-cover">
                    <t-image-viewer attach="body"  :images="[row.image]"  :z-index="1000"  ></t-image-viewer>
                </div>
         
                                       <!-- <template #trigger="{open}">
                        <t-image style="width:50px;height: 50px;" :src="row.image" @click="open" />
                   </template> -->
                
            </template>
            <template #drag="{ row }">
                <t-icon name="move"></t-icon>
            </template>
            <template #slug="{ row }">
                <t-link theme="primary">{{ row.slug }}</t-link>
            </template>

            <template #status="{ row }">
                <t-tag variant="light" :theme="row.status === 'Publish' ? 'success' : 'warning'">{{ row.status }}</t-tag>
            </template>
            <template #products="{ row }">
                 <t-typography-paragraph :ellipsis="{row:2,expandable:false,collapsible:true}">
                    <t-tag variant="light"  class="ml-1 mt-1" theme="default" v-for="(item,i) in row.products" :key="i">{{ item }}</t-tag>
                </t-typography-paragraph>
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
                    <t-link theme="primary" @click="handleDelete(row)">删除</t-link>
                </t-space>
            </template>
        </Table>
    </MainLayout>
</template>
<style scoped>

</style>
