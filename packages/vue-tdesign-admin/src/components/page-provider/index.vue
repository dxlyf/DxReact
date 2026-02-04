<template>
    <slot></slot>
</template>
<script setup lang="ts">
import {onMounted} from 'vue'
import {initPageProvider} from './index.ts'

defineOptions({
    name:'PageProvider',
})
</script>
