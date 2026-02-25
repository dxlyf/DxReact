<script setup lang="ts">
    import { reactive } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import FField from './components/FForm/FField.vue'
import FUploadCover2 from './components/FUpload/index.vue'
import FUploadCover from './components/FUpload/FUploadCover.vue'
    const breadcrumbOptions=[
        {
            content:'首页',
            to:'/'
        },{
            content:'列表',
            to:'/list'
        },{
            content:'新增'
        }
    ]
    const formData=reactive({})
</script>

<template>
    <EditLayout :breadcrumbOptions="breadcrumbOptions" title="新增">
       <t-form :data="formData" class="w-full" label-align="top">
        <t-form-item name="cover" label="Cover">
            <FUploadCover class="w-[300px] h-[200px]">
            </FUploadCover>
        </t-form-item>
                <t-form-item name="cover" label="Cover2">
            <FUploadCover2>
            </FUploadCover2>
        </t-form-item>
           <t-form-item name="slug" label="Slug">
            <t-input placeholder="Product slug"></t-input>
        </t-form-item>
                   <t-form-item name="title" label="Title">
            <t-input placeholder="Product title"></t-input>
        </t-form-item>
                   <t-form-item name="status" label="Status">
            <t-select :options='[{label:"Draft",value:"draft"},{label:"Published",value:"published"}]''></t-select>
        </t-form-item>
                   <t-form-item name="slug" label="Slug">
            <t-input placeholder="Product slug"></t-input>
        </t-form-item>
       </t-form>
    </EditLayout>
</template>