<script setup lang="ts">
    import {useUserStore} from '@/store/userStore'
    const userStore=useUserStore()

    onMounted(()=>{
         userStore.getCurrentUserInfo()
    })
</script>
<template>
   <t-layout></t-layout>
</template>