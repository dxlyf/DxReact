<script setup lang="ts">
import { watch, ref, toRaw } from 'vue'
import SideSubMenu from './SideSubMenu.vue'
import {storeToRefs} from 'pinia'
import { type MenuItem, useAppStore } from '@/stores/menuStore2'

const appStore = useAppStore()

</script>

<template>
  <aside class="f3-aside flex flex-col" :class="{'f3-aside-collapsed': appStore.menuCollapsed}">
    <div class="p-3 flex-none">
      <t-input v-show="!appStore.menuCollapsed" placeholder="搜索" v-model.trim="appStore.searchMenuKeyWord">
        <template #prefix-icon>
          <t-icon name="search" size="14"></t-icon>
        </template>
      </t-input>
    </div>
    <div class="flex-1 min-h-0">
      <t-menu theme="light" :collapsed="appStore.menuCollapsed" @change="appStore.onMenuChange" @expand="appStore.onMenuExpandChange" :expanded="appStore.expandedKeys" :value="appStore.activeMenuKey">
      <SideSubMenu :items="appStore.finalMenuData" />
    </t-menu>
    </div>
    <div class="f3-collapse" >
        <div class="f3-collapse-btn" @click="appStore.menuCollapsed = !appStore.menuCollapsed">
            <t-icon :name="appStore.menuCollapsed?'caret-right-small':'caret-left-small'"></t-icon>
        </div>
    </div>
  </aside>
</template>
<style>

  .f3-aside{
    position: relative;
    flex:none;
    height: 100%;
    box-sizing: border-box;
    border-right: 1px solid #e5e5e5;
    background-color: #fff;
    transition: width 0.3s cubic-bezier(0,1,0,1);
  }
  .f3-aside:not(.f3-aside-collapsed){
    width: 232px;
  }
  .f3-aside.f3-aside-collapsed{
    width: 64px;
   }
  .f3-collapse{
    position: absolute;
    top: 0;
    right: -10px;
    bottom:0;
    z-index: 100;
    width: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  .f3-aside:hover .f3-collapse{
      opacity: 1;
  }
  .f3-collapse-btn{
    position: absolute;
     top:50%;
     left:0;
     transform: translateY(-50%);
     height: 30px;
     background-color: #ddd;
     display: flex;
     align-items: center;
  }
   .f3-collapse-btn:hover{
     background-color: rgba(0,120,255,1);
     color:#fff;
   }

  .f3-aside .t-default-menu{
    width: 100% !important;
  }
  .f3-aside .t-menu--scroll{
    padding: 8px 16px;
  }
  /* .f3-aside .t-menu--scroll::-webkit-scrollbar-track{
  background: #f1f1f1; 
  border-radius: 4px;   
}
.f3-aside .t-menu--scroll::-webkit-scrollbar-thumb{
  background: #888;      
  border-radius: 4px;   
  
}
.f3-aside .t-menu--scroll::-webkit-scrollbar-thumb:hover {
  background: #555;
} */
.f3-aside .t-menu--scroll::-webkit-scrollbar{
    width:4px;
    
}
</style>