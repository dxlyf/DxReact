<script  lang="ts" setup>
import {defineComponent, ref, watch,toRefs, computed,useModel,withDirectives, toRaw, shallowRef, useAttrs} from 'vue'
import type {TdUploadProps,UploadFile} from 'tdesign-vue-next'
import {Upload} from 'tdesign-vue-next'

type Props={
    
}

const attrs=useAttrs()
const props=defineProps<Props>()
const model=defineModel<string>({})
    model.value='/uploads/aaa.jpg'
const uploadProps=computed(()=>{
    return {
        ...attrs
    }
})
const formatRespose:TdUploadProps['formatResponse']=(res,ctx)=>{
    return {
        url:'/uploads/aaa.jpg',
     // error:'上传失败',
        status:'fail'
    }
}
const handleSuccess:TdUploadProps['onSuccess']=(ctx)=>{
   // manualUpdate(Math.random().toString(36))
   console.log('handleSuccess')
   manualUpdate(ctx.response.url)

}
const handleFail:TdUploadProps['onFail']=(ctx)=>{
      console.log('handleFail')
   manualUpdate('')
}
let isManualUpdate=false
const manualUpdate = (url:string) => {
  isManualUpdate = true
  model.value = url
  // anotherRef 不会更新
}

const getFileName=(url:string)=>{
    return url.split('/').pop()||''
}
const files=shallowRef([])
watch(model,(val,oldValue,onCleanup)=>{
    if(isManualUpdate){
        isManualUpdate=false
        return
    }
    if(val){
        console.log('model:change')
        files.value=[{url:val,name:getFileName(val)}]
    }
},{immediate:true})
// watch(files,(val)=>{
//     console.log('watch:files',val)
// })
const handleChange:TdUploadProps['onChange']=(values,ctx)=>{
    // isManualUpdate=true
    // files.value=values
    // if(values.length>0){
    //     if(values[0].status==='success'){
    //         model.value=values[0].response.url
    //     }
    // }else{
    //     model.value=''
    // }
    console.log('change',values,ctx.trigger)
}
const handleDel:TdUploadProps['onRemove']=(ctx)=>{
    console.log('remove')
    model.value=''
}
</script>

<template>
       <t-upload v-model="files" @remove="handleDel" @change="handleChange" @fail="handleFail" @success="handleSuccess" v-bind="uploadProps" theme="image" action="/api/upload2" :format-response="formatRespose" >
        <template v-for="(name,slot) in $slots" :key="name" #[name]="slotData">
           <component :is="slot" v-bind="slotData||{}"></component>
        </template>
      </t-upload>
</template>