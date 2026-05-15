<script setup lang="ts">
import { ref, watch } from 'vue';
import { ChevronRightIcon } from 'tdesign-icons-vue-next';
import { useDrawer } from 'src/hooks/useDrawer';
import FUploadImage from 'src/views/example/tdesign/components/FUpload/FUploadImage.vue';

export interface FeatureItem {
    id: number
    title: string
    type: 'text' | 'image'
    imageUrl?: string
    content?: string
    prefix?: string
    description?: string
    floatComment?: string
}

const features = defineModel<FeatureItem[]>({ required: true })

defineProps<{
    showAdd?: boolean
    showDelete?: boolean
    showHeader?: boolean
}>()

const emit = defineEmits<{
    (e: 'add'): void
}>()

const editingIndex = ref(-1)
const featureFormRef = ref()
const editingFeatureCopy = ref<FeatureItem | null>(null)

watch(() => editingFeatureCopy.value, () => {
}, { immediate: true })

const setEditingCopy = (item: FeatureItem | null) => {
    editingFeatureCopy.value = item ? { ...item } : null
}

const handleDrawerConfirm = async () => {
    const form = featureFormRef.value
    const result = await form.validate()
    if (result !== true) {
        return
    }
    if (editingIndex.value >= 0) {
        features.value[editingIndex.value] = editingFeatureCopy.value as FeatureItem
    }
    drawerInst.close()
}

const handleDrawerCancel = () => {
    drawerInst.close()
}

const [drawerProps, drawerInst] = useDrawer(() => ({
    size: '40%',
    footer: true,
    onConfirm: handleDrawerConfirm,
    onCancel: handleDrawerCancel,
}))

const openEditFeature = (index: number) => {
    editingIndex.value = index
    setEditingCopy(features.value[index])
    drawerInst.open()
}
</script>

<template>
    <div>
        <div v-if="showHeader !== false" class="flex">
            <div class="flex-1">
                <span class="text-gray-400">共 {{ features.length }} 个特性</span>
            </div>
        </div>
        <div class="flex flex-col border border-gray-200 rounded-md overflow-hidden mt-4">
            <div v-for="(item, index) in features" :key="item.id"
                class="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                @click="openEditFeature(index)">
                <span class="text-white text-xs min-w-6 py-1 shrink-0 rounded-sm bg-blue-800 text-center">{{
                    index +
                    1 }}</span>
                <div class="flex-1 leading-tight">
                    <div>{{ item.title || '-' }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">{{ item.description || '-' }}</div>
                </div>
                <t-tag variant="light" :theme="item.type === 'image' ? 'primary' : 'success'" size="small">{{ item.type === 'image' ? '图片' :
                    '文本'
                    }}</t-tag>
                <div class="flex items-center gap-2 shrink-0">
                    <ChevronRightIcon class="text-gray-400 text-lg" />
                </div>
            </div>
            <div v-if="features.length === 0" class="text-center text-gray-400 py-8">
                暂无特性数据
            </div>
        </div>
    </div>

    <t-drawer v-bind="drawerProps">
        <template #header>
            <slot name="drawerHeader">
                <div class="flex items-center gap-2">
                    <span class="text-white text-xs min-w-6 py-1 shrink-0 rounded-sm bg-blue-800 text-center">{{
                        editingIndex >= 0 ? editingIndex + 1 : '+'
                    }}</span>
                </div>
            </slot>
        </template>
        <t-form ref="featureFormRef" v-if="editingFeatureCopy" :data="editingFeatureCopy" :label-width="120" class="w-full" label-align="top">
            <t-form-item label="特性名称" name="title">
                <t-input v-model="editingFeatureCopy.title" disabled />
            </t-form-item>
            <t-form-item>
                <template #label>
                    参数类型 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <t-radio-group v-model="editingFeatureCopy.type" disabled>
                    <t-radio value="image">图片</t-radio>
                    <t-radio value="text">文本</t-radio>
                </t-radio-group>
            </t-form-item>
            <t-form-item key="image" v-if="editingFeatureCopy.type === 'image'">
                <template #label>
                    参数图片 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <FUploadImage v-model="editingFeatureCopy.imageUrl" />
            </t-form-item>
            <t-form-item label="参数文案" key="text" v-if="editingFeatureCopy.type === 'text'">
                <t-input v-model="editingFeatureCopy.content" placeholder="请输入参数文案" :maxlength="10" />
            </t-form-item>
            <t-form-item label="参数前缀">
                <t-input v-model="editingFeatureCopy.prefix" placeholder="请输入参数前缀" :maxlength="20" />
            </t-form-item>
            <t-form-item label="参数描述">
                <t-input v-model="editingFeatureCopy.description" placeholder="请输入参数描述" :maxlength="40" />
            </t-form-item>
            <t-form-item label="浮动注释">
                <t-input v-model="editingFeatureCopy.floatComment" placeholder="请输入浮动注释" />
            </t-form-item>
        </t-form>
    </t-drawer>
</template>
