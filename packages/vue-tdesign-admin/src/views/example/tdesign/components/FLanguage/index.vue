<script setup lang="ts">
import {useLang} from '@/hooks/useLang'
import { shallowRef,watch } from 'vue';
const [langList,{currentLanguage,currentLocale}]=useLang()
type Props={
  type?:'button'|'text'
}
withDefaults(defineProps<Props>(), {
   type:'button'
})
const activeKey=shallowRef(currentLocale.value)
watch(()=>currentLocale.value,(newVal)=>{
    activeKey.value=newVal
})
</script>

<template>
    <div v-if="type=='button'" class="p-4 bg-white rounded-md gap-4 flex flex-wrap">
        <div @click="activeKey=item.value" :class="[activeKey==item.value?'bg-blue-500 text-white rounded-md':'']" v-for="item in langList" :key="item.value">
            {{ item.label }}
        </div>
    </div>
    <div v-else>
       <span>当前配置语言：</span><span class="font-bold">{{ currentLanguage?.label }}</span>
    </div>

</template>