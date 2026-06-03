<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { ref, h } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { DialogPlugin, type TableProps,Icon,Tooltip } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import {SearchForm,type SearchField} from '@/views/example/tdesign/components/FSearchForm'
import FTagList from '@/views/example/tdesign/components/FTagList/index.vue'
const router=useRouter()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '新闻导航',
        to: '/example/tdesign/media/news_navs'
    },
    {
        content: 'index'
    }
]

const localeOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
    { label: '한국어', value: 'ko' },
]

const subscribeOptions = [
    { label: '全部', value: '' },
    { label: '是', value: true },
    { label: '否', value: false },
]

const linkTypeLabelMap: Record<string, string> = {
    'relative-path': '相对链接',
    'absolute-path': '绝对链接',
}

type NewsNavDTO={
    id:number,
    name:string,
    country:string[],
    locale:string,
    isSubscribe:boolean,
    linkType:string,
    linkTarget:string,
    link:string,
}
const data=Array.from({length:100},(v,i)=>({
    id:i+1,
    name:'name'+(i+1),
    country:['US', 'CN', 'JP'].slice(0, (i % 3) + 1),
    locale:['en', 'zh-CN', 'ja'][i % 3],
    isSubscribe: i % 3 === 0,
    linkType: i % 2 === 0 ? 'relative-path' : 'absolute-path',
    linkTarget: i % 2 === 0 ? '_blank' : '_self',
    link: i % 3 === 0 ? '' : 'https://example.com/news/'+(i+1),
}))
const [tableProps, tableInst] = useTable({
    manualRequest: true,
    tableProps:{
        dragSort:'row-handler',
        onDragSort:({current,target,newData,currentIndex,targetIndex})=>{
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
            if(newParams.name && !item.name.includes(newParams.name)){
                return false
            }
            if(newParams.locale && item.locale !== newParams.locale){
                return false
            }
            if(newParams.countrySearch && !item.country.some((c)=>c.includes(newParams.countrySearch))){
                return false
            }
            if(newParams.isSubscribe !== '' && newParams.isSubscribe !== undefined && item.isSubscribe !== newParams.isSubscribe){
                return false
            }
            return true
        })
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
        title:'drag-title'    
        // title:(h)=>h(Tooltip,{
        //     content:'可拖拽排序',
        //     attach:'body',
        // },h(Icon,{name:'info-circle'}))
    },
    {
        title: '名称',
        colKey: 'name',
        ellipsis:true,
        width: 160,
    },
    {
        title: '国家',
        colKey: 'country',
    },
    {
        title: '语言',
        colKey: 'locale',
        width: 100,
    },
    {
        title: '是否订阅',
        colKey: 'isSubscribe',
        width: 100,
    },
    {
        title: '链接类型',
        colKey: 'linkType',
        width: 100,
    },
    {
        title: '链接打开方式',
        colKey: 'linkTarget',
        width: 120,
    },
    {
        title: '链接',
        colKey: 'link',
        ellipsis:true,
        width: 260,
    },
    {
        title: '操作',
        colKey: 'actions',
        width: 160,
    }
]

const handleCreate=()=>{
    console.log('handleCreate')
    router.push({path:'./news_navs/new'})
}

const searchColumns:SearchField[]=[
    {
        name: 'locale',
        type: 't-select',
        props: {
            placeholder: '所有语言',
            options: localeOptions,
            clearable: true,
        }
    },
    {
        name: 'name',
        type: 't-input',
        props: {
            placeholder: '名称包含'
        }
    },
    {
        name: 'countrySearch',
        type: 't-input',
        props: {
            placeholder: '国家代码'
        }
    },
    {
        name: 'isSubscribe',
        type: 't-select',
        props: {
            placeholder: '是否订阅',
            options: subscribeOptions,
            clearable: true,
        }
    },
]
const handleSearch=(params:any)=>{
    console.log('handleSearch',params)
    tableInst.query(params)
}
const handleEdit=(row)=>{
    console.log('handleEdit',row)
    router.push({path:'./news_navs/edit',query:{id:row.id}})
}

const handleDelete=(row)=>{
   DialogPlugin.confirm({
    header: '确认删除',
    body: '确定删除该新闻导航吗？',
    theme:'danger',
    onConfirm: () => {
      console.log('删除新闻导航', row);
    },
    onCancel: () => {
      console.log('取消删除');
    },
   })
}
</script>
<template>

    <MainLayout layout='list' show-lang title="新闻导航列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新增</t-button>
            </t-space>
        </template>
        <SearchForm :columns="searchColumns" @change="handleSearch"></SearchForm>
        <p class="text-gray-400 text-xs mb-2">可拖拽排序调整顺序</p>
        <Table v-bind="tableProps" :columns="columns">
                <template #drag-title="{ row }">
                <t-tooltip content="可拖拽排序" attach="body">
                        <t-icon name="help-circle"></t-icon>
                </t-tooltip>
                </template>
            <template #drag="{ row }">
                <t-icon name="move"></t-icon>
            </template>
            <template #isSubscribe="{ row }">
                <t-tag variant="light" :theme="row.isSubscribe ? 'success' : 'default'">{{ row.isSubscribe ? '是' : '否' }}</t-tag>
            </template>
            <template #country="{ row }">
                <FTagList :items="row.country" />
            </template>
            <template #linkType="{ row }">
                <t-tag variant="light" theme="default">{{ linkTypeLabelMap[row.linkType] || row.linkType }}</t-tag>
            </template>
            <template #linkTarget="{ row }">
                <t-tag variant="light" theme="default">{{ row.linkTarget === '_blank' ? '新窗口打开' : '当前页打开' }}</t-tag>
            </template>
            <template #link="{ row }">
                <t-link theme="primary" :href="row.link" target="_blank">{{ row.link }}</t-link>
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
                    <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
                </t-space>
            </template>
        </Table>
    </MainLayout>
</template>
<style scoped>

</style>
