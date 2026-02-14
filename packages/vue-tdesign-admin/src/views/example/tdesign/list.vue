<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import ListLayout,{type Props as ListLayoutProps} from './components/Layouts/ListLayout.vue'
import FSearchForm from './components/FForm/FSearchForm.vue'

const breadcrumbItems:ListLayoutProps['breadcrumbItems'] = [
    {
      content:'首页'
    },
    {
        content:'列表'
    }
]
const fields=[
     {
        name:'name3',
        label:'姓名',
        type:'input',
        props:{
            placeholder:'请输入姓名'
        }
    },  {
        name:'name2',
        label:'姓名',
        type:'input',
        props:{
            placeholder:'请输入姓名'
        }
    }, {
        name:'name',
        label:'姓名',
        type:'input',
        props:{
            placeholder:'请输入姓名'
        }
    },
    {
        name:'age',
        label:'年龄',
        type:'number',
         placeholder:'请输入年龄'
    },
    {
        name:'gender',
        label:'性别',
        type:'select',
        props:{
            placeholder:'请选择性别',
            options:[
                {
                    label:'男',
                    value:'male'
                },
                {
                    label:'女',
                    value:'female'
                }
            ]
        }
    }
].map((item) => ({
    ...item,
    labelInPlaceholder: true
}))
</script>
<template>
<ListLayout title="列表" :breadcrumb-items="breadcrumbItems" >
    <template #form>
        <FSearchForm  :columns="fields"></FSearchForm>
    </template>
</ListLayout>

</template>