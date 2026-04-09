<script  lang="ts" setup>
import {defineComponent, ref, watch,toRefs, computed,useModel,withDirectives, toRaw, shallowRef, useAttrs} from 'vue'
import type {TdUploadProps,UploadFile} from 'tdesign-vue-next'
import {Upload} from 'tdesign-vue-next'
import ImageDraggableView from './ImageDraggableView.vue'
type Props={
    theme?: 'custom' | 'file' | 'file-input' | 'file-flow' | 'image' | 'image-flow'
    max?:number // 最大上传数量
    multiple?:boolean // 是否支持多选
    accept?:string // 接受的文件类型
    action?:string // 上传地址
    autoUpload?:boolean // 是否自动上传
    draggable?:boolean // 是否支持拖拽上传
}

const attrs=useAttrs()
const props=withDefaults(defineProps<Props>(),{
    theme:'image',
    max:1,
    autoUpload:false,
    multiple:false,
    draggable:false,
    accept:'.jpg,.jpeg,.png,.gif',
    action:'/api/upload2',
})
const model=defineModel<string|string[]>({})
const modelRawFile=defineModel<File|File[]>( 'rawfile')
const isMultipleFiles=computed(()=>Array.isArray(model.value))

const isEmptyValue=(val:any)=>{
    return val===''||val===null||val===undefined
}
 //   model.value='/uploads/aaa.jpg'

// let isManualUpdate=false
// const manualUpdate = (url:string) => {
//   isManualUpdate = true
//   model.value = url
  
//   // anotherRef 不会更新
// }
const setModel=(val:UploadFile[])=>{
    if(isMultipleFiles.value){
        model.value=Array.isArray(val)?val.map(item=>{
            return item.url
        }):[]
        modelRawFile.value=val.map(item=>{
            return item.raw
        })
    }else{
        model.value=val[0]?.url||''
        modelRawFile.value=val[0]?.raw||null
    }
}
const setFilesFromUrl=(urls:string|string[])=>{
    if(Array.isArray(urls)){
        files.value=urls.map(url=>{
            return {
                url:url,
                name:getFileName(url)
            }
        })
    }else if(!isEmptyValue(urls)){
        files.value=[{url:urls,name:getFileName(urls)}]
    }else{
        files.value=[]
    }
}
const getFileName=(url:string)=>{
    return url.split('/').pop()||''
}
const files=shallowRef<UploadFile[]>([])
let isManualUpdate=false
watch(model,(val,oldValue,onCleanup)=>{
    if(isManualUpdate){
        isManualUpdate=false
        return
    }
    setFilesFromUrl(val)
},{immediate:true})

const handleChange:TdUploadProps['onChange']=(values,ctx)=>{
    console.log('onChange',values,ctx)
    console.log('onChange:files',values[0]?.url)
    files.value=values
    //setModel(values.filter(item=>item.status!=='progress'&&item.status!=='fail'))
    isManualUpdate=true
    setModel(values)
}
const handleRemove:TdUploadProps['onRemove']=(ctx)=>{
    console.log('onRemove',ctx)
}

const formatRespose:TdUploadProps['formatResponse']=(res,ctx)=>{
    return {
        url:'/uploads/aaa.jpg',
       // error:'上传失败',
        status:'success'
    }
}
const handleSuccess:TdUploadProps['onSuccess']=(ctx)=>{
    console.log('onSuccess',ctx)
}
const handleFail:TdUploadProps['onFail']=(ctx)=>{
 console.log('onFail',ctx)
}
const isImageDraggable=computed(()=>props.theme==='image'&&props.draggable)

const uploadProps=computed<TdUploadProps>(()=>{
    return {
        //    theme?: 'custom' | 'file' | 'file-input' | 'file-flow' | 'image' | 'image-flow';
        theme:props.theme,
        accept:props.accept,
        action:props.action,
        autoUpload:props.autoUpload,
        multiple:props.multiple,
        max:props.max,
        draggable:props.draggable,
        showImageFileName:false,
        formatResponse:formatRespose,
        onSuccess:handleSuccess,
        onFail:handleFail,
        onChange:handleChange,
        onRemove:handleRemove,
        allowUploadDuplicateFile:true,
        ...attrs,
    } as TdUploadProps
})
</script>

<template>
       <t-upload :files="files"  v-bind="uploadProps"  >
        <template v-for="(name,slot) in $slots" :key="name" #[name]="slotData">
           <component :is="slot" v-bind="slotData||{}"></component>
        </template>

      </t-upload>
</template>