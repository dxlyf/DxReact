<script setup lang="ts">
    import { computed, provide } from 'vue';
    import {useLang} from '@/hooks/useLang'
    import {get as lodashGet} from 'lodash-es'
    const [lang,{currentLocale}]=useLang()
    const props=defineProps<{
        translationData?:any // 当前语言数据
        data?:any // 主表数据
        checkVisible?:(name:string,obj:any,translationData:any)=>boolean // 判断是否显示复用英语提示
    }>()
    const isEnglish=computed(()=>{
        return currentLocale.value==='en-US'
    })
    const isNullOrUndefined=(val:any)=>{
        return val===null||val===undefined
    }
    const getObjValue=(obj:any,name:string)=>{
        return lodashGet(obj,name)
    }
    const obj=computed(()=>props.data)
    const translationData=computed(()=>props.translationData)
    provide('REUSE_ENGLISH_CONTEXT',{
        // 判断是否显示复用英语提示
        data:obj,
        translationData:translationData,
        checkVisible:(name:string)=>{
            const obj=props.data
            const translationData=props.translationData
            const translationMissing=translationData&&isNullOrUndefined(getObjValue(translationData,name))||isNullOrUndefined(obj?.id)
           // const notEnglishLocale=!isEnglish.value
            if(translationMissing&&!isEnglish.value){
                return true
            }
            return false
        }
    })
</script>
<template>
    <slot></slot>
</template>