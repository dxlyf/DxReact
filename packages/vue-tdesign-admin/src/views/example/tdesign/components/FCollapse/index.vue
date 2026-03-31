<script setup lang="ts">
import {type VNode,getCurrentInstance,ref,provide} from 'vue'
type Props={
    header:string
    contentClass?:string
}
const props=defineProps<Props>()

defineSlots<{
    default:()=>VNode
    headerRight:()=>VNode
}>()
const current=getCurrentInstance()
const expanded=ref(false)
</script>

<template>

</template>