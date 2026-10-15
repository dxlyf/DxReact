<script setup lang="ts">
import { computed, ref } from 'vue';
import Test from './components/test.vue'
const files=ref([
    {
        key:'name',
        label:'姓名',
    },
])
const scheme=computed(()=>{
    return {
        title:'测试',
        fields:files.value
    }
})
const handleAdd=()=>{
    files.value.push({
        key:'address',
        label:'地址',
    })
}
const handleClear=()=>{
    files.value=[]
}
</script>
<template>
    <div>
        <t-button @click="handleAdd">parent add</t-button>
        <t-button @click="handleClear">parent clear</t-button>
    </div>

    <Test :scheme="scheme">
    </Test>
</template>
