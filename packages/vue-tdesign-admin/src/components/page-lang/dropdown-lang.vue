<template>
    <t-dropdown  :options="langList" @click="handleChange" trigger='click' placement='bottom-right'>
        <t-space :size="4">
             <span>当前配置语言：</span>
            <t-link theme="primary" >{{ currentLang.content }}<t-icon name="chevron-down" /></t-link>
        </t-space>
    </t-dropdown>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { LANG_LIST } from './config'
import type {DropdownProps} from 'tdesign-vue-next'
const langList=computed(()=>{
    return LANG_LIST.map(d=>({
        content:d.label,
        value:d.value,
    }))
})
const model=defineModel<string>({default:'zh-CN'})
const currentLang=computed(()=>{
    return langList.value.find(d=>d.value===model.value)||langList.value[0]
})
const handleChange=(dropdownItem:any)=>{
    model.value=dropdownItem.value
}
defineOptions({
    name:'DropdownLang',
})
</script>
