<template>
<div class="flex">
    <div ref="contentContaienr" class="expandable-content flex-1" :style="contentStyle">
        <slot></slot>
    </div>
    <a v-if="lineClamp" class="flex-none self-end cursor-pointer text-xs text-blue-500 hover:text-blue-600 active:text-blue-600" @click.prevent="handleExpand">{{ expand?'收起':'展开' }}</a>
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
const lineClamp=ref(false)
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
        '-webkit-line-clamp':!expand.value&&lineClamp.value?props.lines:null,
        '-webkit-box-orient':'vertical',
        'overflow':'hidden',
        'display':'-webkit-box',
    //    'text-overflow':'ellipsis',
    }
})

const checkOverflow=()=>{
    const scrollHeight=contentContaienr.value?.scrollHeight
    const height=contentContaienr.value?.clientHeight
    // 计算一行的高度
    const cloneEl=contentContaienr.value?.cloneNode(true) as HTMLElement
    cloneEl.style.visibility='hidden'
    cloneEl.style.position='absolute'
  //  cloneEl.style.top='-9999px'
 //   cloneEl.style.left='-9999px'
    cloneEl.style.whiteSpace='nowrap'
    cloneEl.style.overflow='hidden'
    
    document.body.appendChild(cloneEl)
    const lineHeight=cloneEl.clientHeight
    console.log('lineHeight',lineHeight)
  //  document.body.removeChild(cloneEl)
    if(scrollHeight>height){
        // 有溢出
        lineClamp.value=true
    }else{
        // 无溢出
        lineClamp.value=false
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