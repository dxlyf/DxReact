<script setup lang="ts">
import { computed,useAttrs,unref,toValue,toRaw, shallowRef } from 'vue'
import type { TdSelectProps } from 'tdesign-vue-next'

type Option={
    label:string
    value:any
    [Key:string]:any
}
type Props={
     keys?:{
      value?: string;
        label?: string;
        disabled?: string;
     },
     request:(params:any)=>Promise<Option[]>
}
const props=withDefaults(defineProps<Props>(),{
    
})
const delay=(time:number)=>{
    return new Promise(resolve=>setTimeout(resolve,time))
}
const data=Array.from({length:10000},(item,index)=>({
    label:`选项${index}`,
    value:index
}))

const attrs=useAttrs()
const options=shallowRef<Option[]>([])
const keysConfig=computed(()=>({
    label:props.keys?.label||'label',
    value:props.keys?.value||'value',
    disabled:props.keys.disabled||'disabled',
}))
const selectProps=computed(()=>{
    return {
        clearable:true,
        filterable:true,
        valueType:'object',
                ...attrs,
    } as TdSelectProps
})
const loading=shallowRef(false)
const handleSearch=async (keywork:string)=>{
    await delay(1000)
    const res=await props.request({...params})
    options.value=res
}
</script>

<template>
    <t-select v-bind="selectProps" @search="handleSearch" :keys="keysConfig" :options="options">
         <template v-for="(value,name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData||{}"></slot>
        </template>
    </t-select>
</template>