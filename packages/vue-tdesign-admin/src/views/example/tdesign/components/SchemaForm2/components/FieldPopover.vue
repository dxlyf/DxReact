<script setup lang="ts">
import { shallowRef } from 'vue';
import { AllFieldScheme,FieldPath } from '../types';

type Field={
    name:string
    checked:boolean
    canRemove:boolean
}
const props = defineProps<{
    fields:Field[]
}>()
const emit=defineEmits(['change'])
const handleRemove=(field:Field)=>{
    emitChange(props.fields.filter(f=>f.name!==field.name))
}
const emitChange=(fields:Field[])=>{
    emit('change',fields)
}
const handleCheck=(field:Field)=>{
    emitChange(props.fields.map(f=>{
        if(f.name===field.name){
            return {
                ...f,
                checked:field.checked
            }
        }
        return {...f}
    }))
}
const newFieldName=shallowRef('')
const handleAdd=()=>{
    if(newFieldName.value.trim()==''){
        return
    }
    emitChange([...props.fields,{
        name:newFieldName.value.trim(),
        checked:true,
        canRemove:true
    }])
    newFieldName.value=''
}
</script>
<template>
    <t-popup placement="bottom" show-arrow destroy-on-close trigger="click">
        <template #content>
            <div class="px-6 py-3">
                <div>
                    <div v-for="field in fields" :key="field.name" class="grid grid-cols-[40px_1fr_80px]">
                        <div><t-checkbox  @change="handleCheck(field)" :checked="field.checked" /></div>
                        <div>{{field.name}}</div>
                        <div v-show="field.canRemove"><t-button @click="handleRemove(field)" variant="text" size="small" theme="danger">删除</t-button></div>
                    </div>
                </div>
                <div class="border-t border-solid border-gray-200">
                    <div class="flex">
                        <div class="flex-auto">
                            <t-input v-model="newFieldName" placeholder="添加字段"  />
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