<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { DialogPlugin, type TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import ExpandableText from './ExpandableText.vue';
const router=useRouter()
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '应用程序分类',
        to: '/example/tdesign/download/app_categories'
    },
    {
        content: 'index'
    }
]


const data=Array.from({length:1},(v,i)=>({
    id:i+1,
    name:'name放大放大放大放大放大发打发打发发大水发到付啊打发 放大'+(i+1),
    apps:Array.from({length:7},(v,i)=>'product'+(i+1))
}))
const [tableProps, tableInst] = useTable({
  //  defaultParams: searchInst.searchParams.value,
    manualRequest: false,
    tableProps:{
        dragSort:'row-handler',
        onDragSort:({current,target,newData})=>{
            console.log('onDragSort',newData)
            tableInst.data.value=newData
        }
    },
    request: async (params) => {
        const newParams = {
            ...params,
        }
        let newData = data.filter((item) => {
            if(newParams.name){
                return item.name.includes(newParams.name)
            }
            return true
        })
       // console.log('request', newParams)
        return {
            success: true,
            records: newData.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: newData.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        colKey:'drag',
        width: 40,
    }, {
        title: '名称',
        colKey: 'name',
      //  ellipsis:true,
        width:200,
    }, {
        title: '应用',
        colKey: 'apps'
    } , {
        title: '操作',
        colKey: 'actions',
        width: 160
    }
]
const expandSearch = ref(false)
const handlePreview=(item)=>{
    console.log('handlePreview',item.value)
}
const handleCreate=()=>{
    console.log('handleCreate')
    router.push({path:'./app_categories/new'})
}
const publishFormData=reactive({
    reason:''
})


const handleEdit=(row)=>{
   // console.log('handleEdit',row)
    router.push({path:'./app_categories/edit',query:{id:row.id}})
}

const handleDelete=(row)=>{
   const confirmInst=DialogPlugin.confirm({
    header:false,
    theme:'danger',
    body: '确定删除应用吗？',
    confirmBtn:{
        theme:'danger',
        content:'删除'
       },
    onConfirm: async () => {
       try{
        confirmInst.setConfirmLoading(true)
      //  await deleteAppCategory(row.id)
        confirmInst.setConfirmLoading(false)
        confirmInst.destroy()
        tableInst.refresh()
       }catch(e){
            confirmInst.setConfirmLoading(false)
       }finally{
            
       }
    }
   })
}
const rows = ref(2);
const ellipsis = computed(() => {
  return {
    rows: rows.value,
    expandable: true,
    suffix: '...',
    tooltip:false,
    onEllipsis: (ellipsis: boolean) => {
      console.log('Ellipsis changed:', ellipsis);
    },
  };
});

</script>
<template>

    <MainLayout layout='list' show-lang title="应用分类列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新增</t-button>
            </t-space>
        </template>
        <Table v-bind="tableProps" :columns="columns">
            <template #drag="{ row }">
                <t-icon name="move"></t-icon>
            </template>
            <template #apps="{ row }">
                <ExpandableText class="ac-apps" :lines="3">
                       <div v-for="(item,i) in row.apps" :key="i" class="ac-app">
                        {{item}}
                    </div>
                </ExpandableText>
                <!-- <t-typography-paragraph class="ac-apps" :ellipsis="{row:2,expandable:true,collapsible:true}">
                    <div v-for="(item,i) in row.apps" :key="i" class="ac-app">
                        {{item}}
                    </div>
                </t-typography-paragraph> -->

                  <!-- <a-typography-paragraph :content="row.apps"  class="ac-apps"
    :ellipsis="ellipsis"
  >
     <div v-for="(item,i) in row.apps" :key="i" class="ac-app">
                        {{item}}
     </div>
</a-typography-paragraph> -->
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
                    <t-link theme="primary" @click="handleDelete(row)">删除</t-link>
                </t-space>
            </template>
        </Table>
    </MainLayout>
</template>
<style scoped>
.ac-apps {
    margin-top: -4px;
    margin-left:-4px;
}
.ac-apps .ac-app{
    display: inline-block;
    padding:2px 6px;
    background-color: rgba(0,0,0,0.1);
    border-radius: 4px;
    margin-left: 4px!important;
    margin-top: 4px!important;
    font-size: 12px;
}
</style>
