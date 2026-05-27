<script setup lang="ts">
import type { DropdownOption,SelectOption } from 'tdesign-vue-next'
import { ref } from 'vue'
import Header from './Header.vue'
import SideMenu from './SideMenu.vue'
import { type MenuItem, useAppStore } from '@/stores/menuStore2'

const appStore = useAppStore()

</script>

<template>
  <!-- 顶部导航栏 -->
 <div v-if="appStore.loading" class="absolute inset-0 flex items-center justify-center overflow-hidden">
  <t-loading :loading="true" text="初始化加载系统数据中...">
  </t-loading>
</div>
  <div class="f3-layout" v-else>
       <Header v-cloak />
       <main class="f3-main">
            <SideMenu v-cloak />
            <div class="f3-main-conent">
                <router-view />
            </div>
       </main>
  </div>
</template>
<style>
.f3-layout{
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
}
.f3-layout .f3-header{
    display: flex;
    align-items: center;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    z-index: 10;
    position: relative;
    flex:none;
    height: 56px;
    background-color: #fff;
    padding: 0 24px;
}
.f3-layout .f3-main{
    flex:1;
    display: flex;
    min-height: 0;
    box-sizing: border-box;
}

.f3-layout .f3-main .f3-main-conent{
    flex:1;
    height: 100%;
    padding:16px 20px;
    box-sizing: border-box;
    overflow-y: auto;
}

</style>