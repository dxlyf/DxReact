<template>
</template>

<script  lang="tsx">
import { defineComponent, render, type VNode,type PropType, renderSlot } from 'vue'
import {Table,type TableProps} from 'tdesign-vue-next'

type ProTableProps={

}&TableProps

export default defineComponent({
    name:'ProTable',
    props:{
    
    },
    setup(props,{slots,emit}){
        return ()=>{
            return <Table {...props} v-slots={slots}>
            </Table>
        }
    }
})

</script>