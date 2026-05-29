<template>
    <t-layout class="bg-gray-200">
        <t-aside class="!w-fit !sticky top-0 h-screen">
            <t-menu  v-bind="menuProps">
                <template #logo>
                    <div class="text-2xl font-bold text-blue-600">后台管理</div>
                </template>
                <side-submenu :items="menuState.menuData"></side-submenu>
            </t-menu>  
        </t-aside>
        <!--min-w-0防止flex扩展-->
    <t-layout class="min-w-0 min-h-0">
        <t-header class="sticky top-0 z-[1000]">
            <t-head-menu>
                <template #logo>
                   <t-button theme="default" variant="text" @click="menuState.collapsed=!menuState.collapsed">
                    <t-icon name="view-list"></t-icon>
                   </t-button>
                </template>
                <template #operations>
                 <t-space class="tdesign-demo-dropdown">
                    <t-dropdown trigger="click" @click="handleChangeLocale" :options="[{value:'zh-CN',active:locale==='zh-CN',content:'zh-CN'},{value:'en',active:locale==='en',content:'en-US'}]" >
                        <t-button variant="text" >
                             <t-icon name="translate"></t-icon>
                             <template #suffix> <t-icon name="chevron-down" size="16" /></template>
                        </t-button>
                    </t-dropdown>
                    <t-dropdown  placement="bottom" :options="settingOptions"  trigger="hover" @click="handleSetting">
                    
                    <t-space :size="1">
                       <t-avatar shape="circle" image="https://tdesign.gtimg.com/site/avatar.jpg" />
                       <t-button variant="text">admin<template #suffix> <t-icon name="chevron-down" size="16" /></template></t-button>
                    </t-space>

                    </t-dropdown>
                </t-space>
                </template>
            </t-head-menu>
        </t-header>
        <t-content class="px-5 py-4 min-h-0">
            <template v-if="!caughtError">
                <router-view></router-view>
            </template>
            <template v-else>
                <div class="flex flex-col items-center justify-center py-20">
                    <t-icon name="error-circle" size="64" class="text-red-400 mb-4" />
                    <h2 class="text-lg font-medium text-gray-700 mb-2">页面渲染异常</h2>
                    <p class="text-sm text-gray-400 mb-6">抱歉，页面渲染时发生了意外错误</p>
                    <t-button theme="primary" @click="handleRetry">重新加载</t-button>
                </div>
            </template>
        </t-content>
        <t-footer v-if="false">
        </t-footer>
    </t-layout>
    </t-layout>
</template>

<script setup lang="ts">
import { ref, h, onErrorCaptured } from 'vue'
import { useMenu } from 'src/hooks/useMenu'
import { type DropdownOption } from 'tdesign-vue-next';
import { useI18n } from 'vue-i18n'
const {locale}=useI18n()

import { DiscountIcon } from 'tdesign-icons-vue-next';
import SideSubmenu from './components/SideSubmenu.vue'
const [menuProps,menuState]=useMenu()

const caughtError = ref(false)

onErrorCaptured((err, instance, info) => {
    caughtError.value = true
    console.error('[AdminLayout Error Boundary]:', err, info)
    return false
})

const handleRetry = () => {
    caughtError.value = false
}

const handleChangeLocale=(e:DropdownOption)=>{
    locale.value=e.value as any
    localStorage.setItem('lang',e.value as string)
    document.documentElement.lang=e.value as string
}
const settingOptions:DropdownOption[]=[
    {
        content: '个人设置',
        value: '1',
        prefixIcon:()=>h(DiscountIcon),
        divider:true
    },{
        content: '退出登录',
        value: '2',
        prefixIcon:()=>h(DiscountIcon),
    }
]
const handleSetting=()=>{

}
defineOptions({
    name: 'AdminLayout',
})
</script>