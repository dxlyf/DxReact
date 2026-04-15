<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef, watchEffect,watch, toRaw } from 'vue';
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
        content: '新增应用分类'
    }
]

type FormData = {
    [key:string]:string
}

const rules = {

}
const formData = reactive<FormData>({

})
watch(()=>allLang.value,(val)=>{
    if(Array.isArray(val)&&val.length>0){
        val.forEach(item=>{
            formData[item.value]=''
        })
    }
},{immediate:true})
const submitLoading = ref(false)

const handleSubmit = async (e) => {
    
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        const submitData=toRaw(formData)
        console.log('提交', submitData)

    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}


const handleReturn = () => {
    router.push('/example/tdesign/download/app_categories')
}

</script>
<template>
    <MainLayout layout='edit' show-lang title="新增应用分类" :breadcrumb-options="breadcrumbOptions">
   <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form ref="formRef"  :data="formData" :label-width="140" @submit="handleSubmit"  class="w-full" label-align="right">
            <t-form-item :rules="[{whitespace:true,required:true,message:'请输入应用分类名称'}]" v-for="item in allLang" :key="item.value" :label="item.value+' - 名称'" :name="item.value">
                <t-input v-model="formData[item.value]" placeholder="下载应用分类名称" :maxlength="255" />
            </t-form-item>
   
            
            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading"
                        type="submit">新增应用分类</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
</template>
