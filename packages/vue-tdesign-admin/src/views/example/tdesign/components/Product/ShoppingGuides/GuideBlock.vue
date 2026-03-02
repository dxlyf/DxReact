<script setup lang="ts">
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
 type FormData={
    guide_title:string
 }
 const fromData=defineModel<FormData>({default:{}})
 
</script>
<template>
    <t-form-item label="指南标题" name="guide_title">
        <UploadCover v-model="fromData.guide_title"></UploadCover>
    </t-form-item>

</template>