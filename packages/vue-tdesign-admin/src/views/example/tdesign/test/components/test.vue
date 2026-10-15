<script setup lang="ts">

type Scheme={
    title:string,
    fields:{key:string,label:string}[]
}
const props=defineProps<{
    scheme:Scheme
}>()
const handleAdd=()=>{
    props.scheme.fields.push({
        key:'new',
        label:'新字段',
    })
}
const handleClear=()=>{
    props.scheme.fields=[]
}
</script>
<template>
    <div>
        <t-button @click="handleAdd">child add</t-button>
        <t-button @click="handleClear">child clear(错误)</t-button>
    </div>
    <div>
        <div v-for="s in props.scheme.fields" :key="s.key">{{s.label}}</div>
    </div>
</template>