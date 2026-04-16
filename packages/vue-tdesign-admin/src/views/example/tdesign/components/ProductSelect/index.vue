<script setup lang="ts">
import type { TdSelectProps } from 'tdesign-vue-next'
import { computed, toRaw, unref, useAttrs } from 'vue';
import { useRequest } from '@/hooks/useRequest2'
// const props = defineProps<TdSelectProps>()

const [productState, productInst] = useRequest({
    defaultValue: [],
    request: async () => {
        return [{
            label: '产品1',
            value: '1'
        }, {
            label: '产品2',
            value: '2'
        }, {
            label: '产品3',
            value: '3'
        }]
    }
})
const attrs=useAttrs()
const selectProps = computed<TdSelectProps>(() => {
    ///const rest = omitUndefined(props)
   // console.log('rest',rest)
    return {
        filterable: true,
        options: productState.data,
        ...attrs
    }
})
</script>
<template>
    <t-select v-bind="selectProps"></t-select>
</template>