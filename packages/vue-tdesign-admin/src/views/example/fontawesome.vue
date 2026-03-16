<script setup lang="ts">
import '@/styles/fontAwesome/v4.7/css/font-awesome.css'
    import text from  '@/styles/fontAwesome/v4.7/css/font-awesome.css?raw'
    // import Svg from '@/styles/fontAwesome/v4.7/fonts/fontaweso?raw'
import { onMounted,computed, shallowRef } from 'vue';
    const icons=shallowRef([])
    const reg=/fa-([a-zA-Z0-9-]+)(?=:.*)/gm
    const iconList=new Set()
    text.replace(reg,(match,name)=>{
        iconList.add(name)
    })
    icons.value=Array.from(iconList)

    const searchText=shallowRef('')
    const filteredIcons=computed(()=>{
        if(searchText.value){
            return icons.value.filter((name)=>name.indexOf(searchText.value)>-1)
        }
        return icons.value
    })
</script>

<template>

   <div class="flex gap-2 flex-wrap">
    <t-input v-model="searchText" placeholder="Search icon"></t-input>
      <div v-for="(name,i) in filteredIcons" :key="i" class="flex flex-col justify-center items-center hover:bg-gray-200 p-4">
           <div class="text-[28px]"> <i :class="['fa fa-'+name]" class="size-4 d-block"></i></div>
            <span>{{ name }}</span>
      </div>
   </div>
</template>