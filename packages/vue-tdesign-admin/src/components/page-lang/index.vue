<template>
    <slot></slot>
</template>
<script  lang="ts">
import {defineComponent} from 'vue'
export default defineComponent({
    name:'PageLang',
    props:{
        lang:{
            type:String,
            default:'zh-CN',
        }
    },
    setup(props){
    
    }
})
</script>