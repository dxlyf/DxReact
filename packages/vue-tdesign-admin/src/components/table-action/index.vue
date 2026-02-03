<template>
    <t-space :size="4">
        <t-link v-for="item in actions" :key="item.key" hover="color" :theme="item.theme" @click="handleClick(item)">{{ item.label }}</t-link>
    </t-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
export type TableActionItem={
    label:string
    key:string
    order?:number
    theme?:"default" | "primary" | "success" | "warning" | "danger";
    permission?:string|string[]
}
export type TableActionProps={
    items:TableActionItem[]
}
const props=withDefaults(defineProps<TableActionProps>(),{
    items:()=>[]
})
const actions=computed(()=>{
    return props.items.map((item,i)=>({theme:'primary',order:i,...item})).sort((a,b)=>a.order-b.order)
})
const handleClick=(item:TableActionItem)=>{
    //this.$emit('click',item)
}
</script>