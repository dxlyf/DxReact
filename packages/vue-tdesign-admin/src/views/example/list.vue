<template>
       <div>
        <div>
             <dropdown-lang ></dropdown-lang>
        </div>
        <div class="mb-4">
            <t-breadcrumb>
            <t-breadcrumb-item>首页</t-breadcrumb-item>
            <t-breadcrumb-item>示例</t-breadcrumb-item>
            <t-breadcrumb-item>列表</t-breadcrumb-item>
        </t-breadcrumb>
        </div>
        <div class="p-4 bg-white">
        <div class="my-2 p-2 gap-2 flex bg-gray-100">
            <div class="align-middle px-4 py-1 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300" v-for="item in LANG_LIST" :key="item.value">{{item.label}}</div>
        </div>
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
       </div>
</template>
<script setup lang="ts">
import DropdownLang from 'src/components/page-lang/dropdown-lang.vue'
import { useSearchForm } from 'src/hooks/useSearchForm';
import { useTable } from 'src/hooks/useTable';
import { request } from 'src/utils/request';
import { Button, Space, type PrimaryTableCol } from 'tdesign-vue-next'
import { computed, reactive, ref } from 'vue';
import ProTable from 'src/components/pro-table/index.vue'
import TableAction from 'src/components/table-action/index.vue'
import { useRouter } from 'vue-router'
import { LANG_LIST } from 'src/components/page-lang/config';
const router=useRouter()
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
    searchForm:searchFormProps.value,
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
     router.push({
        path:`/example/components/edit/zh/${row.id}`,
     })
}
</script>
