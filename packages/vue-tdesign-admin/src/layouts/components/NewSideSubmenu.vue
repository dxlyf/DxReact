<template>
    <template v-for="item in props.items" :key="item.menuKey">
        <t-menu-item v-if="!Array.isArray(item.children) || item.children.length === 0" :value="item.menuKey" :to="item.path">
            <template #icon>
                <t-icon :name="item.icon" />
            </template>
            {{ item.menuName }}
        </t-menu-item>
        <t-submenu v-else :value="item.menuKey">
            <template #icon>
                <t-icon :name="item.icon" />
            </template>
            <template #title>
                {{ item.menuName }}
            </template>
            <new-side-submenu :items="item.children" />
        </t-submenu>
    </template>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/stores/newMenu';

type Props = {
    items: MenuItem[]
}

const props = defineProps<Props>()

defineOptions({
    name: 'NewSideSubmenu'
})
</script>