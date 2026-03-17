<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import FField from './components/FForm/FField.vue'
import FFormFeild from './components/FForm/FFormFeild.vue'
import {shallowRef,onMounted, reactive, toRaw,ref, watch,onBeforeMount, nextTick,queuePostFlushCb} from 'vue'

const formRef=shallowRef()

onMounted(()=>{
    console.log('formRef',formRef.value.fieldRef.submit)
})
const handleSubmit=()=>{
    console.log('formData',toRaw(formData))
    v.value=true
}
const formData=reactive({
    name:'',
    sex:0
})
const rules={
    name:[{required:true,message:'请输入名称'}]
}
const switchValue=ref('1')
watch(switchValue,(val)=>{
    console.log('switchValue',val)
})
const v=ref(false)

onBeforeMount(()=>{
    console.log('onBeforeMount')
})
const route=useRoute()
const router=useRouter()
const handleRefreshRoute=()=>{
    console.log('route.fullPath',route.fullPath)
    const path=route.fullPath
   // route
    router.replace({
        path:'/reload',
        query:{
            redirect:path
          // path:route.fullPath
        }
    }).then(()=>{
        // console.log('then',path)
        //  router.replace({
        //     path:path
        // })
    })
 
  
}
</script>
<template>

<FField @submit="handleSubmit" label-align="top" ctype="t-form" ref="formRef" :data="formData" :rules="rules">
    <FFormFeild label="Name"  type="t-input" name="name" v-model="formData.name">
        <template #tips>
            不能包含特殊符号
        </template>
    </FFormFeild>
    <FFormFeild label="sex" type="t-select" name="sex" v-model="formData.sex" :field-props="{
        options:[{value:1,label:'男'},{value:0,label:'女'}],
        filterable:true,
        clearable:true,
        placeholder:'请选择性别'
    }">
    </FFormFeild>
    <FField ctype="t-button" type="submit" >提交</FField>
   <FField ctype="t-button" @click="handleRefreshRoute" >刷新</FField>
</FField>

</template>