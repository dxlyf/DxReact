<script setup lang="ts">
import { ref } from 'vue'
import type { TdBreadcrumbItemProps } from 'tdesign-vue-next'
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
            <t-breadcrumb v-if="breadcrumbItems.length > 0" :options="breadcrumbItems">
            </t-breadcrumb>
            <div class="bg-white p-4 rounded-md mt-4">
                <div class="text-lg font-bold">
                    {{ title }}
                </div>
                <div class="mt-4">
                    <slot name="form">
                    </slot>
                </div>
                <div class="mt-4">
                    <slot name="table">
                    </slot>
                </div>
            </div>
        </div>
    </slot>
</template>