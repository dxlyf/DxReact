<script setup lang="ts">
import FLanguageFields from '@/views/example/tdesign/components/FLanguageFields/index.vue'
type Props = {
    prefix: string
}

export type APPCategoryDTO = {
    itemId?: number
    slug?: string
    type?: string
    version: string
    links: Record<string, string>
    systemInfo: Record<string, string>
    compatibility: Record<string, string>
    additionalInfo: Record<string, string>
    supportingDevice: Record<string, string>
}
const props = defineProps<Props>()
const model = defineModel<APPCategoryDTO>()
</script>
<template>
    <t-form-item label="版本号" :name="`${props.prefix}.version`">
        <t-input v-model:value="model.version"  />
    </t-form-item>
    <t-form-item label="下载链接" :name="`${props.prefix}.links`">
        <FLanguageFields  v-model="model.links" title="下载链接"  btn-text="编辑" />
    </t-form-item>
  <t-form-item label="系统信息" :name="`${props.prefix}.systemInfo`">
        <FLanguageFields  v-model="model.systemInfo" title="系统信息"   btn-text="编辑" />
    </t-form-item>
  <t-form-item label="兼容性" :name="`${props.prefix}.compatibility`">
        <FLanguageFields  v-model="model.compatibility" title="兼容性" btn-text="编辑" />
    </t-form-item>
     <t-form-item label="支持设备" :name="`${props.prefix}.supportingDevice`">
        <FLanguageFields  v-model="model.supportingDevice" type="textarea" title="支持设备"  btn-text="编辑" />
    </t-form-item>
    <t-form-item label="附加信息" :name="`${props.prefix}.additionalInfo`">
        <FLanguageFields  v-model="model.additionalInfo" type="textarea" title="附加信息"  btn-text="编辑" />
    </t-form-item>
</template>