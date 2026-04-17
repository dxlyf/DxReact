<script lang="ts" setup>
import { defineComponent, ref, watch, toRefs, computed, useModel, withDirectives, toRaw, shallowRef, useAttrs, getCurrentInstance, shallowReactive } from 'vue'
import type { TdUploadProps, UploadChangeContext, UploadFile, UploadInstanceFunctions } from 'tdesign-vue-next'
import { } from 'tdesign-vue-next/'
import UploadImageCard from 'tdesign-vue-next/es/upload/components/image-card'
import ImageDraggableView from './ImageDraggableView.vue'
import { ParamParser } from 'vue-router/dist/experimental/index.mjs'

type Props = {
    disabled?: boolean // 是否禁用上传
    theme?: 'custom' | 'file' | 'file-input' | 'file-flow' | 'image' | 'image-flow'
    max?: number // 最大上传数量
    multiple?: boolean // 是否支持多选
    accept?: string // 接受的文件类型
    action?: string // 上传地址
    autoUpload?: boolean // 是否自动上传
    draggable?: boolean // 是否支持拖拽上传
    skipLoadCheck?: boolean // 是否跳过文件加载检查
    extension?: string[] // 接受的文件扩展名
    showImageFileName?: boolean // 是否显示图片文件名
    limit?:{
        size?:number // 最大文件大小（MB）
        width?:number // 最大宽度（px）
        height?:number // 最大高度（px）
    }
}

const attrs = useAttrs()
const props = withDefaults(defineProps<Props>(), {
    theme: 'image',
    max: 0,
    autoUpload: true,
    multiple: false,
    draggable: false,
    showImageFileName: false,
    disabled: false,
    skipLoadCheck: true,
    extension:()=> ['jpg', 'jpeg', 'png', 'gif'],
    accept: '.jpg,.jpeg,.png,.gif',
    action: '/api/upload2',
    limit:()=>({size:10}),
})
const model = defineModel<string | string[]>({})
const modelRawFile = defineModel<File | File[]>('rawfile')
const isMultipleFiles = computed(() => props.multiple)
const emit=defineEmits<{
    change:[files:UploadFile[],ctx:UploadChangeContext]
    success:Parameters<TdUploadProps['onSuccess']>
    fail:Parameters<TdUploadProps['onFail']>
    remove:Parameters<TdUploadProps['onRemove']>
}>()
const state=shallowReactive({
    error:''
})
const isEmptyValue = (val: any) => {
    return val === '' || val === null || val === undefined
}
//   model.value='/uploads/aaa.jpg'

// let isManualUpdate=false
// const manualUpdate = (url:string) => {
//   isManualUpdate = true
//   model.value = url

//   // anotherRef 不会更新
// }
const setModel = (val: UploadFile[]) => {
    isManualUpdate = true
    if (isMultipleFiles.value) {
        model.value = Array.isArray(val) ? val.map(item => {
            return item.url
        }) : []
        if (!props.autoUpload) {
            modelRawFile.value = val.map(item => {
                return item.raw
            })
        }
    } else {
        model.value = val[0]?.url || ''
        if (!props.autoUpload) {
            modelRawFile.value = val[0]?.raw || null
        }
    }
}
const setFilesFromUrl = (urls: string | string[]) => {
    if (Array.isArray(urls)) {
        files.value = urls.map(url => {
            return {
                url: url,
                name: getFileName(url)
            }
        })
    } else if (!isEmptyValue(urls)) {
        files.value = [{ url: urls, name: getFileName(urls) }]
    } else {
        files.value = []
    }
}
const getFileName = (url: string) => {
    return url.split('/').pop() || ''
}
const files = shallowRef<UploadFile[]>([])
const displayFiles=shallowRef<UploadFile[]>([])
let isManualUpdate = false
watch(model, (val, oldValue, onCleanup) => {
    if (isManualUpdate) {
        isManualUpdate = false
        return
    }
    setFilesFromUrl(val)
}, { immediate: true })

const handleChange: TdUploadProps['onChange'] = (values, ctx) => {
    console.log('onChange', values, ctx)
    console.log('onChange:files', values[0]?.url)
    files.value = values
    //setModel(values.filter(item=>item.status!=='progress'&&item.status!=='fail'))
   
    setModel(values)
    if(props.draggable){
        const needRemoveFiles=new Set(values.filter(item=>item.raw).map(item=>item.raw))
        displayFiles.value=displayFiles.value.filter(item=>!needRemoveFiles.has(item.raw))
    }
    emit('change',values,ctx)
}
const handleRemove: TdUploadProps['onRemove'] = (ctx) => {
    console.log('onRemove', ctx,toRaw(files.value))
    emit('remove',ctx)
}

const formatRespose: TdUploadProps['formatResponse'] = (res, ctx) => {
    if(Math.random()>0.5){
        return {
            url: '/uploads/aaa.jpg',
            // error:'上传失败',
            status: 'success'
        }
    }
    return {error:'上传失败',status:'fail'}

}
const handleSuccess: TdUploadProps['onSuccess'] = (ctx) => {
    console.log('onSuccess', ctx)
    emit('success',ctx)

}
const handleFail: TdUploadProps['onFail'] = (ctx) => {
    console.log('onFail', ctx)
    emit('fail',ctx)
}
const beforeAllFilesUpload: TdUploadProps['beforeAllFilesUpload'] = async (values:UploadFile[]) => {
   // console.log('beforeAllFilesUpload', values)
    if(props.draggable){
        displayFiles.value=displayFiles.value.concat(values)
    }
    //files.value=files.value.concat(values)
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
const beforeUpload:TdUploadProps['beforeUpload']=async (file)=>{
   state.error=''
   console.log('beforeUpload',file)
   return new Promise(async (resolve,reject)=>{
      const fileSize=file.size/1024/1024 // mb
      const fileName=file.name,type=file.type,ext=fileName.split('.').pop()?.toLowerCase()
      let msg=''
      // 检查file.type 是否在extension中
     // console.log('fff',file.type)
      if(props.skipLoadCheck&&props.extension?.length>0&&ext&&!props.extension?.some(d=>ext===d.toLowerCase())){
         msg+=`/格式`
      }
      if(fileSize>props.limit.size){
        msg+=`/文件大小`
      //  MessagePlugin.error(`文件大小应小于${props.limit.size}MB`)
       // resolve(false)
       // return 
      }
      const img=await loadImage(await fileToBase64(file.raw) as string) as HTMLImageElement
      const width=props.limit.width
      const height=props.limit.height
      if(props.skipLoadCheck&&Number.isFinite(width)&&Number.isFinite(height)&&(img.naturalWidth!==width||img.naturalHeight!==height)){
        msg+=`/尺寸`
      }
      if(msg!==''){
        state.error=`图片${msg.slice(1)}不符合规范，请重新上传`
        resolve(false)
        return
      }
     // file.thumbnailUrl=img.src
    //  state.thumbnailUrl=img.src
     // state.showProgress=true
      resolve(true)
   })
}
const uploadProps = computed<TdUploadProps>(() => {
    return {
        //    theme?: 'custom' | 'file' | 'file-input' | 'file-flow' | 'image' | 'image-flow';
        theme: props.draggable ? 'custom' : 'image',
        accept: props.extension.map(v=>'.'+v.toLowerCase()).join(','),
        action: props.action,
        autoUpload: props.autoUpload,
        multiple: props.multiple,
        max: props.max,
        draggable: props.draggable,
        showImageFileName: props.showImageFileName,
        disabled: props.disabled,
        formatResponse: formatRespose,
        onSuccess: handleSuccess,
        onFail: handleFail,
        onChange: handleChange,
        onRemove: handleRemove,
        beforeAllFilesUpload:beforeAllFilesUpload,
        beforeUpload:beforeUpload,
        allowUploadDuplicateFile: true,
        ...attrs,
    } as TdUploadProps
})
const allDisplayFiles=computed(()=>{
    return files.value.concat(displayFiles.value)
})
const uploadRef=shallowRef<UploadInstanceFunctions>()
     const current=getCurrentInstance()
const handleRemoveItem=(file:UploadFile)=>{
    console.log('current',current)
    files.value=files.value.filter(item=>item!==file)
}
</script>

<template>
 <div>
       <div class="flex flex-wrap gap-2">
        <ul v-if="props.draggable" class="f-upload-images flex flex-wrap gap-2" @click="(e)=>e.stopPropagation()">
            <li v-for="(file, index) in allDisplayFiles" :key="index"
                class="relative group cursor-pointer size-[110px] p-2 border-dashed border border-[#ddd] box-border rounded-xs bg-[#f3f3f3]">
                <div v-if="file.status == 'progress'" class="flex w-full h-full flex-col justify-center items-center">
                    <t-loading :loading="true" size="medium"></t-loading>
                    <div>{{ file.percent }}%</div>
                </div>
                <div v-if="!['progress', 'fail'].includes(file.status)" class="w-full h-full">
                    <t-image :src="file.url || file.raw" class="w-full h-full max-w-full max-h-full !bg-transparent"
                        fit="contain" />
                    <div class="bg-[rgba(0,0,0,0.4)] rounded-xs absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10 text-white flex items-center"
                        @click="(e) => e.stopPropagation()"">
                     <div class=" flex justify-center gap-2 w-full items-center">
                        <span class="">
                            <t-image-viewer :default-index="index" :images="files.map(file => file.url || file.raw)">
                                <template #trigger="{open}">
                                    <t-icon name="browse" @click="open"></t-icon>
                                </template>
                            </t-image-viewer>
                        </span>
                        <span class="w-[1px] h-4 bg-white"></span>
                        <span>
                            <t-icon name="delete" @click="handleRemoveItem(file)"></t-icon>
                        </span>
                    </div>
                </div>
    </div>


    </li>
    </ul>
    <t-upload ref="uploadRef" :files="files" v-bind="uploadProps" :class="[props.draggable ? 'size-[110px] f-upload-draggable' : '']">
        <!-- <template v-for="(name,slot) in $slots" :key="name" #[name]="slotData">
           <component :is="slot" v-bind="slotData||{}"></component>
        </template> -->
        <template v-if="uploadProps.theme == 'custom'" #dragContent="{ dragActive, files }">
            <div class="flex flex-col items-center justify-center">
                <div class="mb-2"><t-icon name="add" size="24" style="color:rgba(0,0,0,0.4)"></t-icon></div>
                <p class="text-[rgba(0,0,0,0.4)] text-xs">{{ dragActive ? '松开上传' : '点击或拖拽上传' }}</p>
            </div>
        </template>
    </t-upload>
 
    </div>
       <div class="text-red-600 text-xs" v-if="state.error!==''">{{state.error}}</div>
 </div>
</template>
<style>
.f-upload-draggable .t-upload__dragger {
    width: 100%;
    height: 100%;
    padding: 0;
    background-color: #f7f8f9;
}
</style>