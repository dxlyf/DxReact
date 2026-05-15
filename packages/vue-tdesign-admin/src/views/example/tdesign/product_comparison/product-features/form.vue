<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequest } from 'src/hooks/useRequest';
import FeatureList from './FeatureList.vue';
import type { FeatureItem } from './FeatureList.vue';

type Props = {
    type: 'create' | 'edit' | 'copy'
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const editId = route.query.id
const pageInfo = computed(() => {
    switch (props.type) {
        case 'create':
        case 'copy':
            return { title: '新增产品关键特性' }
        case 'edit':
            return { title: '编辑产品关键特性' }
    }
})

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '产品关键特性', to: '/example/tdesign/product_comparison/product-features' },
    { content: pageInfo.value.title }
])

const productOptions = [
    { label: '产品一', value: '产品一', slug: 'product-1' },
    { label: '产品二', value: '产品二', slug: 'product-2' },
    { label: '产品三', value: '产品三', slug: 'product-3' },
    { label: '产品四', value: '产品四', slug: 'product-4' },
    { label: '产品五', value: '产品五', slug: 'product-5' }
]

const categoryOptions = [
    { label: '关键特性分类一', value: '关键特性分类一' },
    { label: '关键特性分类二', value: '关键特性分类二' },
    { label: '关键特性分类三', value: '关键特性分类三' },
    { label: '关键特性分类四', value: '关键特性分类四' },
    { label: '关键特性分类五', value: '关键特性分类五' }
]

const mockCategoryFeatures: Record<string, FeatureItem[]> = {
    '关键特性分类一': [
        { id: 1, title: '屏幕尺寸', type: 'text', content: '6.7英寸' },
        { id: 2, title: '处理器', type: 'text', content: 'A17 Pro' },
        { id: 3, title: '产品图片', type: 'image', imageUrl: '/uploads/placeholder.jpg' }
    ],
    '关键特性分类二': [
        { id: 4, title: '电池容量', type: 'text', content: '5000mAh' },
        { id: 5, title: '充电功率', type: 'text', content: '120W' }
    ],
    '关键特性分类三': [
        { id: 6, title: '摄像头', type: 'text', content: '4800万像素' },
        { id: 7, title: '外观渲染图', type: 'image', imageUrl: '/uploads/placeholder.jpg' },
        { id: 8, title: '内存容量', type: 'text', content: '12GB' }
    ],
    '关键特性分类四': [
        { id: 9, title: '存储空间', type: 'text', content: '256GB' }
    ],
    '关键特性分类五': [
        { id: 10, title: '操作系统', type: 'text', content: 'iOS 18' },
        { id: 11, title: '重量', type: 'text', content: '200g' }
    ]
}

const mockProductData: Record<string, { title: string; slug: string; category: string; features: FeatureItem[] }> = {
    '1': {
        title: '产品一',
        slug: 'product-1',
        category: '关键特性分类一',
        features: [
            { id: 1, title: '屏幕尺寸', type: 'text', content: '6.7英寸', description: 'OLED屏幕', prefix: '约', floatComment: '仅供参考' },
            { id: 3, title: '产品图片', type: 'image', imageUrl: '/uploads/placeholder.jpg', description: '产品渲染图' }
        ]
    },
    '2': {
        title: '产品二',
        slug: 'product-2',
        category: '关键特性分类二',
        features: [
            { id: 4, title: '电池容量', type: 'text', content: '5000mAh', description: '大容量电池', floatComment: '典型值' },
            { id: 5, title: '充电功率', type: 'text', content: '120W', description: '快速充电', prefix: '最大' }
        ]
    }
}

type FormData = {
    title: string
    slug: string
    category: string
    features: FeatureItem[]
}

const formData = reactive<FormData>({
    title: '',
    slug: '',
    category: '',
    features: []
})

const rules = {
    title: [{ required: true, message: '请选择产品名称' }],
    category: [{ required: true, message: '请选择关联分类' }]
}

const submitLoading = ref(false)
const collapseRef = ref()
const expandedPanel = ref(['basic', 'category', 'features'])
const isInitializing = ref(false)

const handleProductChange = (value: string) => {
    const product = productOptions.find(p => p.value === value)
    formData.slug = product?.slug ?? ''
}

watch(() => formData.category, (val) => {
    if (isInitializing.value) return
    if (val && mockCategoryFeatures[val]) {
        formData.features = mockCategoryFeatures[val].map(f => ({ ...f }))
    } else {
        formData.features = []
    }
})

const [detail, detailInst] = useRequest({
    manualRequest: true,
    service: async (params: { id: string }) => {
        return mockProductData[params.id] || null
    },
    onSuccess: (data) => {
        if (data) {
            formData.title = data.title
            formData.slug = data.slug
            formData.category = data.category
            formData.features = data.features.map(f => ({ ...f }))
        }
    },
    onComplete: () => {

    }
})

onMounted(() => {
    if (editId && props.type === 'edit') {
        detailInst.request()
    }
})

const handleReturn = () => {
    router.push('/example/tdesign/product_comparison/product-features')
}

const handleSubmit = async (e: any) => {
    if (e.validateResult !== true) return
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}
</script>

<template>
    <MainLayout layout="edit" :loading="detail.loading" :show-not-found="!!detail.error" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form  :data="formData" :label-width="140" @submit="handleSubmit" class="w-full" label-align="top">
            <t-collapse ref="collapseRef" v-model="expandedPanel" :expand-mutex="false" :expand-on-row-click="false"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="basic">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item label="产品名称" name="title" :rules="rules.title">
                        <t-select v-model="formData.title" :options="productOptions" placeholder="请选择产品名称" filterable
                            clearable @change="handleProductChange" />
                    </t-form-item>
                    <t-form-item label="产品Slug" name="slug">
                        <t-input v-model="formData.slug" placeholder="选择产品名称后自动生成" disabled />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="category">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">关联关键特性分类</div>
                    </template>
                    <t-form-item label="选择分类" name="category" :rules="rules.category">
                        <t-select v-model="formData.category" :options="categoryOptions" placeholder="请选择关键特性分类" filterable clearable />
                    </t-form-item>
                    <t-form-item  name="features">
                        <template #label>
                            <div class="flex items-center">
                                <span>关键特性配置</span>
                                <span v-if="formData.category" class="text-xs text-blue-500 ml-2">基于[{{ formData.category }}] 分类，共{{ formData.features.length }}个特性</span>
                            </div>
                        </template>
                        <div v-if="!formData.category" class="text-gray-400 text-sm mt-2 flex justify-center items-center w-full">
                            请从上方下拉列表中选择一个关键特性分类，选择后将自动加载该分类下的所有特性数据
                        </div>
                        <div v-else class="w-full">
                            <FeatureList
                                v-model="formData.features"
                                :show-header="false"
                            />
                        </div>
                    </t-form-item>
                    <div></div>
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
