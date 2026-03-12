<script setup lang="ts">
    import '@/styles/fontAwesome/v4.7/scss/font-awesome.scss'
    import Svg from '@/styles/fontAwesome/v4.7/fonts/fontawesome-webfont.svg?raw'
import { onMounted, shallowRef } from 'vue';
    const icons=shallowRef([])
    onMounted(()=>{
        icons.value=Array.from(document.querySelectorAll('[glyph-name]')).map(el=>el.getAttribute('glyph-name'))
    })
</script>

<template>
   <div> <div v-html="Svg" v-show="false"></div></div>
   <div class="flex gap-2 flex-wrap">
      <div v-for="(name,i) in icons" :key="i" class="flex flex-col justify-center items-center hover:bg-gray-200 p-4">
           <div class="text-[28px]"> <i :class="['fa fa-'+name]"></i></div>
            <span>{{ name }}</span>
      </div>
   </div>
</template>