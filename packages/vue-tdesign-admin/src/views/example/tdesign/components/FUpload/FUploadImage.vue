<script  lang="ts">
import {defineComponent, ref, watch,toRefs, computed,useModel,withDirectives, toRaw, shallowRef} from 'vue'
import type {TdUploadProps,UploadFile} from 'tdesign-vue-next'
import {Upload} from 'tdesign-vue-next'

type Props={
    vv:string
}&TdUploadProps
export default defineComponent({
    name:'UploadImage',
    props:{
        ...(Upload.props),
        modelValue: {
            type: String,
            default:'',
        },
        vv:{
            type:String
        }
    },
    setup(props:Props, ctx) {
        const files=shallowRef<UploadFile[]>([])
        const uploadProps=computed(()=>{
            const {beforeUpload,modelValue,theme,vv,...restProps}=props
            return {
                ...restProps,
                value:files,
                theme:'image',
                accept:'image/*',
                action:'/api/upload2',
                onChange:(values)=>{
                   
                    files.value=value
                   // ctx.emit('update:modelValue',value[0].url)
                },
                formatResponse(){
                    return {
                        status:'success',
                        url:'/uploads/aaa.jpg',
                    }
                },
                beforeUpload:(file:UploadFile)=>{

                    if(beforeUpload){
                        return beforeUpload?.(file)
                    }
                    return true
                },
                onSuccess({file,response}){
                     //ctx.emit('update:modelValue',value[0].url)
                   // ctx.emit('update:modelValue',response.url)
                }
            } as TdUploadProps
        })
        return {
            uploadProps,
        }
    }
})
</script>

<template>
       <t-upload v-bind="uploadProps" >
        <template v-for="(name,slot) in $slots" :key="name" #[name]="slotData">
           <component :is="slot" v-bind="slotData||{}"></component>
        </template>
      </t-upload>
</template>