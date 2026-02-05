<template>
        <div class="flex text-xs align-middle">
             <span class="opacity-70">当前配置语言：</span>
            <t-dropdown v-if="type==='link'" :options="langList" @click="handleChange" trigger='click' placement='bottom-right'>
                    <t-link theme="default" class="!text-xs" >{{ currentLang.content }}<t-icon name="chevron-down" /></t-link>
                </t-dropdown>
                <span v-else>{{ currentLang.content }}</span>
            </div>

</template>
<script setup lang="ts">
import { computed } from 'vue'
import { LANG_LIST } from './config'
type Props={
    type:'default'|'link' //variant
}
const props=withDefaults(defineProps<Props>(),{
    type:'default',
})
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
