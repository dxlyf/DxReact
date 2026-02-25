<script setup lang="ts">
import type { TdUploadProps } from 'tdesign-vue-next';


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
</script>

<template>
  <t-upload :formatResponse="formatResponse" theme='image-flow' draggable action="/api/upload">
    <t-button>Click to upload</t-button>
  </t-upload>
</template>