<template>
        <div class="flex text-xs align-middle">
             <span class="opacity-70">当前配置语言：</span>
            <t-dropdown v-if="allowSwitch" :options="langList" @click="handleChange" trigger='click' placement='bottom-right'>
                    <t-link theme="default" class="!text-xs" >{{ currentLanguage.label }}<t-icon name="chevron-down" /></t-link>
                </t-dropdown>
                <span v-else>{{ currentLanguage.label }}</span>
            </div>

</template>
<script setup lang="ts">
import { computed } from 'vue'
import {useLang} from '@/hooks/useLang'
type Props={
     allowSwitch?:boolean
}
const props=withDefaults(defineProps<Props>(),{
    allowSwitch:false
})
const [langList,{currentLanguage,currentLocale}]=useLang()

const handleChange=(dropdownItem:any)=>{
    currentLocale.value=dropdownItem.value
}
defineOptions({
    name:'DropdownLang',
})
</script>
