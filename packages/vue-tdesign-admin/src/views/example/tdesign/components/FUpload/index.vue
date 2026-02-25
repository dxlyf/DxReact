<script setup lang="ts">
import { Message, MessagePlugin, type TdUploadProps,type UploadFile } from 'tdesign-vue-next';
import { shallowRef } from 'vue';

export type FUploadProps={
  // modelValue?:UploadFile[]
   size?:number
   unit?:['B', 'KB', 'MB', 'GB'][number]
}
const files=defineModel<UploadFile[]>({default:()=>[]})
const props=withDefaults(defineProps<FUploadProps>(),{
    size:2,
    unit:'MB',
})
const visibleImageViewer=shallowRef(false)
const formatResponse:TdUploadProps['formatResponse']=(res,ctx)=>{
    console.log('formatResponse',res,ctx)
    if(res.code!==0){
        return {
            status:'fail',
            error:res?.message||'上传失败',
        }
    }
    return {
        url:res?.data?.files[0]?.url||'',
        status:'success',
    }
}
const handleSuccess:TdUploadProps['onSuccess']=(ctx)=>{
    files.value=[...ctx.fileList]
}
const handleFail:TdUploadProps['onFail']=(ctx)=>{
    console.log('handleFail',ctx)
    MessagePlugin.error(ctx.response?.message||'上传失败')
}
const handleProgress:TdUploadProps['onProgress']=(ctx)=>{
    console.log('handleProgress',ctx)
}
const formatFile:TdUploadProps['format']=(file)=>{
  console.log('formatFile',file)
  
    return file
}
const handlePreview=(file:UploadFile)=>{
   visibleImageViewer.value=true
}
const handleDelete=(file:UploadFile)=>{
  files.value=[]
}
</script>

<template>
<div class="upload-wrapper">
    <t-upload v-if="files.length<=0" :allow-upload-duplicate-file="true" class="upload" :sizeLimit="{size:size,unit:unit }" :format="formatFile" @progress="handleProgress" @success="handleSuccess" @fail="handleFail" :formatResponse="formatResponse" theme='custom' draggable action="/api/upload">
         <template #trigger="{dragActive}">
          <div class="flex flex-col w-full h-full items-center justify-center">
              <t-icon name="upload" size="48" class=" text-blue-500"></t-icon>
              <div class="text-base text-black">{{ dragActive?'释放上传':'点击上传或拖拽文件到这里' }}</div>
              <div class="text-sm text-[rgba(0,0,0,0.6)]">支持:PNG、JPG、JPEG、GIF、SVG</div>
              <div class="text-xs text-[rgba(0,0,0,0.4)]">图片格式为:png,尺寸：290*290，大小<2mb</div>
          </div>
         </template>
    </t-upload>
    <div v-else class="w-full h-full relative">
      <t-image :src="files[0].url" class="w-full h-full" overlay-trigger="hover">
        <template #overlayContent>
          <div class="flex flex-col w-full h-full bg-[rgba(0,0,0,0.5)]" v-if="files[0].status!='progress'">
              <div class="flex flex-1 items-center justify-center text-white gap-6">
                 <t-icon @click="handlePreview" class="cursor-pointer" name="browse" size="24"></t-icon>
                  <t-icon @click="handleDelete"  class="cursor-pointer" name="delete" size="24"></t-icon>
              </div>
          </div>
        </template>
      </t-image>
      <t-progress :label="false" theme="line" class="progress" :percentage="files[0].percent" v-if="files[0].status=='progress'" />
      <t-image-viewer  @close="visibleImageViewer=false" v-if="visibleImageViewer" default-visible :images="files.map(d=>d.url)"></t-image-viewer>
    </div>
</div>
</template>
<style scoped>
.upload-wrapper{
     width: 300px;
   height: 200px;
}
.upload-wrapper .upload{
  width: 100%;
  height: 100%;
}
.upload-wrapper :deep(.t-upload__dragger){
  width: 100%;
  height: 100%;
}
.upload-wrapper :deep(.t-image-viewer__trigger){
 display: none!important;
}
.progress{
  position: absolute;
  left:50%;
  transform: translateX(-50%);
  bottom:0;
  width: 100%;
  z-index: 1000;
  --td-radius-round:0px;
}
.progress :deep(.t-progress__info){
  color: #fff!important;
  display: none!important;
}
</style>