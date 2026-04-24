
<script lang="ts" setup>
import { computed,watch, ref,shallowReactive, shallowRef,customRef, onMounted} from 'vue';
import { Message, MessagePlugin, type UploadFile, type UploadProps } from 'tdesign-vue-next';
import { checkDimensions, getImageDimensions } from './util';
type CheckImageOptions={
  width?:number
  height?:number
  size?:number
  type?:string
  controller?:string
}
type ImageInfo={
  width:number
  height:number
  type:string
}
type Props={
  disabled?:boolean
  combo?:any[]
  loadCheckImageConfig?:CheckImageOptions
  limit?:{
    type?:'before'|'after'
    width?:number,
    height?:number,
    size?:number
  },
  resize?:any[]
  tips?:string
 // accept?:string
  extension?:string[]
  subtitle?:string
  skipLoadCheck?:boolean
}

const props=withDefaults(defineProps<Props>(),{
  limit:()=>({}), // mb
  disabled:false,
  resize:()=>[],
//  accept:'.jpg,.png,.gif,.svg',
  extension:()=>['png','jpg','jpeg','gif','svg'],
  subtitle:'支持jpg、png、gif、svg格式',
  tip:''
 // skipLoadCheck:false
})
const limit = computed(() => {
    return {
        size: 2,
        type: 'after',
        ...(props.limit || {}),
    }
})
const imageUrl=defineModel<string>()
const files=shallowRef<UploadFile[]>([])
const fileName=computed(()=>{
  return typeof imageUrl.value==='string'?imageUrl.value.split(/\\|\//).pop()||'':''
})
const state=shallowReactive({
  thumbnailUrl:'',
  showPreview:false,
  showProgress:false,
  progress:0,
  error:'',
  loadCheckImageError:''
})
const isUndef=(val:any)=>{
  return val===undefined||val===null||val===''
}
const showImage=computed(()=>{
  return !isUndef(imageUrl.value)
})
const showUpload=computed(()=>{
  const url=imageUrl.value
  const showProgress=state.showProgress
  return !showProgress&&isUndef(url)
})


let lastCheckImage:any=null
const checkImageDimensions =  async (file: File | string) => {
    if(limit.value.type!=='after'||lastCheckImage===file||!(limit.value.width||limit.value.height)){
        return
    }
    try {
        state.error=''
        if(!file){
            return
        }
        lastCheckImage=file
        const { width, height } = await getImageDimensions(file)
        const result=checkDimensions(limit.value,{width,height})
        if(!result.valid){
            state.error='图片尺寸不符合规范，请重新上传'
        }
    } catch (err) {
          state.error='图片加载失败'
          lastCheckImage=null
    }
}

// res.url 图片地址；res.uploadTime 文件上传时间；res.error 上传失败的原因
const formatResponse:UploadProps['formatResponse']= (res) => {
  console.log('formatResponse',res)
  // 响应结果添加上传时间字段，用于 UI 显示
  if(res?.code!==0){
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
const accept=computed(()=>{
  return props.extension.map(v=>'.'+v).join(',')
})
const handleSuccess:UploadProps['onSuccess']=(ctx)=>{
 // imageUrl.value=ctx.response.url
  setImageUrl(ctx.response.url)
  state.showProgress=false
  state.progress=0
  console.log('handleSuccess',ctx)
}
const handleFail:UploadProps['onFail']=(ctx)=>{
  console.log('handleFail',ctx)
  setImageUrl('')
  state.thumbnailUrl=''
  state.error=ctx?.response?.error||'上传失败'
  state.showProgress=false
  state.progress=0
}
const handleProgress:UploadProps['onProgress']=(ctx)=>{
  console.log('handleProgress',ctx)
  state.progress=ctx.percent
}
const handleChange:UploadProps['onChange']=(values,ctx)=>{
  console.log('handleChange',values)
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
   state.error=''
   return new Promise(async (resolve,reject)=>{
      const fileSize=file.size/1024/1024 // mb
      const fileName=file.name,type=file.type,ext=fileName.split('.').pop()?.toLowerCase()
      let msg=''
      // 检查file.type 是否在extension中
     // console.log('fff',file.type)
      if(props.skipLoadCheck&&!props.extension?.some(d=>ext===d.toLowerCase())){
         msg+=`/格式`
      }
      if(fileSize>limit.value.size){
        msg+=`/文件大小`
      //  MessagePlugin.error(`文件大小应小于${props.limit.size}MB`)
       // resolve(false)
       // return 
      }
      const img=await loadImage(await fileToBase64(file.raw) as string) as HTMLImageElement
      const width=limit.value.width
      const height=limit.value.height
      if(limit.value.type==='before'&&Number.isFinite(width)&&Number.isFinite(height)&&(img.naturalWidth!==width||img.naturalHeight!==height)){
        msg+=`/尺寸`
      }
      if(msg!==''){
        state.error=`图片${msg.slice(1)}不符合规范，请重新上传`
        resolve(false)
        return
      }
     // file.thumbnailUrl=img.src
      state.thumbnailUrl=img.src
      state.showProgress=true
      resolve(true)
   })
}
const handleDelete=()=>{
  if(props.disabled){
    return
  }
  setImageUrl('')
  state.thumbnailUrl=''
  state.error=''
  state.loadCheckImageError=''
  state.showProgress=false
  
 // files.value=[]
}

const checkImage=(options:CheckImageOptions,imageInfo:ImageInfo)=>{
  let msg=''
  if(typeof options.type==='string'&&options.type!==imageInfo.type){
    msg+='/格式'
  }
  if(Number.isFinite(options.width)&&options.width!==0&&(options.width!==imageInfo.width||options.height!==imageInfo.height)){
    msg+='/尺寸'
  }
  if(msg.length>0){
    msg=`图片${msg.slice(1)}不符合规范，请重新上传`
  }
  return msg;
}

const checkImageDom=(img:HTMLImageElement,options:CheckImageOptions)=>{
  const imageInfo={
    width:img.naturalWidth,
    height:img.naturalHeight,
    type:img.src.split('.').pop()?.toLowerCase()||''
  }
  return checkImage(options,imageInfo)
}
const handleCheckImage=({e}:any)=>{
  const img=e.target as HTMLImageElement
  if(props.skipLoadCheck||state.error.length>0){
    return
  }
  let msg=checkImageDom(img,props.loadCheckImageConfig)
  if(msg.length>0){
    state.error=msg
    return
  }
}

let isManualUpdate=false
const setImageUrl=(url:string)=>{
  isManualUpdate=true;
  imageUrl.value=url
  checkImageDimensions(url)
}

onMounted(()=>{
  checkImageDimensions(imageUrl.value)
})
const headers=customRef((track,trigger)=>{
   return {
    get:()=>{
      console.log('get headers')
      return {
        'custom-userId':Date.now().toString()
      }
    },
    set:()=>{
      
    }
   }
})
</script>

<template>
    <div class="upload-wrap flex flex-col">
      <t-upload 
      v-if="showUpload"
      :disabled="disabled"
        :allow-upload-duplicate-file="true"
        class="upload w-[300px] h-[225px]"
        :auto-upload="true"
        :beforeUpload="beforeUpload"
        :accept="accept"
        :use-mock-progress="false"
        :headers="headers"
        @change="handleChange"
        @progress="handleProgress"
        @success="handleSuccess"
        @fail="handleFail"
        theme="custom"
        :format-response="formatResponse"
        draggable
        action="/api/upload2"
      >
      <template #dragContent="{dragActive,files}">
        <div class="upload-drop border-dashed hover:border-blue-500 flex-1 flex flex-col items-center justify-center">
            <t-icon name="upload" size="40" class="text-blue-500"></t-icon>
            <p class="text-lg"><slot name="title">{{ dragActive?'释放文件上传':'点击或将文件拖拽到这里上传' }}</slot></p>
            <p class="text-sm"><slot name="subtitle">{{ subtitle}}</slot></p>
        </div>
      </template>
      </t-upload>
      <div class="w-[300px] h-[225px] relative group" v-if="!showUpload">
        <div v-if="state.showProgress" class="border border-gray-300 bg-gray-200 rounded-xs absolute top-0 w-full h-full z-10 flex flex-col justify-center items-center" >
          <!-- <t-progress theme="circle"  color="#00ff00" :percentage="state.progress" :laebl="false"></t-progress> -->
          <t-loading />
          <div class="mt-4">上传中{{state.progress}}%</div>
        </div>
         <template v-if="showImage">
          <t-image   class="w-full h-full" :src="imageUrl||state.thumbnailUrl"></t-image>
         <t-image-viewer  @close="state.showPreview=false" :images="[imageUrl]" :visible="state.showPreview"></t-image-viewer>
         <div  class="absolute inset-0 z-2 bg-[rgba(0,0,0,0.5)]  opacity-0 flex flex-col group-hover:opacity-100 duration-300 transition-all items-center justify-center">
            <div class="flex justify-center text-white gap-4">
              <t-icon name="browse" size="20" class="cursor-pointer" @click="state.showPreview=true"></t-icon>     
              <t-icon name="delete" size="20"  :class="[disabled?'text-gray-400 cursor-not-allowed':'cursor-pointer']" :disabled="disabled" @click="handleDelete"></t-icon>
      
            </div>
            <div class="text-white mt-4">{{ fileName }}</div>
         </div>
         </template>
      </div>
      <div class="text-gray-500 text-xs mt-1" v-if="tips!==''||$slots.tips">
        <slot name="tips">{{tips}}</slot>
      </div>
      <div class="text-red-500 text-xs mt-1" v-if="state.error!==''">
        {{ state.error }}
      </div>
        <div class="text-red-500 text-xs mt-1" v-if="state.loadCheckImageError!==''">
        {{ state.loadCheckImageError }}
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