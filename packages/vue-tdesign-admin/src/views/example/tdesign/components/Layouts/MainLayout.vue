<script setup lang="ts">
import { TdBreadcrumbProps } from 'tdesign-vue-next';
import {useLang} from '@/hooks/useLang'
type Props={
    breadcrumbOptions:TdBreadcrumbProps['options']
    loading?:boolean
    showLang?:boolean
    title?:string
}
const [,{currentLanguage}]=useLang()
const props=withDefaults(defineProps<Props>(),{
    showLang:false,
    breadcrumbOptions:()=>[]
})

</script>

<template>
    <div class="flex flex-col h-full box-border p-4">
      <template v-if="showLang">
          <div class="mb-2">
            <t-breadcrumb separator="/" :options="breadcrumbOptions">
            </t-breadcrumb>
        </div>
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
        <FLangSwitch class="mt-4" ></FLangSwitch>
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
      </template>
        <slot name="content">
            <div class="mt-4 flex gap-4 flex-1">
               <t-loading :loading="loading" show-overlay>
                    <slot></slot>
               </t-loading>
            </div>
        </slot>
    </div>
</template>