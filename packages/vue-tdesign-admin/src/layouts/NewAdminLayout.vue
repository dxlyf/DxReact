<template>
    <t-layout class="bg-gray-100">
        <t-aside class="!w-fit !sticky top-0 h-screen">
            <t-menu
                :collapsed="menuStore.collapsed"
                :value="menuStore.activeMenuKey"
                :expanded="menuStore.expandedKeys"
                theme="light"
                @change="handleMenuChange"
                @expand="handleMenuExpand"
            >
                <template #logo>
                    <div class="text-xl font-bold text-blue-600 px-4">后台管理</div>
                </template>
                <new-side-submenu :items="menuStore.menuData"></new-side-submenu>
            </t-menu>
        </t-aside>
        <t-layout class="min-w-0 min-h-0">
            <t-header class="sticky top-0 z-[1000] bg-white shadow-sm">
                <t-head-menu>
                    <template #logo>
                        <t-button theme="default" variant="text" @click="menuStore.toggleCollapsed">
                            <t-icon :name="menuStore.collapsed ? 'menu' : 'view-list'" />
                        </t-button>
                    </template>
                    <template #operations>
                        <t-space>
                            <t-dropdown trigger="click" @click="handleChangeLocale" :options="localeOptions">
                                <t-button variant="text">
                                    <t-icon name="translate" />
                                    <template #suffix><t-icon name="chevron-down" size="16" /></template>
                                </t-button>
                            </t-dropdown>
                            <t-dropdown placement="bottom" :options="settingOptions" trigger="hover" @click="handleSetting">
                                <t-space :size="1">
                                    <t-avatar shape="circle" image="https://tdesign.gtimg.com/site/avatar.jpg" />
                                    <t-button variant="text">
                                        admin
                                        <template #suffix><t-icon name="chevron-down" size="16" /></template>
                                    </t-button>
                                </t-space>
                            </t-dropdown>
                        </t-space>
                    </template>
                </t-head-menu>
            </t-header>
            <div v-if="menuStore.tabs.length > 0" class="bg-white border-b px-4">
                <t-tabs
                    :value="menuStore.activeTab"
                    @change="handleTabChange"
                    theme="card"
                    :addable="false"
                >
                    <t-tab-panel
                        v-for="tab in menuStore.tabs"
                        :key="tab.path"
                        :value="tab.path"
                        :label="tab.title"
                        :removable="tab.closable"
                        @remove="handleTabRemove(tab.path)"
                    />
                </t-tabs>
            </div>
            <t-content class="p-5 min-h-0">
                <router-view v-slot="{ Component, route }">
                    <keep-alive>
                        <component :is="Component" :key="route.path" />
                    </keep-alive>
                </router-view>
            </t-content>
        </t-layout>
    </t-layout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { h } from 'vue'
import type { DropdownOption } from 'tdesign-vue-next'
import { useNewMenuStore } from '@/stores/newMenu'
import { DiscountIcon } from 'tdesign-icons-vue-next'
import NewSideSubmenu from './components/NewSideSubmenu.vue'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const menuStore = useNewMenuStore()

const localeOptions: DropdownOption[] = [
    { value: 'zh-CN', active: locale.value === 'zh-CN', content: '中文' },
    { value: 'en', active: locale.value === 'en', content: 'English' }
]

const settingOptions: DropdownOption[] = [
    {
        content: '个人设置',
        value: '1',
        prefixIcon: () => h(DiscountIcon),
        divider: true
    },
    {
        content: '退出登录',
        value: '2',
        prefixIcon: () => h(DiscountIcon)
    }
]

const handleMenuChange = (value: string | number) => {
    menuStore.setActiveMenuKey(value as string)
}

const handleMenuExpand = (keys: string[]) => {
    menuStore.setExpandedKeys(keys)
}

const handleTabChange = (value: string) => {
    menuStore.setActiveTab(value)
    router.push(value)
}

const handleTabRemove = (path: string) => {
    const wasActive = menuStore.activeTab === path
    menuStore.removeTab(path)
    if (wasActive && menuStore.activeTab) {
        router.push(menuStore.activeTab)
    }
}

const handleChangeLocale = (option: DropdownOption) => {
    locale.value = option.value as string
    localStorage.setItem('lang', option.value as string)
    document.documentElement.lang = option.value as string
}

const handleSetting = () => {
    console.log('settings')
}

const syncRouteToMenu = () => {
    if (route.meta) {
        menuStore.syncMenuStateByRoute({
            menuKey: route.meta.menuKey as string,
            parentMenuKey: route.meta.parentMenuKey as string,
            title: route.meta.title as string,
            path: route.path,
            name: route.name as string
        })
    }
    if (route.meta && route.meta.title) {
        menuStore.addTab({
            path: route.path,
            name: route.name as string,
            title: route.meta.title as string,
            closable: route.meta.closable !== false
        })
    }
}

watch(() => route.path, () => {
    syncRouteToMenu()
}, { immediate: false })

watch(() => route.meta, () => {
    syncRouteToMenu()
}, { deep: true })

onMounted(() => {
    menuStore.initMenuData()
    syncRouteToMenu()
})

defineOptions({
    name: 'NewAdminLayout'
})
</script>