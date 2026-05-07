<script setup lang="ts">
import { computed,inject} from 'vue';


type Props={
    name:string
}
const props=defineProps<Props>()
const {}=inject('REUSE_ENGLISH_CONTEXT',{})

const visibleReuseTip=computed(()=>{
    // 是否存在翻译表

})


</script>

<template>

</template>