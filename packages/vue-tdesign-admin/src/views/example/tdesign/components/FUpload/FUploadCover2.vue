
<script lang="ts" setup>
import { computed, ref,shallowReactive} from 'vue';
import type { UploadProps } from 'tdesign-vue-next';

type Props={
  disabled?:boolean,
  limit?:{
    width?:number,
    height?:number,
    size:number
  },
  resize?:any[]
  tips?:string
  accept?:string
  extension?:string[]
}
const props=withDefaults(defineProps<Props>(),{
  limit:()=>({
   // width:200,
   // height:200,
    size:2
  }), // mb
  disabled:false,
  resize:()=>[],
  accept:'.jpg,.png,.gif,.svg',
  extension:()=>['png','jpg'],
  tips:'上传图片格式：PNG，尺寸：200*200(三倍图)，大小：≤2MB'

})

const imageUrl=defineModel<string>()

const state=shallowReactive({
  thumbnailUrl:'',
  showPreview:false,
  showProgress:false,
  progress:0,
  error:''
})
const isUndef=(val:any)=>{
  return val===undefined||val===null||val===''
}
const showImage=computed(()=>{
  return (!isUndef(imageUrl.value)||!isUndef(state.thumbnailUrl))
})
// res.url 图片地址；res.uploadTime 文件上传时间；res.error 上传失败的原因
const formatResponse:UploadProps['formatResponse']= (res) => {
  // 响应结果添加上传时间字段，用于 UI 显示
  if(res.code!==0){
    return {
      status:'fail',
      error:res?.message||'上传失败',
    }
  }
  return {
    url2:'fffffffffffffffffff',
    url:res?.data?.files[0]?.url||'',
    status:'success',
  }
}

const handleSuccess:UploadProps['onSuccess']=(ctx)=>{
  imageUrl.value=ctx.response.url
  state.showProgress=false
  state.progress=0
  console.log('handleSuccess',ctx)
}
const handleFail:UploadProps['onFail']=(ctx)=>{
  console.log('handleFail',ctx)
  imageUrl.value=''
  state.showProgress=false
  state.progress=0
}
const handleProgress:UploadProps['onProgress']=(ctx)=>{
  console.log('handleProgress',ctx)
  state.progress=ctx.percent
}
const fileToBase64=(file:File|Blob)=>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.readAsDataURL(file)
    reader.onload=()=>{
      resolve(reader.result)
    }
    reader.onerror=()=>{
      reject(new Error('文件读取失败'))
    }
  })
}
const loadImage=(url:string)=>{
  return new Promise((resolve,reject)=>{
    const img=new Image()
    img.src=url
    img.onload=()=>{
      resolve(img)
    }
    img.onerror=()=>{
      reject(new Error('图片加载失败'))
    }
  })
}
const beforeUpload:UploadProps['beforeUpload']=async (file)=>{

   return new Promise(async (resolve,reject)=>{
      const fileSize=file.size/1024/1024 // mb
      const fileName=file.name,type=file.type,ext=fileName.split('.').pop()?.toLowerCase()
      let msg=''
      if(!props.extension?.some(d=>ext===d.toLowerCase())){
        msg+=`/格式`
      }
      if(fileSize>props.limit.size){
        msg+=`/大小`
      }
      const img=await loadImage(await fileToBase64(file.raw) as string) as HTMLImageElement
      const width=props.limit.width
      const height=props.limit.height
      if(Number.isFinite(width)&&Number.isFinite(height)&&(img.naturalWidth!==width||img.naturalHeight!==height)){
        msg+=`/尺寸`
      }
      if(msg!==''){
        state.error=`图片${msg.slice(1)}不符合规范，请重新上传`
        resolve(false)
        return
      }
      file.thumbnailUrl=img.src
      state.thumbnailUrl=img.src
      state.showProgress=true
      resolve(true)
   })
}
const handleDelete=()=>{
  imageUrl.value=''
  state.thumbnailUrl=''
}
</script>

<template>
    <div class="upload-wrap flex flex-col">
      <t-upload 
      v-if="!showImage"
      :disabled="disabled"
        :allow-upload-duplicate-file="true"
        class="upload w-[300px] h-[225px]"
        :auto-upload="true"
        :beforeUpload="beforeUpload"
        :accept="accept"
        @progress="handleProgress"
        @success="handleSuccess"
        @fail="handleFail"
        theme="custom"
        :format-response="formatResponse"
        draggable
        action="/api/upload"
      >
      <template #dragContent="{dragActive,files}">
        <div class="upload-drop border-dashed hover:border-blue-500 flex-1 flex flex-col items-center justify-center">
            <t-icon name="upload" size="40" class="text-blue-500"></t-icon>
            <p class="text-lg"><slot name="title">{{ dragActive?'释放文件上传':'点击或将文件拖拽到这里上传' }}</slot></p>
            <p class="text-sm"><slot name="subtitle">支持扩展名：{{ extension.map(d=>d.toUpperCase()).join('、') }}</slot></p>
        </div>
      </template>
      </t-upload>
      <div class="w-[300px] h-[225px] relative group" v-else>
        <div class="absolute top-0 w-full z-10" v-if="state.showProgress">
          <t-progress class="w-full [&_.t-progress\_\_bar]:!rounded-none [&_.t-progress\_\_info]:!hidden" color="#00ff00" :percentage="state.progress" :label="false"></t-progress>
        </div>
         <t-image class="w-full h-full" :src="imageUrl||state.thumbnailUrl"></t-image>
         <t-image-viewer @close="state.showPreview=false" :images="[imageUrl]" :visible="state.showPreview"></t-image-viewer>
         <div v-if="imageUrl!==''" class="absolute inset-0 z-1 bg-[rgba(0,0,0,0.5)]  opacity-0 flex group-hover:opacity-100 duration-300 transition-all items-center justify-center">
            <div class="flex justify-center text-white gap-4">
              <t-icon name="browse" size="20" class="cursor-pointer" @click="state.showPreview=true"></t-icon>     
              <t-icon name="delete" size="20"  :class="[disabled?'text-gray-400 cursor-not-allowed':'cursor-pointer']" :disabled="disabled" @click="disabled?null:handleDelete"></t-icon>
              
            </div>
         </div>
      </div>
      <div class="text-gray-500 text-xs mt-1" v-if="tips!==''">
        {{ tips }}
      </div>
      <div class="text-red-500 text-xs mt-1" v-if="state.error!==''">
        {{ state.error }}
      </div>
    </div>
</template>
<style scoped>
.upload-wrap :deep(.t-upload__dragger) {
    height: 100%;
    width: 100%;
    padding: 0;
}

.upload-drop{
  height: 100%;
  width: 100%;
  padding: 0;
}
.upload-wrap :deep(.t-image-viewer__trigger){
  display: none!important;
}
</style>