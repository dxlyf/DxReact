<script setup lang="ts">
// import type { TableProps } from 'tdesign-vue-next'
// import { computed, reactive, ref, useAttrs } from 'vue'

// type PaginationParams={
//     current:number
//     pageSize:number
// }
// type ResponseData<T>={
//     success:boolean
//     records:T[]
//     total:number
// }
// type RequestParamater={
//     [Key:string]:any
// }&Partial<PaginationParams>
// type Props={
//     request?:<T>(params:RequestParamater)=>Promise<ResponseData<T>>
//     showPagination?: boolean
// }
// const props = withDefaults(defineProps<Props>(),{
//     showPagination: true
// })
// const attrs=useAttrs()
// const loading=ref(false)
// const pagination = reactive<TableProps['pagination']>({
//     total: 0,
//     pageSize: 10,
//     current: 1,
//     pageSizeOptions: [10, 20, 30, 40],
// })
// const tableProps=computed<TableProps>(()=>{
//     return {
//         ...(props.showPagination?{
//             pagination:{
//                 total:pagination.total,
//                 pageSize:pagination.pageSize,
//                 current:pagination.current,
//                 pageSizeOptions:pagination.pageSizeOptions,
//             },
//         }:{}),
//         rowKey:'id',
//         loading:loading.value,
//         ...attrs,
//     }
// })
</script>
<template>
    <t-table v-bind="$attrs" class="table">
        <template v-for="(value,name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData||{}"></slot>
        </template>
    </t-table>

</template>
<style scoped>
.table :global(.t-table__header th){
    background-color: #f8f9fa;
    color:#212733;
    font-weight: 600;
}
</style>