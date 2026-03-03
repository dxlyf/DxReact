<script setup lang="ts">
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
type FormData = {
    title: string
    cover: string
    highlight: string
}
const formData = defineModel<FormData>({ default: {} })

</script>
<template>
    <t-form-item label="Title" name="guide_title">
        <UploadCover v-model="formData.title"></UploadCover>
    </t-form-item>
    <t-form-item label="Cover" name="guide_cover">
        <UploadCover v-model="formData.cover"></UploadCover>
    </t-form-item>
    <t-form-item label="Highlight">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-[1fr_200px] gap-x-2 w-full">
                <div>
                    <t-form-item :label-width="0">
                        <t-input v-model="formData.highlight">
                        </t-input>
                    </t-form-item>
                </div>
                <div><t-button theme="primary">Add Highlight</t-button></div>
            </div>
            <div class="grid grid-cols-[1fr_200px] gap-2 mt-2">
                <div><t-input>
                    </t-input></div>
            </div>
        </div>
    </t-form-item>
</template>