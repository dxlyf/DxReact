<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, reactive, shallowReactive, shallowRef, toRaw } from 'vue'
import { useRequest } from 'src/hooks/useRequest2'
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import UploadImage from '@/views/example/tdesign/components/FUpload/FUploadImage.vue'
type LocaleContentItem = {
    locale: string
    value: string
}
type FormData = {
    id?:string
    iconUrl?: string
    qrCodeUrl?: string
    iconFile?: File
    qrCodeFile?: File
    slug: string
    publishAt: string
    offlineAt: string
    stopUpdating?: boolean
    isHideen?: boolean
    countries?: string[]
    productIds?: number[]
    downloadBaseCategoryIds: number[]
    name?: LocaleContentItem[]
    description?: LocaleContentItem[]
    status: LocaleContentItem[]
}
type Props = {
    id?: string
    type: 'create' | 'edit' | 'copy'
}

const pageInfo = computed<{ title: string }>(() => {
    const type = props.type
    switch (type) {
        case 'create':
        case 'copy':
            return {
                title: '新增应用'
            }
        case 'edit':
            return {
                title: '编辑应用',

            }
    }
})
const breadcrumbOptions = computed(() => {
    return [{
        content: '首页',
        to: '/'
    },
    {
        content: '应用程序列表',
        to: '/example/tdesign/download/apps'
    },
    {
        content: pageInfo.value.title
    }]
})
const props = defineProps<Props>()
const submitLoading=shallowRef(false)
const router=useRouter()

const createFormData=():FormData=>{
    return {
        slug: '',
        iconUrl: '/uploads/aaa.jpg',
        qrCodeUrl: '',
        publishAt: '',
        offlineAt: '',
        iconFile: null,
        qrCodeFile: null,
        stopUpdating: false,
        isHideen: false,
        countries: [],
        productIds: [],
        downloadBaseCategoryIds: [],
        name: [],
        description: [],
        status: [],
    }
}
const formData=shallowReactive<FormData>(createFormData())
const [detail,detailInst]=useRequest({
    manualRequest:true,
    request:async (params)=>{
        return {}
    }
})
const rules={

}
const handleReturn=()=>{
    router.push({path:'./apps'})
}
const handleSubmit=()=>{
    console.log('handleSubmit',toRaw(formData))
}

</script>
<template>
    <MainLayout :show-not-found="!!detail.error"  :loading="detail.loading" :title="pageInfo.title" layout="edit" show-lang :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form  @submit="handleSubmit" :data="formData" :rules="rules" class="w-full" label-align="top">
            <t-form-item label="slug">
                <t-input v-model="formData.slug" placeholder="请输入slug" />
                <template #tips>
                   仅可用英文、数字、下划线和短横线
                </template>
            </t-form-item>
            <t-form-item label="icon" name="iconUrl">
                <UploadImage :multiple="true" v-model="formData.iconUrl"  v-model:rawfile="formData.iconFile" />
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