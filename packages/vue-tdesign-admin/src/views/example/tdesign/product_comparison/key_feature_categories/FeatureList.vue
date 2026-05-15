<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ChevronRightIcon, DeleteIcon } from 'tdesign-icons-vue-next';
import { DialogPlugin } from 'tdesign-vue-next';
import { useDrawer } from 'src/hooks/useDrawer';
import FLanguageFields from 'src/views/example/tdesign/components/FLanguageFields/index.vue';
import FUploadImage from 'src/views/example/tdesign/components/FUpload/FUploadImage.vue';

export interface FeatureItem {
    id: number
    title: string
    type: 'text' | 'image'
    imageUrl?: string
    content?: Record<string, string>
    prefix?: Record<string, string>
    description?: Record<string, string>
    floatComment?: Record<string, string>
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
const isNewFeature = ref(false)
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
    isNewFeature.value = false
    drawerInst.close()
}

const handleDrawerCancel = () => {
    if (isNewFeature.value && editingIndex.value >= 0) {
        features.value.splice(editingIndex.value, 1)
    }
    isNewFeature.value = false
    drawerInst.close()
}

const [drawerProps, drawerInst] = useDrawer(() => ({
    size: '40%',
    footer: true,
    onConfirm: handleDrawerConfirm,
    onCancel: handleDrawerCancel,
}))



const addFeature = () => {
    const maxId = features.value.reduce((max, f) => Math.max(max, f.id), 0)
    const item: FeatureItem = { id: maxId + 1, title: '', type: 'text' }
    features.value.push(item)
    editingIndex.value = features.value.length - 1
    setEditingCopy(item)
    isNewFeature.value = true
    drawerInst.open()
    emit('add')
}

const openEditFeature = (index: number) => {
    editingIndex.value = index
    setEditingCopy(features.value[index])
    isNewFeature.value = false
    drawerInst.open()
}

const removeFeature = (index: number) => {
    const confirmDia = DialogPlugin.confirm({
        header: '确认删除',
        body: `确定要删除特性「${features.value[index]?.title || '未设置'}」吗？`,
        confirmBtn: '删除',
        onConfirm: () => {
            features.value.splice(index, 1)
            confirmDia.destroy()
        }
    })
}
</script>

<template>
    <div>
        <div v-if="showHeader !== false" class="flex">
            <div class="flex-1">
                <span class="text-gray-400">共 {{ features.length }} 个特性</span>
            </div>
            <div class="flex-none">
                  <t-button v-if="showAdd !== false" theme="primary"  @click="addFeature">
                    <t-icon name="plus" />
                    新增特性
                  </t-button>
            </div>
        </div>
        <div class="flex flex-col border border-gray-200 rounded-md overflow-hidden mt-4">
            <div v-for="(item, index) in features" :key="item.id"
                class="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                @click="openEditFeature(index)">
                <span class="text-white text-xs min-w-6 py-1 shrink-0 rounded-sm bg-blue-800 text-center">{{
                    index +
                    1 }}</span>
                <span class="flex-1">{{ item.title || '未设置' }}</span>
                <t-tag variant="light" :theme="item.type === 'image' ? 'primary' : 'success'" size="small">{{ item.type === 'image' ? '图片' :
                    '文本'
                    }}</t-tag>
                <div class="flex items-center gap-2 shrink-0">
                    <div v-if="showDelete !== false" @click.stop class="inline-flex">
                        <DeleteIcon class="text-sm cursor-pointer hover:text-red-500 transition-colors"
                            @click="removeFeature(index)" />
                    </div>
                    <ChevronRightIcon class="text-gray-400 text-lg" />
                </div>
            </div>
            <div v-if="features.length === 0" class="text-center text-gray-400 py-8">
                暂无特性，点击右上角「新增特性」添加
            </div>
        </div>
    </div>

    <t-drawer v-bind="drawerProps" >
        <template #header>
            <slot name="drawerHeader">
                <div class="flex items-center gap-2">
                    <span class="text-white text-xs min-w-6 py-1 shrink-0 rounded-sm bg-blue-800 text-center">{{
                        editingIndex >= 0 ? editingIndex + 1 : '+'
                    }}</span>
                </div>
            </slot>
        </template>
        <t-form ref="featureFormRef" v-if="editingFeatureCopy" :data="editingFeatureCopy" :label-width="100" class="w-full" label-align="top">
            <t-form-item label="特性名称" name="title" :rules="[{ required: true, message: '请输入特性名称', whitespace: true }]">
                <t-input v-model="editingFeatureCopy.title" placeholder="请输入特性名称" :maxlength="255" />
            </t-form-item>
            <t-form-item>
                <template #label>
                    参数类型 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <t-radio-group v-model="editingFeatureCopy.type">
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
                <FLanguageFields initValue v-model="editingFeatureCopy.content" title="参数文案" btn-text="编辑"
                    :field-props="{ maxlength: 10 }" />
            </t-form-item>
            <t-form-item label="参数前缀">
                <FLanguageFields initValue v-model="editingFeatureCopy.prefix" title="参数前缀" btn-text="编辑"
                    :field-props="{ maxlength: 20 }" />
            </t-form-item>
            <t-form-item label="参数描述">
                <FLanguageFields initValue v-model="editingFeatureCopy.description" title="参数描述" btn-text="编辑"
                    :field-props="{ maxlength: 40 }" />
            </t-form-item>
            <t-form-item label="浮动注释">
                <FLanguageFields initValue v-model="editingFeatureCopy.floatComment" title="浮动注释" btn-text="编辑" />
            </t-form-item>
        </t-form>
    </t-drawer>
</template>
