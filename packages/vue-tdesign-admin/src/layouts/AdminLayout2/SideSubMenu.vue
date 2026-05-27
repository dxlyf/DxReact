<script setup lang="ts">
import { ref } from 'vue'
import {useRouter} from 'vue-router'
import { MenuItem } from './types'
const props = withDefaults(defineProps<{
    items: MenuItem[]
}>(), {
    items: () => [],
})
const router=useRouter()
const handleMenuNav = (item: MenuItem) => {
    if (item.path) {
        router.push(item.path)
    }
}
defineOptions({
    name: 'SideSubMenu',
})
</script>
<template>
    <template v-for="item in props.items" :key="item.menuKey">
        <t-submenu v-if="Array.isArray(item.children)" :value="item.menuKey">
            <template #icon v-if="item.icon">
                <t-icon :name="item.icon" size="16" />
            </template>
            <template #title>{{ item.name }}</template>
            <SideSubMenu :items="item.children" />
        </t-submenu>
        <t-menu-item v-else :value="item.menuKey" @click="handleMenuNav(item)">
            <template #icon v-if="item.icon">
                <t-icon :name="item.icon" size="16" />
            </template>
            {{ item.name }}
        </t-menu-item>


    </template>
</template>