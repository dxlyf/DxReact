<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import FeatureList from './FeatureList.vue';
import type { FeatureItem } from './FeatureList.vue';

type Props = {
    id?: string
    type: 'create' | 'edit' | 'copy'
}

const props = defineProps<Props>()
const router = useRouter()

const pageInfo = computed(() => {
    switch (props.type) {
        case 'create':
        case 'copy':
            return { title: '新增关键特性分类' }
        case 'edit':
            return { title: '编辑关键特性分类' }
    }
})

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '关键特性分类', to: '/example/tdesign/product_comparison/key_feature_categories' },
    { content: pageInfo.value.title }
])

type FormData = {
    title: string
    slug: string
    productGroup: string
    features: FeatureItem[]
}

const rules = {
    title: [{ required: true, message: '请输入分类名称', whitespace: true }],
    slug: [
        { required: true, message: '请输入Slug', whitespace: true },
        { pattern: /^[a-z0-9_-]+$/, message: '仅支持小写字母、数字、下划线及短横线' }
    ],
    productGroup: [{ required: true, message: '请选择产品分组', whitespace: true }]
}

const productGroupOptions = [
    { label: '产品分组一', value: 'group-1' },
    { label: '产品分组二', value: 'group-2' },
    { label: '产品分组三', value: 'group-3' }
]

const formData = reactive<FormData>({
    title: '',
    slug: '',
    productGroup: '',
    features: []
})

const submitLoading = ref(false)
const collapseRef = ref()
const expandedPanel = ref(['basic', 'features'])

const handleFeatureAdd = () => {
    if (!expandedPanel.value.includes('features')) {
        expandedPanel.value = [...expandedPanel.value, 'features']
    }
}

const handleSubmit = async (e: any) => {
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const handleReturn = () => {
    router.push('/example/tdesign/product_comparison/key_feature_categories')
}
</script>

<template>
    <MainLayout layout="edit" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form :data="formData" :label-width="140" @submit="handleSubmit" class="w-full" label-align="top">
            <t-collapse ref="collapseRef" v-model="expandedPanel" :expand-on-row-click="false"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="basic">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item label="分类名称" name="title" :rules="rules.title">
                        <t-input v-model="formData.title" placeholder="请输入分类名称" :maxlength="255" />
                    </t-form-item>
                    <t-form-item label="Slug" name="slug" :rules="rules.slug">
                        <t-input v-model="formData.slug" placeholder="请输入 Slug" :maxlength="255" />
                    </t-form-item>
                    <t-form-item label="产品分组" name="productGroup" :rules="rules.productGroup">
                        <t-select v-model="formData.productGroup" :options="productGroupOptions" placeholder="请选择产品分组"
                            filterable />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="features">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">关键特性配置</div>
                    </template>
                    <FeatureList
                    show-add
                    show-delete
                        v-model="formData.features"
                        @add="handleFeatureAdd"
                    />
                </t-collapse-panel>
            </t-collapse>
            <div class="flex justify-end mt-8">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">{{ pageInfo.title }}</t-button>
                </t-space>
            </div>
        </t-form>
    </MainLayout>
</template>

<style scoped>
:deep(.t-collapse-panel__content),
:deep(.t-collapse-panel__header) {
    background: #fff;
}
</style>
