<script setup lang="ts">
import { reactive, ref, shallowRef } from 'vue'
import { useUserStore } from '@/stores/user'
import ListLayout,{type Props as ListLayoutProps} from './components/Layouts/ListLayout.vue'
import FSearchForm,{type FieldType} from './components/FForm/FSearchForm.vue'
import { DialogPlugin, MessagePlugin, type TableProps } from 'tdesign-vue-next'


const searchColumns:FieldType[]=[
    {
        label:'名称',
        name:'name',
        type:'text'
    },    {
        label:'名称2',
        name:'name2',
        type:'text'
    },    {
        label:'名称3',
        name:'name3',
        type:'text'
    },    {
        label:'名称4',
        name:'name4',
        type:'text'
    }
]

const breadcrumbItems:ListLayoutProps['breadcrumbItems'] = [
    {
      content:'首页'
    },
    {
        content:'列表'
    }
]
const columns:TableProps['columns']=[
    {   
        colKey:'id',
        title:'Id'
    },
    {
        colKey:'slug',
        title:'Slug'
    },{
        colKey:'conver',
        title:'Conver',
        width:200
    },
    {
        colKey:'publishTime',
        title:'Publish time'
    },
    {
        colKey:'status',
        title:'Status'
    },{
        colKey:'actions',
        cell:'cell_actions',
        title:'',
        width:160,
        fixed:'right'
    },
]
const tableData=shallowRef([])


   const dataSourceList=Array.from({length:500},(v,i)=>({
        id:i+1,
        slug:'slug-'+(i+1),
        _rowType:2,
        conver:'https://tdesign.tencent.com/assets/images/cover.png',
        countries:['fda','fa','ff'],
        publishTime:'2023-01-01',
        status:'published',
    }))
const delay=async (ms=1000)=>{
    return new Promise(resolve=>{
        setTimeout(()=>{
            resolve(true)
        },ms)
    })
}
const loading=ref(false)
const loadTableData=async ()=>{
    const params={
        current:pagination.current,
        pageSize:pagination.pageSize,
    }
    loading.value=true
    await delay()
    const data=dataSourceList.slice((params.current-1)*params.pageSize,params.current*params.pageSize)
    if(pagination.current>1){
        data[0].children=[{...data[0],id:Math.random().toString(36)}]
    }
    console.log('data',data)
    tableData.value=data.reduce((prev,cur)=>{
        if(Array.isArray(cur.children)&&cur.children.length>0){
            prev.push({
                ...cur,
                _rowType:1
            })
            prev=prev.concat(cur.children.map(d=>({...d,slug:'version +',_rowType:4})))
        }else{
            prev.push({
                ...cur,
                _rowType:2
            })
        }
        return prev
    },[])
    pagination.total=dataSourceList.length
    loading.value=false
}
const expandedRowKeys=shallowRef([])
const handleExpandChange:TableProps['onExpandChange']=(rowKeys,options)=>{
    expandedRowKeys.value=rowKeys
}
const pagination=reactive({
    total:0,
    pageSize:25,
    current:1,
})
const handlePaginationChange:TableProps['onPageChange']=(pageInfo)=>{
    pagination.current=pageInfo.current
    pagination.pageSize=pageInfo.pageSize
    loadTableData()
}
loadTableData()

const handleDel=(row:any)=>{
    tableData.value=tableData.value.filter(d=>d.id!==row.id)
    const instance=DialogPlugin.confirm({
        header:'确认删除吗？',
        body:'删除后将无法恢复',
        confirmBtn:{
            content:'确认',
            theme:'danger'
        },
        cancelBtn:{
            content:'取消',
            theme:'primary'
        },
        onConfirm:()=>{
            MessagePlugin.success('删除成功')
           // instance.destroy()
        },
        onCancel:()=>{
            MessagePlugin.info('已取消删除')
            //instance.destroy()
        }
    })
}
</script>
<template>
  
<ListLayout title="列表" :breadcrumb-items="breadcrumbItems" >
    <template #form>
       <FSearchForm :columns="searchColumns"></FSearchForm>
    </template>
    <template #table>
        <t-table :disable-data-page="true" :loading="loading" @page-change="handlePaginationChange" :pagination="pagination" :row-class-name="({row})=>row._rowType&4?'pd-table-c-row':'pd-table-p-row'" row-key="id" :expand-icon="false" @expand-change="handleExpandChange" :expanded-row-keys="expandedRowKeys" :expand-on-row-click="false" :columns="columns" :data="tableData">
            <template #expandedRow="{ row }">
                <t-table row-key="id" :columns="columns" :data="row.children"></t-table>
            </template>
            <template #status="{ row }">
                <t-tag v-if="row.status==='published'" theme="success" variant="light">已发布</t-tag>
                <t-tag v-else theme="warning">未发布</t-tag>
            </template>
            <template #id="{ row }">
                {{ row._rowType&1 ?'' : row.id }}
            </template>
              <template #slug="{ row }">
                <t-link theme="primary" v-if="row._rowType&6">
                    {{row.slug }}
                </t-link>
                <div v-else class="text-black font-semibold">{{ row.slug }}</div>
            </template>
            <template #conver="{row}">
               <img v-if="row._rowType&3" :src="row.conver" alt="" class="w-12 h-12 rounded">
               <div v-else>
                    <t-tooltip  theme="light" v-if="Array.isArray(row.countries)&&row.countries.length>6">
                        <template #content>
                            <div class="flex flex-wrap gap-1 p-2 w-50">
                            <div class="bg-gray-800 text-white px-1 rounded-xs" v-for="(v,i) in row.countries" :key="i">
                                {{v}}
                            </div>
                        </div>
                    </template>
                    <div class="flex flex-wrap gap-1">
                            <div class="bg-gray-800 text-white px-1 rounded-xs" v-for="(v,i) in row.countries.slice(0,6)" :key="i">
                                {{v}}
                            </div>
                            <div>...</div>
                    </div>
               </t-tooltip>
                 <div class="flex flex-wrap gap-1" v-else>
                        <div class="bg-gray-800 text-white px-1 rounded-xs" v-for="(v,i) in row.countries.slice(0,6)" :key="i">
                            {{v}}
                        </div>
                    </div>
               </div>
            </template>
            <template #cell_actions="{row}">
                <t-space>
                    <t-link theme="primary" href="#">编辑</t-link>
                    <t-link theme="danger" href="#" @click="handleDel(row)">删除</t-link>
                </t-space>
            </template>
        </t-table>
    </template>
</ListLayout>

</template>
<style lang="css" scoped>
:deep(.pd-table-c-row  td){
    background-color: #f5f5f5!important;
}
</style>