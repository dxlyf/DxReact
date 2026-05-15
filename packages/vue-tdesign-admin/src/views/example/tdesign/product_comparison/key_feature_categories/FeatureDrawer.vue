<script setup lang="ts">
import { ref, watch } from 'vue';
import FLanguageFields from 'src/views/example/tdesign/components/FLanguageFields/index.vue';
import FUploadImage from 'src/views/example/tdesign/components/FUpload/FUploadImage.vue';
import { useDrawer } from 'src/hooks/useDrawer';
import type { FeatureItem } from './FeatureList.vue';

const props = defineProps<{
    visible: boolean
    feature: FeatureItem | null
    isNew: boolean
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'confirm', data: FeatureItem): void
    (e: 'cancel'): void
}>()

const featureFormRef = ref()
const editingFeature = ref<FeatureItem | null>(null)

watch(() => props.feature, (val) => {
    editingFeature.value = val ? { ...val } : null
}, { immediate: true, deep: true })

const handleDrawerConfirm = async () => {
    const form = featureFormRef.value
    const result = await form.validate()
    if (result !== true) {
        return
    }
    emit('confirm', editingFeature.value as FeatureItem)
}

const handleDrawerClose = () => {
    emit('cancel')
}

const [drawerProps, { close }] = useDrawer(() => ({
    header: '编辑特性',
    size: '40%',
    footer: true,
    closeOnOverlayClick: false,
    closeBtn: true,
    onConfirm: handleDrawerConfirm,
    onCancel: handleDrawerClose,
    onClose: close
}))

watch(() => props.visible, (val) => {
    if (!val) {
        close()
    }
})
</script>

<template>
    <t-drawer v-bind="drawerProps" :visible="visible">
        <t-form ref="featureFormRef" v-if="editingFeature" :data="editingFeature" :label-width="100" class="w-full" label-align="top">
            <t-form-item label="特性名称" name="title" :rules="[{ required: true, message: '请输入特性名称', whitespace: true }]">
                <t-input v-model="editingFeature.title" placeholder="请输入特性名称" :maxlength="255" />
            </t-form-item>
            <t-form-item>
                <template #label>
                    参数类型 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <t-radio-group v-model="editingFeature.type">
                    <t-radio value="image">图片</t-radio>
                    <t-radio value="text">文本</t-radio>
                </t-radio-group>
            </t-form-item>
            <t-form-item key="image" v-if="editingFeature.type === 'image'">
                <template #label>
                    参数图片 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <FUploadImage v-model="editingFeature.imageUrl" />
            </t-form-item>
            <t-form-item label="参数文案" key="text" v-if="editingFeature.type === 'text'">
                <FLanguageFields initValue v-model="editingFeature.content" title="参数文案" btn-text="编辑"
                    :field-props="{ maxlength: 10 }" />
            </t-form-item>

            <t-form-item label="参数前缀">
                <FLanguageFields initValue v-model="editingFeature.prefix" title="参数前缀" btn-text="编辑"
                    :field-props="{ maxlength: 20 }" />
            </t-form-item>
            <t-form-item label="参数描述">
                <FLanguageFields initValue v-model="editingFeature.description" title="参数描述" btn-text="编辑"
                    :field-props="{ maxlength: 40 }" />
            </t-form-item>
            <t-form-item label="浮动注释">
                <FLanguageFields initValue v-model="editingFeature.floatComment" title="浮动注释" btn-text="编辑" />
            </t-form-item>
        </t-form>
    </t-drawer>
</template>