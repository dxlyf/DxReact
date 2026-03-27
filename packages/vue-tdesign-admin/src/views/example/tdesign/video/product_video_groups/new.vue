<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef, watchEffect,watch } from 'vue';
import type { FormInstanceFunctions, TableProps } from 'tdesign-vue-next';
import { useRequest } from '@/hooks/useRequest2'
import CountrySelect from '@/components/country-select/index.vue'
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { useRouter, useRoute } from 'vue-router'
import {useSelect} from '../../hooks/useSelect'
import FSelectPagination from '../../components/FSelectPagination/index.vue'


const router = useRouter()
const route = useRoute()

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
        content: '新增视频'
    }
]
type VideoGroupDTO = {
    slug: string
    title: string
    parentId?: number
    videoIds?: number[]
    locale?: string
}
type FormData = {
    id?: number
    slug: string
    title: string
    parentId?: { label: string, value: number }
    videoIds?: { label: string, value: number }[]
}

const rules = {
    slug: [
        { required: true, whitespace: true, message: '请输入视频slug' },
        {
            pattern: /^[a-z0-9_\-]+$/,
            message: 'Slug只能包含小写字母、数字、短横线或下划线'
        }
    ],
    title: [
        { required: true, whitespace: true, message: '请输入视频标题' }
    ]
}
const formData = reactive<FormData>({
    slug: '',
    title: '',
    parentId:{label:'无',value:-1},
    videoIds: [{label:'视频1',value:1}]
})

watch([()=>route.query.parent_id,()=>route.query.parent_title],([parentId,parentTitle])=>{
    if (parentId && parentTitle) {
        formData.parentId={
            label: parentTitle as string,
            value: Number(parentId)
        }
    }
    else{
        formData.parentId={label:'无',value:-1}
    }
},{immediate:true,flush:'pre'})
const submitLoading = ref(false)
const formRef = shallowRef<FormInstanceFunctions>()

const handleSubmit = async (e) => {
    
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        const submitData: VideoGroupDTO = {
            slug: formData.slug,
            title: formData.title,
            parentId: formData.parentId?.value || undefined,
            videoIds: formData.videoIds?.map(item => item.value),
        }
        console.log('提交', submitData)

    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const [parentSelectProps]=useSelect(()=>({
    value:formData.parentId,
    manualRequest:true,
    onChange:(val:any)=>{
        console.log('val',val)
        formData.parentId=val
    },
    request:async (keywork:string)=>{
        return [
            {
                label: '分类1',
                value: 1,
            },
            {
                label: '分类2',
                value: 2,
            },
        ]
    },
    valueType:'object',
    remote:true,

}))
const [videoSelectProps]=useSelect({
    value:formData.videoIds,
    manualRequest:true,
    onChange:(val:any)=>{
        formData.videoIds=val
    },
    request:async (keywork:string)=>{
        return [
            {
                label: '视频1',
                value: 1,
            },
            {
                label: '视频2',
                value: 2,
            },
        ]
    },
    multiple:true,
    remote:true,
    valueType:'object',
})

const handleReturn = () => {
    router.push('/example/tdesign/video/list')
}
const DataSouces=Array.from({length:33},(item,index)=>{
    return {
        label: `视频${index}`,
        value: index+1,
    }
})
const delay=(ms:number)=>{
    return new Promise(resolve=>setTimeout(resolve,ms))
}
const handleRequest=async (params:{keyword: string,current: number,pageSize: number})=>{
    console.log('params',params)
    await delay(1000)
    const cur= DataSouces.filter(item=>item.label.includes(params.keyword)).slice((params.current-1)*params.pageSize,params.current*params.pageSize)
    return {
        total:DataSouces.length,
        records:cur
    }
}
const handleRequestParent=async (params:{keyword: string,current: number,pageSize: number})=>{
    console.log('params',params)
    await delay(1000)
    const cur= DataSouces.filter(item=>item.label.includes(params.keyword)).slice((params.current-1)*params.pageSize,params.current*params.pageSize)
    return {
        total:DataSouces.length,
        records:cur
    }
}
const defaultOptions=[{
    label:'无',
    value:-1,
}]
</script>

<template>
    <MainLayout title="新增视频" layout="edit" show-lang :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form ref="formRef" @submit="handleSubmit" :data="formData" :rules="rules" class="w-full" label-align="top">
            <t-form-item label="Slug" name="slug">
                <t-input v-model="formData.slug" :maxlength="255" />
            </t-form-item>
            <t-form-item label="分组名称" name="title">
                <t-input v-model="formData.title" :maxlength="255" />
            </t-form-item>
            <t-form-item label="父级分组" name="parentId">
                <FSelectPagination :clearable="false" :default-options="defaultOptions" :request="handleRequestParent" v-model="formData.parentId" />
            </t-form-item>
             <t-form-item label="关联视频" name="videoIds">
                <FSelectPagination :request="handleRequest" v-model="formData.videoIds" multiple />
            </t-form-item>
            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading"
                        type="submit">创建视频</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
</template>