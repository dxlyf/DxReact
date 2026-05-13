<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, toRaw } from 'vue';
import { useRouter } from 'vue-router'
import { ChevronRightIcon, DeleteIcon } from 'tdesign-icons-vue-next';
import FLanguageFields from 'src/views/example/tdesign/components/FLanguageFields/index.vue';
import FUploadImage from 'src/views/example/tdesign/components/FUpload/FUploadImage.vue';

const router = useRouter()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '关键特性分类',
        to: '/example/tdesign/product_comparison/key_feature_categories'
    },
    {
        content: '新增关键特性分类'
    }
]

type FeatureItem = {
    id: number
    title: string
    type: 'text' | 'image'
    imageUrl?: string
    content?: Record<string, string>
    prefix?: Record<string, string>
    description?: Record<string, string>
    floatComment?: Record<string, string>
}

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

let featureIdCounter = 0

const formData = reactive<FormData>({
    title: '',
    slug: '',
    productGroup: '',
    features: []
})

const submitLoading = ref(false)
const drawerVisible = ref(false)
const editingFeature = ref<FeatureItem | null>(null)
const editingIndex = ref(-1)

const addFeature = () => {
    const item: FeatureItem = { id: ++featureIdCounter, title: '', type: 'text' }
    formData.features.push(item)
    editingIndex.value = formData.features.length - 1
    editingFeature.value = item
    drawerVisible.value = true
}

const openEditFeature = (index: number) => {
    editingIndex.value = index
    editingFeature.value = formData.features[index]
    drawerVisible.value = true
}

const handleDrawerConfirm = () => {
    console.log('formdata',toRaw(editingFeature.value))
    // drawerVisible.value = false
    // editingFeature.value = null
    // editingIndex.value = -1

}

const handleDrawerClose = () => {
    if (editingIndex.value >= 0 && editingFeature.value && !editingFeature.value.title) {
        formData.features.splice(editingIndex.value, 1)
    }
    drawerVisible.value = false
    editingFeature.value = null
    editingIndex.value = -1
}

const removeFeature = (index: number) => {
    formData.features.splice(index, 1)
}

const handleSubmit = async (e) => {
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
        router.push('/example/tdesign/product_comparison/key_feature_categories')
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
    <MainLayout layout='edit' title="新增关键特性分类" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form :data="formData" :label-width="140" @submit="handleSubmit" class="w-full" label-align="top">
        <t-collapse :default-expand-all="true" :expand-on-row-click="false" expand-icon-placement="right" borderless>
            <t-collapse-panel value="basic">
                <template #header>
                    <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                </template>
                    <t-form-item label="分类名称" name="title" :rules="rules.title">
                        <t-input v-model="formData.title" placeholder="请输入分类名称" :maxlength="255" />
                    </t-form-item>
                    <t-form-item label="Slug" name="slug" :rules="rules.slug">
                        <t-input v-model="formData.slug" placeholder="请输入Slug" :maxlength="255" />
                    </t-form-item>
                    <t-form-item label="产品分组" name="productGroup" :rules="rules.productGroup">
                        <t-select v-model="formData.productGroup" :options="productGroupOptions" placeholder="请选择产品分组" filterable />
                    </t-form-item>
                    <div></div>
            </t-collapse-panel>
        </t-collapse>
        <div class="mt-8">
            <t-collapse :default-expand-all="true" :expand-on-row-click="false" expand-icon-placement="right" borderless>
                <t-collapse-panel value="features">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">关键特性配置</div>
                    </template>
                    <template #headerRightContent>
                        <t-button size="small" theme="primary" variant="outline" @click="addFeature">新增特性</t-button>
                    </template>
                    <div class="flex flex-col gap-3">
                        <div v-for="(item, index) in formData.features" :key="item.id"
                            class="flex items-center gap-4 border border-gray-200 rounded-md px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors"
                            @click="openEditFeature(index)">
                            <span class="text-gray-400 text-sm w-6 shrink-0">{{ index + 1 }}</span>
                            <span class="flex-1">{{ item.title || '未设置' }}</span>
                            <t-tag variant="light" theme="default" size="small">{{ item.type === 'image' ? '图片' : '文本' }}</t-tag>
                            <div class="flex items-center gap-2 shrink-0" @click.stop>
                                <DeleteIcon
                                    class="text-gray-400 text-lg cursor-pointer hover:text-red-500 transition-colors"
                                    @click="removeFeature(index)"
                                />
                                <ChevronRightIcon class="text-gray-400 text-lg" />
                            </div>
                        </div>
                        <div v-if="formData.features.length === 0" class="text-center text-gray-400 py-8">
                            暂无特性，点击右上角「新增特性」添加
                        </div>
                    </div>
                </t-collapse-panel>
            </t-collapse>
        </div>
        <div class="flex justify-end mt-8">
            <t-space>
                <t-button theme="primary" :loading="submitLoading" type="submit">新增关键特性分类</t-button>
            </t-space>
        </div>
        </t-form>
    </MainLayout>

    <t-drawer
        v-model:visible="drawerVisible"
        header="编辑特性"
        size="500px"
        :footer="true"
        @confirm="handleDrawerConfirm"
        @close="handleDrawerClose"
        :close-on-overlay-click="false"
        :close-btn="true"
    >
        <div class="flex flex-col gap-4" v-if="editingFeature">
            <t-form-item label="特性名称">
                <t-input v-model="editingFeature.title" placeholder="请输入特性名称" :maxlength="255" />
            </t-form-item>
            <t-form-item label="特性类型">
                <t-radio-group v-model="editingFeature.type">
                    <t-radio value="text">文本</t-radio>
                    <t-radio value="image">图片</t-radio>
                </t-radio-group>
            </t-form-item>

            <template v-if="editingFeature.type === 'image'">
                <t-form-item label="参数图片">
                    <FUploadImage v-model="editingFeature.imageUrl" />
                </t-form-item>
            </template>

            <template v-if="editingFeature.type === 'text'">
                <t-form-item label="参数文案">
                    <FLanguageFields
                        v-model="editingFeature.content"
                        title="参数文案"
                        btn-text="编辑"
                        :field-props="{ maxlength: 10 }"
                    />
                </t-form-item>
                <t-form-item label="参数前缀">
                    <FLanguageFields
                        v-model="editingFeature.prefix"
                        title="参数前缀"
                        btn-text="编辑"
                        :field-props="{ maxlength: 20 }"
                    />
                </t-form-item>
                <t-form-item label="参数描述">
                    <FLanguageFields
                        v-model="editingFeature.description"
                        title="参数描述"
                        btn-text="编辑"
                        :field-props="{ maxlength: 40 }"
                    />
                </t-form-item>
                <t-form-item label="浮动注释">
                    <FLanguageFields
                        v-model="editingFeature.floatComment"
                        title="浮动注释"
                        btn-text="编辑"
                    />
                </t-form-item>
            </template>
        </div>
    </t-drawer>
</template>

<style scoped>
:deep(.t-collapse-panel__content),
:deep(.t-collapse-panel__header) {
  background: #fff;
}
</style>
