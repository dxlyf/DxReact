<template>
    <template v-for="item in props.items" :key="item.path">
        <t-menu-item v-if="!Array.isArray(item.children)" :value="item.path"  :to="item.path" :title="item.title">
            <template #icon>
                <t-icon :name="item.icon" />
            </template>
            {{ item.title }}
        </t-menu-item>
        <t-submenu v-else :value="item.path"  :title="item.title" >
               <template #icon>
                <t-icon :name="item.icon" />
            </template>
                <template #title>
                {{ item.title }}
            </template>
            <template #content v-if="Array.isArray(item.children)&&item.children.length>0" >
                <side-submenu :items="item.children" />
            </template>
        </t-submenu>
    </template>
</template>
<script setup lang="ts">
import type { MenuDataItem } from 'src/hooks/useMenu';
import {  } from 'vue'
type Props={
    items:MenuDataItem[]
}
const props=defineProps<Props>()
defineOptions({
    name:'SideSubmenu'
})
</script>
