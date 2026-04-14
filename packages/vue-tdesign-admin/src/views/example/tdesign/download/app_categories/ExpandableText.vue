<template>
<div class="flex">
    <div ref="contentContaienr" class="expandable-content flex-1" :style="contentStyle">
        <slot></slot>
    </div>
    <a class="flex-none self-end cursor-pointer text-xs text-blue-500 hover:text-blue-600 active:text-blue-600" @click.prevent="handleExpand">{{ expand?'收起':'展开' }}</a>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted,onUnmounted, watch, nextTick, type Ref, shallowRef, computed } from 'vue'

const props=withDefaults(defineProps<{
    lines:number,
}>(),{
    lines:2,
})
const expand=ref(false)
const handleExpand=()=>{
    expand.value=!expand.value
}
/**
 * overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: var(<custom-property>)
 */
const contentStyle=computed(()=>{
    return {
        '-webkit-line-clamp':expand.value?null:props.lines,
        '-webkit-box-orient':'vertical',
        'overflow':'hidden',
        'display':'-webkit-box',
    //    'text-overflow':'ellipsis',
    }
})
const checkOverflow=()=>{
    const scrollHeight=contentContaienr.value?.scrollHeight
    const height=contentContaienr.value?.clientHeight
    if(scrollHeight>height){
        // 有溢出
    }else{
        // 无溢出
    }
}
let contentContaienr=shallowRef<HTMLElement>()
let observe:ResizeObserver|null=null
onMounted(()=>{
    observe=new ResizeObserver((entries)=>{
        const [entry]=entries
        checkOverflow()
    })
    observe.observe(contentContaienr.value)
})
onUnmounted(()=>{
    observe?.disconnect()
})
</script>

<style scoped>
.expandable-content{
  
}
</style>