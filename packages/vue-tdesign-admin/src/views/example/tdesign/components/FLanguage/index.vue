<script setup lang="ts">
import {useLang} from '@/hooks/useLang'
import { shallowRef } from 'vue';
const [langList,{currentLanguage,currentLocale}]=useLang()
type Props={
  type?:'button'|'text'
}
withDefaults(defineProps<Props>(), {
   type:'button'
})
const activeKey=shallowRef(currentLocale.value)

</script>

<template>
    <div v-if="type=='button'" class="p-4 bg-white rounded-md gap-4 flex flex-wrap">
        <div @click="activeKey=item.value" :class="[activeKey==item.value?'bg-blue-600 text-white border-transparent':'bg-gray-100 hover:text-white hover:bg-blue-500']" class="cursor-pointer px-3 py-1 border border-gray-300  rounded-md" v-for="item in langList" :key="item.value">
            {{ item.label }}
        </div>
    </div>

</template>