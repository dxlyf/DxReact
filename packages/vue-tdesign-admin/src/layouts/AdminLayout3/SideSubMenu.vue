<script setup lang="ts">
import { type MenuItem} from '@/stores/menuStore2'
import {useRouter} from 'vue-router'

const props = defineProps<{
  items: MenuItem[]
}>()
defineOptions({
    name: 'SideSubMenu',
})
const router=useRouter()
const handleMenuNav = (item: MenuItem) => {
    if (item.path) {
        router.push(item.path)
        console.log('点击了菜单',item.path)
    }
}
</script>
<template>
     <template v-for="item in props.items" :key="item.menuKey">
        <t-submenu v-if="Array.isArray(item.children)" :value="item.menuKey">
            <template #icon v-if="item.icon">
                <img v-if="item.webIcon" :src="item.webIcon" class="size-[16px]"/>
                <t-icon v-else :name="item.icon||'app'"  size="16" />
            </template>
            <template #title>{{ item.name }}</template>
            <SideSubMenu :items="item.children" />
        </t-submenu>
        <t-menu-item v-else :value="item.menuKey" :to="item.path" @click="handleMenuNav(item)">
            <template #icon v-if="item.icon">
                <img v-if="item.webIcon" :src="item.webIcon" class="size-[16px]"/>
                <t-icon v-else :name="item.icon||'app'" size="16" />
            </template>
            {{ item.name }}
        </t-menu-item>
    </template>
</template>