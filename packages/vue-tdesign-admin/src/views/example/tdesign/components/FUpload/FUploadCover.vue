<script setup lang="ts">
import { MessagePlugin, type TdUploadProps,Upload } from 'tdesign-vue-next';
import { computed } from 'vue';


type Props = {
    extensions?:string[]
    maxSize?:number
}
const props=withDefaults(defineProps<Props>(), {
    description:'请上传图片文件',
    extensions:()=>['png','jpg','jpeg','gif','svg'],
    maxSize:1024*1024*2,
})
const accept=computed(()=>props.extensions.map(name=>`.${name}`).join(','))
const handleBeforeUpload:TdUploadProps['beforeUpload']=(file)=>{
    console.log('file',file)
    const ext=file.name.split('.').pop()?.toLowerCase()
    if(!props.extensions.includes(ext)){
        MessagePlugin.error(`请上传${props.extensions.join('、')}格式的文件`)
        return false
    }
    return true
}
const handleSuccess:TdUploadProps['success']=(ctx)=>{
    console.log('handleSuccess',ctx)

}
</script>

<template>
    <t-upload v-bind="$attrs" @success="handleSuccess"  draggable @before-upload="handleBeforeUpload" :accept="accept" theme="custom" class="upload" action="/api/upload">
        <template #dragContent>
            <slot>
                <div class="flex items-center justify-start flex-col w-[300px] h-[225px]">
                    <div class="mt-8"><t-icon class="text-blue-500" name="upload" size="48"></t-icon></div>
                    <div class="mt-8 text-[16px] text-black">
                        <slot name="subtitle">点击或将文件拖拽到这里上传</slot>
                    </div>
                    <div class="mt-2 text-[14px] text-gray-500">
                            <slot name="subtitle">支持扩展名：JPG、PNG、GIF、SVG</slot>
                    </div>
                    <div class="mt-2 text-[12px] text-gray-500">
                        <slot name="description">图片上传格式：PNG</slot>
                    </div>
                </div>
            </slot>
        </template>
    </t-upload>
</template>
<style scoped>
    .upload :deep(.t-upload__dragger) {
        height:auto;
        width: auto;
        padding: 0;
    }
</style>