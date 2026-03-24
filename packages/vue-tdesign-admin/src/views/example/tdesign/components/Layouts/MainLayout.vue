<script setup lang="ts">
import { type TdBreadcrumbProps } from 'tdesign-vue-next';
import { useLang } from '@/hooks/useLang'
import FLangSwitch from '../FLangSwitch/index.vue'
type Props = {
    layout?:'list'|'edit'|'empty'
    breadcrumbOptions: TdBreadcrumbProps['options']
    loading?: boolean
    loadingText?: string
    showLang?: boolean
    title?: string
}
const [, { currentLanguage }] = useLang()
const props = withDefaults(defineProps<Props>(), {
    showLang: false,
    layout:'empty',
    breadcrumbOptions: () => []
})
defineSlots<{
    default: any // 主内容区
    header: any // 
    content: any
    operation: any // 操作按钮区
    title:any
}>()
</script>

<template>
    <div class="flex flex-col h-full box-border min-h-0">
        <template v-if="showLang">
            <div class="mb-2">
                <t-breadcrumb separator="/" :options="breadcrumbOptions">
                </t-breadcrumb>
            </div>
            <div class="flex items-center">
                <div class="flex-1">
                    <div class="font-semibold text-xl">
                        <slot name="title">
                            {{ title }}
                        </slot>
                    </div>
                </div>
                <div class="flex-none">
                    <slot name="operation">
                    </slot>
                </div>
            </div>
            <FLangSwitch class="mt-4"></FLangSwitch>
        </template>
        <template v-else>
            <div class="flex items-center gap-[10px]">
                <span>当前配置语言：</span>
                <span class="font-bold">{{ currentLanguage?.label }}</span>
            </div>
            <div class="mb-2">
                <t-breadcrumb separator="/" :options="breadcrumbOptions">
                </t-breadcrumb>
            </div>
            <slot name="header">
                <div class="flex">
                    <div class="flex-1">
                        <slot name="title">
                            <div class="font-semibold text-xl">{{ title }}</div>
                        </slot>
                    </div>
                    <div class="flex-none">
                        <slot name="actions">
                        </slot>
                    </div>
                </div>
            </slot>
        </template>
        <template v-if="layout==='list'">
            <slot name="content">
                <t-loading :text="loadingText" :loading="loading" class="mt-4 flex flex-col flex-1 min-h-0 bg-white rounded-sm p-4 gap-4" show-overlay>
                    <slot></slot>
                </t-loading>
            </slot>
        </template>
        <template v-else-if="layout==='edit'">
            <slot name="content">
                <t-loading :text="loadingText" :loading="loading" class="bg-white p-4 rounded-sm flex flex-col flex-1 min-h-0 mt-4 gap-y-4">
                    <slot></slot>
                </t-loading>
            </slot>
        </template>
        <template v-else>
            <slot name="content">
                <t-loading :text="loadingText" :loading="loading" class="mt-4 flex flex-col flex-1 min-h-0" show-overlay>
                    <slot></slot>
                </t-loading>
            </slot>
        </template>
    </div>
</template>