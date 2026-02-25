<script setup lang="ts">
import { MessagePlugin, type TdUploadProps, type UploadFile, Upload } from 'tdesign-vue-next';
import { computed, ref, shallowRef, toRaw, watch } from 'vue';


type Props = {
    extensions?: string[]
    maxSize?: number
}
const props = withDefaults(defineProps<Props>(), {
    description: '请上传图片文件',
    extensions: () => ['png', 'jpg', 'jpeg', 'gif', 'svg'],
    maxSize: 1024 * 1024 * 2,
})
const visiblePreviewImage=shallowRef(false)
const files = ref<UploadFile[]>([])
const accept = computed(() => props.extensions.map(name => `.${name}`).join(','))
const handleBeforeUpload: TdUploadProps['beforeUpload'] = (file) => {
    console.log('file', file)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!props.extensions.includes(ext)) {
        MessagePlugin.error(`请上传${props.extensions.join('、')}格式的文件`)
        return false
    }
    return true
}
const handleSuccess: TdUploadProps['onSuccess'] = (ctx) => {

    const url = ctx.file.response?.data?.files?.[0]?.url || ''
    console.log('handleSuccess', ctx, url)

    //ctx.file.url=url
}
const handleFail: TdUploadProps['onFail'] = (ctx) => {
    console.log('handleFail', ctx)
}
const handleValidate: TdUploadProps['onValidate'] = ({ type }) => {
    console.log('handleValidate', type)
}
const formatResponse: TdUploadProps['formatResponse'] = (res) => {
    console.log('formatResponse', res)
    if (res.code !== 0) {
        return {
            status: 'fail',
            error: res?.message || '上传失败',
        }
    }
    return {
        url: res?.data?.files[0]?.url || '',
        status: 'success',
    }
}
const handleDelete=(file:UploadFile)=>{
    console.log('handleDelete',file)
    files.value=[]
}
const handlePreview=(file:UploadFile)=>{
    console.log('handlePreview',file)
    visiblePreviewImage.value=true
}
const showPreview = computed(() => files.value.length > 0)
watch(() => files.value, (newVal, oldVal) => {
    console.log('files', toRaw(newVal))
})
</script>

<template>
 
    <div class="upload-wrapper">
        <t-upload v-if="!showPreview" :formatResponse="formatResponse" :allow-upload-duplicate-file="true"
            :size-limit="{ size: 2, unit: 'MB', message: '文件大小不能超过2MB' }" v-model="files" @validate="handleValidate"
            @fail="handleFail" @success="handleSuccess" draggable @before-upload="handleBeforeUpload" :accept="accept"
            theme="custom" class="upload" action="/api/upload" v-bind="$attrs">
            <template #dragContent="{ dragActive, files, triggerUpload }">
                <slot>
                    <div class="flex items-center justify-start flex-col w-full h-full box-border p-2">
                        <div class="mt-8"><t-icon class="text-blue-500" name="upload" size="48"></t-icon></div>
                        <div class="mt-8 text-[16px] text-black">
                            <slot name="subtitle">{{ dragActive ? '释放上传' : '点击或将文件拖拽到这里上传' }}</slot>
                        </div>
                        <div class="mt-2 text-[14px] text-gray-500">
                            <slot name="subtitle">支持扩展名：JPG、PNG、GIF、SVG</slot>
                        </div>
                        <div class="mt-2 text-[12px] text-gray-500 wrap-break-word whitespace-pre-wrap wrap-break-word">
                            <slot name="description">图片上传格式：PNG,尺寸：200px*200px,大小< 2mbfdasfdsafdasfdasfdsa</slot>
                        </div>
                    </div>
                </slot>
            </template>
            <template #fileListDisplay="{ files }">
                <div class="flex items-center justify-center w-full h-full" v-if="files.length > 0">
                    <img :src="files[0].url" alt="" class="w-full h-full object-cover">
                </div>
            </template>

        </t-upload>
        <div v-else="showPreview" class="upload-preview">
            <t-image overlay-trigger="hover" :src="files[0].url" alt="" class="w-full h-full object-cover">
                <template #overlayContent>
                    <div class="flex items-center justify-center w-full h-full bg-[rgba(0,0,0,0.5)]">
                        <div class="text-white w-full flex justify-center gap-5">
                            <t-icon name="browse" size="24" @click="handlePreview"></t-icon>
                            <t-icon name="delete" size="24" @click="handleDelete"></t-icon>
                        </div>
                    </div>
                </template>
            </t-image>
            <t-image-viewer class="imageviewer" v-if="visiblePreviewImage" :show-overlay="false"  @close="visiblePreviewImage=false" :default-visible="true"  :images="files.map(d=>d.url)"></t-image-viewer>
        </div>

    </div>
</template>
<style scoped>
.upload-wrapper{
    
}
.upload {
    height: 100%;
    width: 100%;
}
.upload :deep(.t-upload__dragger) {
    height: 100%;
    width: 100%;
    padding: 0;
}

.upload-preview {
    height: 100%;
    width: 100%;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.upload-preview :deep(.t-image-viewer__trigger){
    display: none!important;
}
</style>