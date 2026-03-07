<script  lang="ts">
import {defineComponent, ref, watch,toRefs, computed,useModel,withDirectives, toRaw} from 'vue'
import type {TdUploadProps,UploadFile} from 'tdesign-vue-next'
import {Upload} from 'tdesign-vue-next'

type Props={
    
}&TdUploadProps
export default defineComponent({
    name:'UploadImage',
    props:{
        ...(Upload.props),
        modelValue: {
            type: String,
            default:'',
        },
    },
    setup(props:Props, ctx) {
        const uploadProps=computed(()=>{
            const {beforeUpload,modelValue,theme,...restProps}=props
            console.log('theme',toRaw(props))
            return {
                ...restProps,
                theme:'image',
                accept:'image/*',
                action:'/api/upload2',
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
                    ctx.emit('update:modelValue',response.url)
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
      </t-upload>
</template>