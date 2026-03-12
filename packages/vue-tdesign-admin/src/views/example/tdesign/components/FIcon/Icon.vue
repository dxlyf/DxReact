<script setup lang="ts">
import { computed, inject } from 'vue';
    import * as lodash from 'lodash-es'
type Props={
    name?:string
    visible?:boolean
}

const props=withDefaults(defineProps<Props>(),{visible:false})
const iconContext=inject('ICON_CONTEXT',{})
const curVisible=computed(()=>{
     const isVisible= iconContext.isVisible
     if(!props.name){
        return props.visible
     }
     if(!isVisible){
        return false
     }
     return isVisible(props.name)
})
</script>

<template>
    <div v-if="curVisible" class="flex items-center">
        <t-icon name="info-circle-filled" size="12" color="rgba(0,0,0,0.4)"></t-icon>
        <div class="ml-1 text-[rgba(0,0,0,0.4)] text-xs">当前字段内容复用英文</div>
    </div>
</template>