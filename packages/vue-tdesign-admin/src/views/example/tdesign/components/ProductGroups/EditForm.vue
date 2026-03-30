<script setup lang="ts">
import { computed, popScopeId, shallowReactive, shallowRef, watch } from 'vue';
import FSelectDialog from '../FSelectDialog/index.vue'
import { useRequest } from 'src/hooks/useRequest2';
import { useRouter } from 'vue-router'
import FListSortable from '../FListSortable/index.vue'
import { DialogPlugin, type FormInstanceFunctions } from 'tdesign-vue-next';

const router = useRouter()

type Props={
    header?: string
    id?: number
}
const formRef=shallowRef<FormInstanceFunctions>()
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
const [productState,productInst]=useRequest<{label:string,value:string}[]>({
    defaultValue:[],
    request:async ()=>{
        return Array.from({length:100},(v,i)=>({slug:'测试'+i,id:i}))
    }
})
const loadData=async()=>{
    if(props.id){
        try{
            loading.value=true
          //  await delay(2000)
            detailData.value={
                id:props.id,
                slug:'test-slug',
                title:'测试-title',
                parentId:1,
                ownerId:1,
                productIds:[1,2,3]
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
watch(()=>props.id,(val,oldVal)=>{
    if(val){
        console.log('watch-props.id',val,oldVal)
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
        return [{label:'测试',value:1},{label:'测试2',value:2,disabled:true}]
    }
})
const parentOptions=computed(()=>{
    return [{label:'根节点',value:-1,children:parentState.data}]
})
const handleReturn=()=>{
    router.replace({
        path:'/example/tdesign/simple_treelist',
        query:{
            id:''
        }
    })
}
const handleReset=()=>{
  const dialog= DialogPlugin.confirm({
    header:false,
    body:'确认重置吗？',
    closeBtn:false,
    confirmBtn:{
        theme:'danger',
        content:'重置'
    },
    cancelBtn:'取消',
    onConfirm:()=>{
        syncFormData()
        dialog.destroy() 
    },
    onClose:()=>{
       dialog.destroy()
    }
    })
}
const submitLoading=shallowRef(false)
const handleUpdate=async()=>{
    try{
        submitLoading.value=true
         const valid=await formRef.value.validate({showErrorMessage:true})
        if(valid!==true){
            return
        }
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
        const valid=await formRef.value.validate({showErrorMessage:true})
        if(valid!==true){
            return
        }
        await delay(2000)
        router.back()
    }catch(err){
        submitLoading.value=false
    }finally{
        submitLoading.value=false
    }
}
const productItems=computed(()=>{

   const productIds=new Map((formData.productIds||[]).map((v,i)=>[v,i]))
   const newData= productState.data.filter((item)=>productIds.has(item.id))
   newData.sort((a,b)=>productIds.get(a.id)-productIds.get(b.id))
   return newData

})
const handleConfirmProduct=(val:string[],selectedRows:any[])=>{
    //formData.productIds=val
   // productState.data=selectedRows
}
const handleProductSort=(newList:any[])=>{
    formData.productIds=newList.map((item)=>item.id)
    console.log('newList', formData.productIds)
}
 
</script>
<template>
    <t-loading :loading="loading" show-overlay class="p-4 bg-white rounded-sm h-full flex flex-col">
        <div class="flex-none text-base font-semibold py-2" v-if="isEdit">
            {{ props.header }}
        </div>
        <t-form ref="formRef" reset-type="initial" :data="formData" :rules="rules" class="flex flex-col flex-1"  label-align="top">
            <t-form-item label="名称" name="slug">
                <t-input v-model="formData.slug" />
            </t-form-item>
            <t-form-item label="标题" name="title">
                <t-input v-model="formData.title" />
            </t-form-item>
            <t-form-item label="父级" name="parentId">
                <t-tree-select v-model="formData.parentId" :data="parentOptions" clearable filterable>
                    </t-tree-select>
            </t-form-item>
            <t-form-item label="所有者" name="ownerId">
                <t-input v-model.number="formData.ownerIdId" />
            </t-form-item>
            <t-form-item label="产品" label-align="left" name="productIds">
                <FSelectDialog v-model="formData.productIds" @confirm="handleConfirmProduct" value-field="id" label-field="slug" :options="productState.data" class="ml-auto" text="添加"></FSelectDialog>
            </t-form-item>
            <div v-show="productItems.length>0" class="mb-4">
                <FListSortable @change="handleProductSort" row-key="id" :items="productItems" v-slot="{item}">
                    {{ item.slug }}
                </FListSortable>
            </div>
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

