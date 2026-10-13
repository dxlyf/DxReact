<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import BasicInfo, { type BasicInfoFormData } from './components/BasicInfo.vue'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const pageInfo = { title: '新建产品' }
const breadcrumbOptions = [
    { content: '首页', to: '/' },
    { content: '产品列表', to: '/example/tdesign/guava_products' },
    { content: pageInfo.title }
]

const submitLoading = shallowRef(false)

const handleSubmit = async (data: BasicInfoFormData) => {
    try {
        submitLoading.value = true
        console.log('提交', data)
    } finally {
        submitLoading.value = false
    }
}

const handleReturn = () => {
    router.push('/example/tdesign/guava_products')
}
</script>
<template>
    <MainLayout layout="edit" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <BasicInfo submit-text="新增" :loading="submitLoading" @submit="handleSubmit" />
    </MainLayout>
</template>
<style scoped></style>
