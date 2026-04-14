<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef, watchEffect,watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import {useLang} from '@/hooks/useLang'

const router = useRouter()
const route = useRoute()
const [allLang]=useLang()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '应用分类列表',
        to: '/example/tdesign/download/app_categories'
    },
    {
        content: '编辑应用分类'
    }
]

type FormData = {
    [key:string]:string
}

const rules = {

}
const formData = reactive<FormData>({

})

const submitLoading = ref(false)

const handleSubmit = async (e) => {
    
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
  
        console.log('提交', submitData)

    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const [parentSelectProps]=useSelect(()=>({
    value:formData.parentId,
    manualRequest:true,
    onChange:(val:any)=>{
        console.log('val',val)
        formData.parentId=val
    },
    request:async (keywork:string)=>{
        return [
            {
                label: '分类1',
                value: 1,
            },
            {
                label: '分类2',
                value: 2,
            },
        ]
    },
    valueType:'object',
    remote:true,

}))
const [videoSelectProps]=useSelect({
    value:formData.videoIds,
    manualRequest:true,
    onChange:(val:any)=>{
        formData.videoIds=val
    },
    request:async (keywork:string)=>{
        return [
            {
                label: '视频1',
                value: 1,
            },
            {
                label: '视频2',
                value: 2,
            },
        ]
    },
    multiple:true,
    remote:true,
    valueType:'object',
})

const handleReturn = () => {
    router.push('/example/tdesign/video/list')
}
const DataSouces=Array.from({length:33},(item,index)=>{
    return {
        label: `视频${index}`,
        value: index+1,
    }
})
const delay=(ms:number)=>{
    return new Promise(resolve=>setTimeout(resolve,ms))
}
const handleRequest=async (params:{keyword: string,current: number,pageSize: number})=>{
    console.log('params',params)
    await delay(1000)
    const cur= DataSouces.filter(item=>item.label.includes(params.keyword)).slice((params.current-1)*params.pageSize,params.current*params.pageSize)
    return {
        total:DataSouces.length,
        records:cur
    }
}
const handleRequestParent=async (params:{keyword: string,current: number,pageSize: number})=>{
    console.log('params',params)
    await delay(1000)
    const cur= DataSouces.filter(item=>item.label.includes(params.keyword)).slice((params.current-1)*params.pageSize,params.current*params.pageSize)
    return {
        total:DataSouces.length,
        records:cur
    }
}

</script>
<template>
    <MainLayout layout='edit' show-lang title="编辑应用分类" :breadcrumb-options="breadcrumbOptions">
   <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form ref="formRef" @submit="handleSubmit" :data="formData" :rules="rules" class="w-full" label-align="top">
            <t-form-item label="Slug" name="slug">
                <t-input v-model="formData.slug" :maxlength="255" />
            </t-form-item>
            
            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading"
                        type="submit">创建视频</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
</template>
