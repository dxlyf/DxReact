<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef } from 'vue';
import type { FormInstanceFunctions, TableProps } from 'tdesign-vue-next';
import { useRequest } from '@/hooks/useRequest2'
import CountrySelect from '@/components/country-select/index.vue'
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { useRouter, useRoute } from 'vue-router'
import {useSelect} from '../../hooks/useSelect'

const router = useRouter()
const route = useRoute()
const parentValue = computed(() => {
    if (route.query.parent_id && route.query.parent_title) {
        return {
            label: route.query.parent_title as string,
            value: Number(route.query.parent_id)
        }
    }
    return null
})

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
    parentId: parentValue.value,
    videoIds: []
})

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

const [parentSelectProps]=useSelect({
    value:formData.parentId,
    manualRequest:true,
    onChange:(val:any)=>{
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
    remote:true,

})

const handleReturn = () => {
    router.push('/example/tdesign/video/list')
}

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
                <t-select />
            </t-form-item>

            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" @click="handleSubmit"
                        type="submit">创建视频</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
</template>