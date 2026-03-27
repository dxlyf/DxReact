<script setup lang="ts">
import { computed } from 'vue'
import {useLang} from '@/hooks/useLang'
import {useRoute,useRouter} from 'vue-router'
const [langList,{currentLocale,currentLanguage}]=useLang()
type Props={

}
const router=useRouter()
const route=useRoute()

const props=withDefaults(defineProps<Props>(),{
    lang:'zh-CN',
})
const curLangList=computed(()=>{
    const locale=currentLocale.value
    const curLang=langList.value.find(item=>item.value==locale)
    //const otherLangList= langList.value.filter(item=>item.value!=locale)
    if(curLang){
        return [curLang,...langList.value]
    }else{
        return langList.value
    }
})
const handleSwitch=(item:string)=>{
    currentLocale.value=item.value
    router.replace({
        path:'/reload',
        query:{
            redirect:route.fullPath
        }
    })
    //  router.replace({
    //     path:route.path,
    //     state:{age:4343},
    //     query:{
    //         ...route.query,
    //         t:Date.now()
    //     }
    //  })
    
}
</script>
<template>
    <div class=" bg-white flex flex-wrap items-center box-border p-2 text-sm gap-2">
             <div key="first" class="flex items-center">
                <div class="h-8 flex items-center px-3 rounded-sm">
               {{ currentLanguage?.label }}
               <t-icon name="swap" size="14" class="ml-3"></t-icon>
            </div>
            <div class="w-[1px] ml-2 h-[22px] bg-[#e6e8eb]"></div>
            </div>
        <template v-for="(item,i) in langList" :key="item.value">
            <div @click="handleSwitch(item)" :class="[item.value===currentLocale?'text-[#3355ff] bg-[#E8F0FF] font-semibold':'text-[#212733] hover:bg-[#E8F0FF] active:bg-[#dfeaff]']" class="h-8 flex items-center px-3 cursor-pointer  rounded-sm">
                {{ item.label }}
                <div class="size-[6px] rounded-full bg-[#3355ff] ml-2"></div>
            </div>                         
        </template>
    </div>
</template>
<style scoped>

</style>