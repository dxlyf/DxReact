<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, shallowRef } from 'vue';
import Table from '../components/FTable/index.vue'
import type { TableProps } from 'tdesign-vue-next';
import { useTable } from '../hooks/useTable';
import { useSearchForm } from '../hooks/useSearchForm';
import { useDialog } from '@/hooks/useDialog';
import FCloneDialog from '../components/FCloneDialog/index.vue';
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

const data = [
    {
        id: 1,
        image: '/uploads/aaa.jpg',
        title: '视频标题',
        location: '中国',
        locale: 'zh-CN',
        status: 'Publish',
        publishTime: '2023-01-01'

    }, {
        id: 2,
        image: '/uploads/aaa.jpg',
        title: '视频标题',
        location: '中国',
        locale: 'zh-CN',
        status: 'Draft',
        publishTime: '2023-01-01'
    }]
for (let i = 0; i < 98; i++) {
    data.push({
        id: i + 3,
        image: '/uploads/aaa.jpg',
        title: '视频标题' + i,
        location: '中国',
        locale: 'zh-CN',
        status: 'Publish',
        publishTime: '2023-01-01'
    })
}

const [searchForm, searchInst] = useSearchForm({
    defaultParams: {
        slug: '',
        author: '',
        location: '',
        title: '',
        publishTime: ['', ''],
        publishStartTime: '',
        publishEndTime: '',
        status: ''
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
        }
        let newData = data.filter((item) => {
            if(newParams.title){
                return item.title.includes(newParams.title)
            }
            return true
        })
        console.log('request', newParams)
        return {
            success: true,
            records: newData.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: newData.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        title: '图片',
        colKey: 'image'
    },
    {
        title: '标题',
        colKey: 'title',
        width: 160,
        ellipsis: true
    }, {
        title: '地区',
        colKey: 'location',
        width: 140,
    },
    {
        title: '语言',
        colKey: 'locale',
        width: 120
    }, {
        title: '状态',
        colKey: 'status',
        width: 120
    }, {
        title: '发布时间',
        colKey: 'publishTime',
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
</script>
<template>

    <MainLayout layout='list' show-lang title="视频列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <FCloneDialog :on-submit="handleSubmitClone"></FCloneDialog>
                <t-button theme="default" @click="handleOpenPublish">发布</t-button>
                <t-dropdown @click="handlePreview" trigger="click"
                    :options="[{ content: '预览正式环境', value: '1' }, { content: '预览测试环境', value: '2' }]">
                    <t-button theme="default">
                        预览
                        <template #suffix> <t-icon name="chevron-down" size="16" /></template>
                    </t-button>
                </t-dropdown>
                <t-button theme="primary" @click="handleCreate">新增</t-button>
            </t-space>
        </template>
        <div class="grid grid-cols-4 2xl:grid-cols-5 gap-2">
            <div>
                <t-input placeholder="包含Slug" v-model.trim="searchForm.slug"></t-input>
            </div>
            <div>
                <t-input placeholder="包含Author" v-model="searchForm.author"></t-input>
            </div>
            <div>
                <t-input placeholder="包含位置" v-model="searchForm.location"></t-input>
            </div>
            <div v-show="expandSearch">
                <t-input placeholder="包含标题" v-model="searchForm.title"></t-input>
            </div>
            <div v-show="expandSearch">
                <t-date-range-picker clearable @change="(value)=>{
                    searchForm.publishStartTime=value[0]
                    searchForm.publishEndTime=value[1]
                }" :value="[searchForm.publishStartTime,searchForm.publishEndTime]" format="YYYY-MM-DD"
                    :placeholder="['开始时间', '结束时间']" />
            </div>
            <div v-show="expandSearch">
                <t-select :options="statusOptions" placeholder="状态" v-model="searchForm.status"></t-select>
            </div>
            <div>
                <div class="flex gap-1">
                    <t-button theme="default" @click="searchInst.reset">重置</t-button>
                    <t-button theme="primary" @click="searchInst.search">查询</t-button>
                    <t-link class="self-end !text-xs" theme="primary" @click="expandSearch=!expandSearch">
                        {{ expandSearch ? '收起' : '展开' }}
                        <template #suffixIcon> <t-icon :name="expandSearch ? 'chevron-up' : 'chevron-down'" size="12" /></template>
                    </t-link>
                </div>
            </div>
        </div>
        <Table v-bind="tableProps" :columns="columns">
            <template #image="{ row }">
                <div class="size-[80px] object-cover [&_img]:object-cover">
                    <t-image-viewer attach="body"  :images="[row.image]"  :z-index="1000"  ></t-image-viewer>
                </div>
         
                                       <!-- <template #trigger="{open}">
                        <t-image style="width:50px;height: 50px;" :src="row.image" @click="open" />
                   </template> -->
                
            </template>
            <template #title="{ row }">
                <t-link theme="primary">{{ row.title }}</t-link>
            </template>

            <template #status="{ row }">
                <t-tag variant="light" :theme="row.status === 'Publish' ? 'success' : 'warning'">{{ row.status }}</t-tag>
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary">编辑</t-link>
                    <t-link theme="primary">删除</t-link>
                </t-space>
            </template>
        </Table>
        <t-dialog v-bind="dialogProps">
            <div>
                <t-textarea v-model="publishFormData.reason" rows="5" placeholder="请输入发布原因" ></t-textarea>
            </div>
            <template #footer>
                <t-button theme="primary" @click="handleSubmitPublish">发布</t-button>
            </template>
        </t-dialog>
    </MainLayout>
</template>
<style scoped>
.viewer__base {
  width: 160px;
  height: 160px;
  margin: 10px;
  border: 4px solid var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-medium);
}
</style>
