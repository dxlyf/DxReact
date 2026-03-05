<script setup lang="ts">
import {ref, watch} from 'vue'
import type {TdUploadProps,UploadFile} from 'tdesign-vue-next'
type Props={
    modelValue:string
    action?:string
    accept?:string
    disabled?:boolean
    autoUpload?:boolean
    showImageFileName?:boolean
    uploadAllFilesInOneRequest?:boolean
    sizeLimit?:TdUploadProps['sizeLimit']
    theme?:TdUploadProps['theme']
    allowUploadDulicateFile?:boolean
    tips?:string
    uploadProps?:TdUploadProps
    multiple?:boolean
    max?:number
    locale?:TdUploadProps['locale']
}
const props =withDefaults(defineProps<Props>(),{
    modelValue:null,
    action:'/api/upload2',
    accept:'image/*',
    disabled:false,
    autoUpload:true,
    showImageFileName:true,
    uploadAllFilesInOneRequest:false,
    allowUploadDulicateFile:true,
    multiple:false,
    theme:'image',
    locale:()=>({
        triggerUploadText: {
            image: '请选择图片',
          },
    }),
    uploadProps:()=>({})
})

const imageUrl=defineModel<string>({default:''})
const fileList=ref<UploadFile[]>([])
const handleFail=(e:any)=>{
    console.log('handleFail',e)
}
watch(fileList,(newVal)=>{
  console.log('fileList:change')
})
</script>

<template>
    <div>
     <t-upload
        ref="uploadRef1"
        :size-limit="sizeLimit"
        v-model:files="fileList"
        :action="action"
        :theme="theme"
        :tips="tips"
        :accept="accept"
        :disabled="disabled"
        :allow-upload-duplicate-file="allowUploadDulicateFile"
        :auto-upload="autoUpload"
        :show-image-file-name="showImageFileName"
        :upload-all-files-in-one-request="uploadAllFilesInOneRequest"
        :multiple="multiple"
        :locale="locale"
        @fail="handleFail"
        v-bind="uploadProps"
      >
      </t-upload>
    </div>
</template>