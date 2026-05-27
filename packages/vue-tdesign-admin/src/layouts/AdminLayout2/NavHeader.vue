<script setup lang="ts">
import { shallowRef } from 'vue';


const useSettingOptions=shallowRef([{
    content:'用户中心',
    value:'user-center',
},{
    content:'退出登录',
    value:'logout',
}])
const handleUserSetting=(item)=>{
    console.log(item)
}
</script>

<template>
    <t-head-menu>
        <template #logo>
            <div class="f2-logo">
                Logo
            </div>
        </template>
        <template #operations>
  
                <t-dropdown @click="handleUserSetting" :options="useSettingOptions" placement="bottom-right" trigger="hover">
                      <div class="f2-head-user">
                        <t-avatar shape="circle"/>
                        <span class="f2-header-username">admin</span>
                        <t-icon name="chevron-down" size="14"></t-icon>
                      </div>
                </t-dropdown>
           
        </template>
    </t-head-menu>
</template>
<style>
.f2-head-user{
    display: flex;
    align-items: center;
    gap:4px;
    cursor: pointer;
}
.f2-head-user:hover{
    color: #007bff;
   }
</style>