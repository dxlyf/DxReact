<script setup lang="ts">
import { computed } from 'vue'
import {useLang} from '@/hooks/useLang'

const [langList,{currentLocale}]=useLang()
type Props={

}

const props=withDefaults(defineProps<Props>(),{
    lang:'zh-CN',
})
const curLangList=computed(()=>{
    const locale=currentLocale.value
    const curLang=langList.value.find(item=>item.value==locale)
    const otherLangList= langList.value.filter(item=>item.value!=locale)
    if(curLang){
        return [curLang,...otherLangList]
    }else{
        return otherLangList
    }
})
const handleSwitch=(item:string)=>{
    currentLocale.value=item.value
}
</script>
<template>
    <div class=" bg-white flex flex-wrap items-center box-border p-2 text-sm gap-2">
        <template v-for="(item,i) in curLangList" :key="item.value">
            <div v-if="i==0" class="flex items-center">
                <div class="h-8 flex items-center px-3 font-semibold rounded-sm text-[#3355ff] bg-[#E8F0FF]">
               {{ item.label }}
               <t-icon name="swap" size="14" class="ml-3"></t-icon>
            </div>
            <div class="w-[1px] ml-2 h-[22px] bg-[#e6e8eb]"></div>
            </div>
            <div v-else @click="handleSwitch(item)" class="h-8 flex items-center px-3 cursor-pointer text-[#212733] hover:bg-[#E8F0FF] rounded-sm">
                {{ item.label }}
            </div>
        </template>
    </div>
</template>
<style scoped>

</style>