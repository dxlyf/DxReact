<script setup lang="ts">
import { computed,useAttrs,unref,toValue,toRaw, shallowRef } from 'vue'
import type { TdSelectProps } from 'tdesign-vue-next'

type Option={
    [Key:string]:any
}
type Props={
     keys?:{
        value?: string;
        label?: string;
        disabled?: string;
     },
     options?:Option[],
     serverFilter?:boolean,
     request?:(params:any)=>Promise<Option[]>
}
const props=withDefaults(defineProps<Props>(),{
    
})
const keys=computed(()=>{
    return {
        value:'value',
        label:'label',
        disabled:'disabled',
        ...(props.keys||{})
    }
})
const delay=(time:number)=>{
    return new Promise(resolve=>setTimeout(resolve,time))
}
const data=Array.from({length:10000},(item,index)=>({
    label:`选项${index}`,
    value:index
}))

const attrs=useAttrs()
const localOptions=shallowRef<Option[]>([])

const getOptionLabel=(item:Option)=>{
    return item[keys.value.label]
}
const getOptionValue=(item:Option)=>{
    return item[keys.value.value]
}
const getOptionDisabled=(item:Option)=>{
    return item[keys.value.disabled]
}
const displayOptions=computed(()=>{
    let curOptions=[]
    if(props.request){
        curOptions=localOptions.value
    }else{
        curOptions= props.options||[]
    }
    return curOptions.map(item=>({
        ...item,
        label:getOptionLabel(item),
        value:getOptionValue(item),
        disabled:getOptionDisabled(item),
    }))
})
const selectProps=computed(()=>{
    return {
        clearable:true,
        filterable:true,
        options:displayOptions.value,

                ...attrs,
    } as TdSelectProps
})
const loading=shallowRef(false)
const requestOptions=async (params:any={})=>{
    if(props.request){
        localOptions.value=await props.request(params)
    }
}
const handleSearch=async (keywork:string)=>{
    await delay(1000)
    const res=await props.request({...params})

}
</script>

<template>
    <t-select v-bind="selectProps"  :options="options">
         <template v-for="(value,name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData||{}"></slot>
        </template>
    </t-select>
</template>