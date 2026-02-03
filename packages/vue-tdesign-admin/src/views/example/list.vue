<template>
       <div class="p-4 bg-white">
        <pro-table class="w-full" v-bind="tableProps">
            <template #actions="{ row }">
                <table-action  @itemClick="handleClick($event,row)"></table-action>
            </template>
            <template #leftOperation>
               <t-space>
                    <t-button  theme="primary">新增</t-button>
               </t-space>
            </template>
             <template #rightOperation>
               <t-space>
                    <t-button  theme="default">导出</t-button>
               </t-space>
            </template>
        </pro-table>
       </div>
</template>

<script setup lang="ts">
import { useSearchForm } from 'src/hooks/useSearchForm';
import { useTable } from 'src/hooks/useTable';
import { request } from 'src/utils/request';
import { Button, Space, type PrimaryTableCol } from 'tdesign-vue-next'
import { computed, reactive, ref } from 'vue';
import ProTable from 'src/components/pro-table/index.vue'
import TableAction from 'src/components/table-action/index.vue'
const searchParams = reactive({
    name: undefined,
})

const delay = (t: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(null)
        }, t)
    })
}
const [searchFormProps,{tableActionRef}] = useSearchForm({

    formProps:{
        columns: [
            {
                name:'name',
                label:'名称',
                type:'text'
            },
             {
                name:'name2',
                label:'名称',
                type:'text'
            },
             {
                name:'name3',
                label:'名称',
                type:'text'
            },
        ]
    }
})
console.log('searchFormProps',searchFormProps)
const [tableProps, tableInstance] = useTable({
    tableActionRef,
    service: async (params) => {
        await delay(1000)
        const res = await request<{ records: any[], total: number }>({
            url: `/list`,
            method: 'post',
            data: params
        })
        return res.data
    },
    searchForm:searchFormProps,
    tableProps: {

        columns: [
            {
                title: 'ID',
                colKey: 'id',
                width: 100
            },
            {
                title: '名称',
                colKey: 'name'
            },
            {
                title: '操作',
                width: 140,
                colKey: 'actions',
                // cell:(h,{row})=>{
                //     return h(Space,{},[
                //         h(Button,{tag:'a',key:'a',variant:'text',theme:'primary',size:'small'},'编辑'),
                //         h(Button,{tag:'a',key:'b',variant:'text',theme:'danger',size:'small'},'删除'),
                //     ])
                // }
            }
        ],
        pagination: {

        }
    },
})
const actions=[
    {
        label:'编辑',
        key:'edit',
        order:1
    },
    {
        label:'删除',
        key:'delete',
        order:2,
        theme:'danger'
    }
]
const handleSearch = () => {

}
const handleReset = () => {
    tableInstance.refresh()
}
const handleClick=(item,row)=>{
    console.log('item',item,row)
}
</script>
