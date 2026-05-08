<script setup lang="ts">
import { computed,inject, useAttrs} from 'vue';


type Props={
    name:string|string[]
}
const props=defineProps<Props>()
const reuseContext=inject('REUSE_ENGLISH_CONTEXT',{})
const attrs=useAttrs()
const visibleReuseTip=computed(()=>{
    // 是否存在翻译表
    const visible=attrs.visible
    if(typeof visible==='boolean'||!props.name||!reuseContext.isVisible){
        return visible
    }
    return Array.isArray(props.name)?props.name.every(name=>reuseContext.isVisible(name)):reuseContext.isVisible(props.name)
})


</script>

<template>

</template>