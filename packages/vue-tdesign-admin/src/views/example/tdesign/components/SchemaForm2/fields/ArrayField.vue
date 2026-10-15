<script setup lang="ts">
import { computed,inject, reactive, ref,watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { type UseSchemeFormInstance,USE_SCHEME_CONTEXT_KEY } from '../composables/useSchemeForm';
import { ArrayFieldScheme, FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import {createItemByScheme} from '../util'
import {DialogPlugin} from 'tdesign-vue-next'

const props=defineProps<{
    scheme: ArrayFieldScheme;
    path: FieldPath;
}>()
const title=computed(()=>{
    return props.scheme.formatLabel?props.scheme.formatLabel(props.scheme.label,props.scheme):props.scheme.label
})

const activeKey=ref(0)
const realActiveKey=computed(()=>{
    return Math.max(0,Math.min(activeKey.value,fieldValue.value.length-1))
})
const form=inject<UseSchemeFormInstance>(USE_SCHEME_CONTEXT_KEY)
const fieldValue=computed({
    get(){
        return form.getValue(props.path,props.scheme.defaultValue)
    },
    set(val){
        form.setValue(props.path,val)
    }
})
const getFieldSchemes=(index:number)=>{
    const item=fieldValue.value[index]
    return props.scheme.schemes
}
const arrayFieldMap=ref<Record<number,{
    name:string
    checked:boolean
    canRemove:boolean
}[]>>({})
const visibleFields=computed(()=>{
    if(fieldValue.value.length<=0&&!props.scheme.allowAddedField){
        return []
    }
    const fields=arrayFieldMap.value[realActiveKey.value]||[]
    const map=new Map(fields.map((field)=>[field.name,field]))
    const presetFields= props.scheme.schemes.map((item)=>{
        return {
            name:item.key,
            checked:map.has(item.key)?map.get(item.key).checked:true,
            canRemove:false
        }
    })
    return presetFields.concat(fields.filter(field=>!presetFields.some((item)=>item.name===field.name)))
})
const handleAdd=()=>{
    fieldValue.value=[...fieldValue.value,createItemByScheme(props.scheme)]
    activeKey.value=fieldValue.value.length-1

}
const handleRemove=({index}:{index:number})=>{
    const dialog=DialogPlugin.confirm({
        header:'确认移除吗？',
        body:'确认移除当前项吗？',
        onConfirm:()=>{
            fieldValue.value=fieldValue.value.filter((item:any,i:number)=>i!==index)
            if(index<=activeKey.value){
                activeKey.value=Math.max(0,activeKey.value-1)
            }
            arrayFieldMap.value[index]=null
            dialog.destroy()
            
        }
    })
}
const handleTabChange=(val:any)=>{
    activeKey.value=val
}
const handleVisibleFieldChange=(fields:any[])=>{
    arrayFieldMap.value[realActiveKey.value]=fields
}
</script>
<template>
    <CollapseCard :title="title">
        <template #extra>
            <FieldPopover @change="handleVisibleFieldChange" v-if="fieldValue.length>0&&scheme.valueType==='array<object>'&&scheme.allowAddedField"  :fields="visibleFields" :path="props.path" />
        </template>
        <t-tabs theme="card" :value="realActiveKey" :addable="scheme.allowAdded" @change="handleTabChange" @add="handleAdd" @remove="handleRemove">
            <t-tab-panel :value="index"  removable v-for="(item,index) in fieldValue" :key="index" >
                <div class="p-2">
                    <template v-for="(field,fieldIndex) in getFieldSchemes(index as number)" :key="field.key||fieldIndex">
                    <FormField :scheme="field" :path="scheme.valueType==='array<object>'?[...path,index,field.key]:[...path,index,fieldIndex]"></FormField>
                </template>
                </div>
            </t-tab-panel>
        </t-tabs>
    </CollapseCard>
</template>