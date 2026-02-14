<script setup lang="ts">
import { ref } from 'vue'
import type { TdBreadcrumbItemProps } from 'tdesign-vue-next'
import FLanguage from '../FLanguage/index.vue'

export type Props = {
    title: string
    breadcrumbItems?: TdBreadcrumbItemProps[]
}
const props = withDefaults(defineProps<Props>(), {
    title: '',
    breadcrumbItems: () => []
})
</script>

<template>
    <slot name="wrapper">
        <div class="h-full flex flex-col">
            <f-language></f-language>
            <div class="mt-3 mb-3" v-if="breadcrumbItems.length > 0" >
                <t-breadcrumb :options="breadcrumbItems">
            </t-breadcrumb>
            </div>
            <div class="bg-white rounded-md">
                <div class="text-lg font-bold p-4">
                    {{ title }}
                </div>
                <div class="p-4">
                    <slot name="form">
                    </slot>
                </div>
                <div class="p-4">
                    <slot name="table">
                        <t-empty title="未查询到数据">
                            <t-button>返回</t-button>
                        </t-empty>
                    </slot>
                </div>
            </div>
        </div>
    </slot>
</template>