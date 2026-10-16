<script setup lang="ts">
import { shallowRef } from 'vue';
import { AllFieldSchema } from '../types';

type Field={
    name:string
    checked:boolean
    canRemove:boolean
    schema:AllFieldSchema
}
const props = defineProps<{
    fields:Field[]
}>()
const emit=defineEmits(['add','remove','visibleField'])
const handleRemove=(field:Field)=>{
    emit('remove',field.name)
}

const handleCheck=(name:string, checked:boolean)=>{
    emit('visibleField', name, checked)
}
const inputStatus=shallowRef<any>({
    status:'default',
    message:''
})
const newFieldName=shallowRef('')
/** 仅派发新字段名，数据写入交由父组件（表单）在对应节点上完成 */
const handleAdd=()=>{
    const key=newFieldName.value.trim()
    if(key===''){
        inputStatus.value={
            status:'error',
            message:'请输入字段名'
        }
        return
    }
    if(props.fields.some(f=>f.name===key)){
        inputStatus.value={
            status:'error',
            message:'字段已存在'
        }
        return
    }
    inputStatus.value={
        status:'default',
        message:''
    }
    emit('add', key)
    newFieldName.value=''
}
const handleFocus=()=>{
    if(inputStatus.value.status==='error'){
        inputStatus.value={
            status:'default',
            message:''
        }
    }
}
const handleVisibleChange=(visible:boolean)=>{
    if(!visible){
        inputStatus.value={
            status:'default',
            message:''
        }
        newFieldName.value=''
    }
}
</script>
<template>
    <t-popup @visible-change="handleVisibleChange" placement="bottom-left" show-arrow destroy-on-close trigger="click">
        <template #content>
            <div class="p-2">
                <div>
                    <div v-for="field in fields" :key="field.name" class="grid grid-cols-[auto_1fr_30px] gap-y-2 items-center">
                        <t-checkbox  @change="handleCheck(field.name, $event)" :checked="field.checked" />
                        <div>{{field.name}}</div>
                        <div v-show="field.canRemove"><t-button @click="handleRemove(field)" variant="text" size="small" theme="danger">删除</t-button></div>
                    </div>
                </div>
                <div class="border-t border-solid border-gray-200 py-2 mt-2">
                    <div class="flex gap-4">
                        <div class="flex-auto">
                            <t-input @focus="handleFocus" size="small" :status="inputStatus.status" v-model="newFieldName" placeholder="添加字段"  />
                            <p v-show="inputStatus.status==='error'" class=" text-red-600 text-xs">{{inputStatus.message}}</p>
                        </div>
                        <div class="flex-none">
                               <t-button theme="primary" size="small" @click="handleAdd">添加</t-button>
                        </div>
                    
                    </div>
                </div>
            </div>
        </template>
        <t-button size="small">编辑属性</t-button>
    </t-popup>
</template>
