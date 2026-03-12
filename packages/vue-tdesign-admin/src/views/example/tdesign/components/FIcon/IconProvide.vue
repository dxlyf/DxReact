<script setup lang="ts">
    import {computed, provide} from 'vue'
    import * as lodash from 'lodash-es'
    type Props={
        value?:any
    }
    const isNullOrUndefined=(val:any)=>{
    return val===null||val===undefined
}
    const props=defineProps<Props>()
    provide('ICON_CONTEXT',{
        isVisible(name:string){
            return !isNullOrUndefined(lodash.get(props.value,name))
        }
    })
</script>
<template>
    <slot></slot>
</template>