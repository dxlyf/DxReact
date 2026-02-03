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
    <t-layout>
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
                    <t-dropdown :options="settingOptions"  trigger="click" @click="handleSetting">

                    <t-button variant="text" shape="circle">
                        <t-avatar image="https://tdesign.gtimg.com/site/avatar.jpg" />
                  
                    </t-button>

                    </t-dropdown>
                </t-space>
                </template>
            </t-head-menu>
        </t-header>
        <t-content class="p-4">
             <router-view v-slot="{Component}">
                 <keep-alive >
                    <component :is="Component" :key="$route.path"/>
                 </keep-alive>
            </router-view>
    
        </t-content>
        <t-footer>
        </t-footer>
    </t-layout>
    </t-layout>
</template>

<script setup lang="ts">
import { onMounted, watch,computed,ref,h } from 'vue'
import { useMenu,type MenuDataItem } from 'src/hooks/useMenu'
import { type DropdownOption } from 'tdesign-vue-next';
import { useI18n } from 'vue-i18n'
const {locale}=useI18n()

import { DiscountIcon,LocationIcon,ChineseCabbageIcon } from 'tdesign-icons-vue-next';
import SideSubmenu from './components/SideSubmenu.vue'
const [menuProps,menuState]=useMenu()
const asideCallapse=ref(false)
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