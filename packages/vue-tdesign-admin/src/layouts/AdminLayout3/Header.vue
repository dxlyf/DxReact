<script setup lang="ts">
import { ref } from 'vue';
import { SelectOption, DropdownOption } from 'tdesign-vue-next';
import { type MenuItem, useAppStore } from '@/stores/menuStore2'

const appStore = useAppStore()


const userOpts: DropdownOption[] = [
  { content: '个人设置', value: 'setting',divider:true },
  { content: '退出登录', value: 'logout'}
]

function onUserClick(opt: DropdownOption) {
  if (opt.value === 'setting') {
    console.log('打开个人设置')
  }
  if (opt.value === 'logout') {
    console.log('退出登录')
  }
}
</script>
<template>
    <header class="f3-header">
            <div class="flex-none h-full flex items-center gap-4">
                 <img src="/vite.svg" class="size-8">
                 <span class="text-xl">管理后台</span>
            </div>
            <div class="flex-1 ml-[50px] flex">
                <div>
                    <t-select  @change="appStore.onAppSlugChange" :value="appStore.currentAppSlug" :borderless="true" :auto-width="true" :options="appStore.tenantData">
                    </t-select>
                </div>
            </div>
            <div class="flex-none">
                <t-dropdown @click="onUserClick" :options="userOpts" placement="bottom-right" trigger="hover">
                    <div class="flex items-center gap-2 cursor-pointer hover:text-blue-500">
                        <t-avatar shape="circle"/>
                        <span class="text-base">{{ appStore.userInfo.username }}</span>
                        <t-icon name="chevron-down" size="14"></t-icon>
                    </div>
                </t-dropdown>
            </div>
       </header>
</template>