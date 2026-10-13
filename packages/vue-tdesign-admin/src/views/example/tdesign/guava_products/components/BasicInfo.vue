<script lang="ts">
export type BasicInfoFormData = {
    slug: string
    cover: string
    title: string
    publishAt: string
    status: string
    purchaseUrl: string
    summary: string
}
</script>

<script setup lang="ts">
import FUploadImage from '@/views/example/tdesign/components/FUpload/FUploadImage.vue'
import { reactive, watch } from 'vue'
import { type TdFormProps } from 'tdesign-vue-next'

const props = withDefaults(defineProps<{
    initialData?: Partial<BasicInfoFormData>
    submitText?: string
    loading?: boolean
}>(), {
    initialData: () => ({}),
    submitText: '提交',
    loading: false,
})

const emit = defineEmits<{
    submit: [data: BasicInfoFormData]
}>()

const statusOptions = [
    { label: '已发布', value: 'Publish' },
    { label: '草稿', value: 'Draft' },
]

const createFormData = (): BasicInfoFormData => ({
    slug: '',
    cover: '',
    title: '',
    publishAt: '',
    status: 'Draft',
    purchaseUrl: '',
    summary: '',
})

const formData = reactive<BasicInfoFormData>({
    ...createFormData(),
    ...props.initialData,
})

watch(
    () => props.initialData,
    (val) => {
        Object.assign(formData, createFormData(), val)
    },
)

const rules: TdFormProps['rules'] = {
    slug: [{ required: true, whitespace: true, message: '请输入Slug' }],
    title: [{ required: true, whitespace: true, message: '请输入标题' }],
    publishAt: [{ required: true, message: '请选择发布时间' }],
    status: [{ required: true, message: '请选择状态' }],
    purchaseUrl: [{ pattern: /^https?:\/\//, message: '请以 http:// 或 https:// 开头' }],
}

const handleSubmit: TdFormProps['onSubmit'] = (e) => {
    if (e.validateResult !== true) {
        return
    }
    emit('submit', { ...formData })
}
</script>
<template>
    <t-form :data="formData" :rules="rules" class="w-full" label-align="top" @submit="handleSubmit">
        <t-form-item label="Slug" name="slug">
            <t-input v-model.trim="formData.slug" placeholder="请输入Slug" :maxlength="255" />
        </t-form-item>
        <t-form-item label="封面" name="cover">
            <FUploadImage v-model="formData.cover" :max="1" :limit="{ width: 800, height: 800 }" />
        </t-form-item>
        <t-form-item label="标题" name="title">
            <t-input v-model.trim="formData.title" placeholder="请输入标题" :maxlength="255" />
        </t-form-item>
        <t-form-item label="发布时间" name="publishAt">
            <t-date-picker v-model="formData.publishAt" format="YYYY-MM-DD HH:mm:ss" :enable-time-picker="true"
                placeholder="请选择发布时间" />
        </t-form-item>
        <t-form-item label="状态" name="status">
            <t-select v-model="formData.status" :options="statusOptions" placeholder="请选择状态" />
        </t-form-item>
        <t-form-item label="购买链接" name="purchaseUrl">
            <t-input v-model.trim="formData.purchaseUrl" placeholder="请输入购买链接" :maxlength="500" />
        </t-form-item>
        <t-form-item label="摘要" name="summary">
            <t-textarea v-model="formData.summary" placeholder="请输入摘要" :maxlength="500"
                :autosize="{ minRows: 3, maxRows: 6 }" />
        </t-form-item>
        <div class="flex justify-end">
            <t-space>
                <t-button theme="primary" :loading="loading" type="submit">{{ submitText }}</t-button>
            </t-space>
        </div>
    </t-form>
</template>
