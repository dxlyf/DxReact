<script setup lang="ts">
import { computed } from 'vue'
import {useLang} from '@/hooks/useLang'
import {useRoute,useRouter} from 'vue-router'
const [langList,{currentLocale}]=useLang()
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
    const otherLangList= langList.value.filter(item=>item.value!=locale)
    if(curLang){
        return [curLang,...otherLangList]
    }else{
        return otherLangList
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
        <template v-for="(item,i) in curLangList" :key="item.value">
            <div v-if="i==0" class="flex items-center">
                <div class="h-8 flex items-center px-3 font-semibold rounded-sm text-[#3355ff] bg-[#E8F0FF]">
               {{ item.label }}
               <t-icon name="swap" size="14" class="ml-3"></t-icon>
            </div>
            <div class="w-[1px] ml-2 h-[22px] bg-[#e6e8eb]"></div>
            </div>
            <div v-else @click="handleSwitch(item)" class="h-8 flex items-center px-3 cursor-pointer text-[#212733] hover:bg-[#E8F0FF] active:bg-[#dfeaff] rounded-sm">
                {{ item.label }}
            </div>                         
        </template>
    </div>
</template>
<style scoped>

</style>