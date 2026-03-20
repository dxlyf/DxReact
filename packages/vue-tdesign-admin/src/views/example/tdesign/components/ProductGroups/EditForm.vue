<script setup lang="ts">
import { computed, shallowReactive, shallowRef, watch } from 'vue';
import FSelectDialog from '../FSelectDialog/index.vue'
import { useRequest } from 'src/hooks/useRequest2';
import { useRouter } from 'vue-router'

const router = useRouter()

type Props={
    header?: string
    id?: number
}
const props = defineProps<Props>()
const isEdit = computed(()=>!!props.id)
type FormData={
    id?:number
    slug?:string
    title?:string
    parentId?:number
    ownerId?:number
    productIds?:string[]

}
const formData=shallowReactive({
    name:'',
    slug:'',
    title:'',
    parentId:-1,
    ownerId:-1,
    productIds:[]
})
const detailData=shallowRef<FormData>(null)
const syncFormData=()=>{
    formData.slug=detailData.value?.slug||''
    formData.title=detailData.value?.title||''
    formData.parentId=detailData.value?.parentId||-1
    formData.ownerId=detailData.value?.ownerId||-1
    formData.productIds=detailData.value?.productIds||[]
}
const loading=shallowRef(false)
const delay=(time:number)=>{
    return new Promise(resolve=>setTimeout(resolve,time))
}
const loadData=async()=>{
    if(props.id){
        try{
            loading.value=true
            await delay(2000)
            detailData.value={
                id:props.id,
                slug:'test-slug',
                title:'测试-title',
                parentId:1,
                ownerId:1,
                productIds:['1','2','3']
            }
            syncFormData()
            loading.value=false
        }catch(err){
            loading.value=false
        }finally{
            loading.value=false
        }
    }
}
watch(()=>props.id,(val)=>{
    if(val){
        loadData()
    }
},{
    immediate:true
})
const rules={
    slug:[
        {required:true,message:'请输入名称',trigger:'blur'}
    ]
}
const [parentState,parentInst]=useRequest<{label:string,value:number}[]>({
    defaultValue:[],
    request:async ()=>{
        return [{label:'测试',value:'1'},{label:'测试2',value:'2'}]
    }
})
const parentOptions=computed(()=>{
    return [{label:'',value:-1}].concat(parentState.data)
})
const handleReturn=()=>{
    router.back()
}
const handleReset=()=>{
    syncFormData()
}
const submitLoading=shallowRef(false)
const handleUpdate=async()=>{
    try{
        submitLoading.value=true
        await delay(2000)
        router.back()
    }catch(err){
        submitLoading.value=false
    }finally{
        submitLoading.value=false
    }
}
const handleCreate=async()=>{
    try{
        submitLoading.value=true
        await delay(2000)
        router.back()
    }catch(err){
        submitLoading.value=false
    }finally{
        submitLoading.value=false
    }
}
</script>
<template>
    <t-loading :loading="loading" show-overlay class="p-4 bg-white rounded-sm h-full flex flex-col">
        <div class="flex-none" v-if="isEdit">
            {{ props.header }}
        </div>
        <t-form reset-type="initial" :data="formData" :rules="rules" class="flex flex-col flex-1"  label-align="top">
            <t-form-item label="名称" name="slug">
                <t-input v-model="formData.name" />
            </t-form-item>
            <t-form-item label="标题" name="title">
                <t-input v-model="formData.title" />
            </t-form-item>
            <t-form-item label="父级" name="parentId">
                <t-select v-model="formData.parentId" :options="parentOptions" clearable filterable>
                    </t-select>
            </t-form-item>
            <t-form-item label="所有者" name="ownerId">
                <t-input v-model.number="formData.ownerIdId" />
            </t-form-item>
            <t-form-item label="产品" label-align="left" name="productIds">
                <FSelectDialog class="ml-auto" text="添加"></FSelectDialog>
            </t-form-item>
            <div class="mt-auto flex justify-end">
                <t-space v-if="isEdit">
                    <t-button theme="primary" @click="handleReset">重置</t-button>
                    <t-button theme="primary" @click="handleUpdate" :loading="submitLoading">保存更新</t-button>
                </t-space>
                <t-space v-else>
                    <t-button theme="primary" @click="handleReturn" >取消</t-button>
                    <t-button theme="primary" @click="handleCreate" :loading="submitLoading">创建</t-button>
                </t-space>
            </div>
        </t-form>
    </t-loading>
</template>

