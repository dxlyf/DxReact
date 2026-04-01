<script setup lang="ts">
import {type VNode,getCurrentInstance,ref,provide,inject,computed,watch} from 'vue'
import {type CollapseProps,useCollapse} from './useCollapse'

const props=defineProps<CollapseProps>()

defineSlots<{
    default:()=>VNode
    headerRight:()=>VNode
}>()
const {activeKeys}=useCollapse(props)


</script>

<template>
    <div class="p-collapse-wrap">
        <slot></slot>
    </div>
</template>
<style>
.p-collapse-wrap>.p-collapse-item:nth-of-type(n+2){
    margin-top: 32px;
}
</style>