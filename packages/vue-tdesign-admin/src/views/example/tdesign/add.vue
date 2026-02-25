<script setup lang="ts">
    import { reactive } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import FField from './components/FForm/FField.vue'
import FUploadCover2 from './components/FUpload/index.vue'
import FUploadCover from './components/FUpload/FUploadCover.vue'
import { Collapse } from 'tdesign-vue-next';
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
        <t-collapse default-expand-all class="form-collapse" expand-icon-placement="right" :expand-on-row-click="false" :borderless="true">
            <t-collapse-panel value="0" header="基础信息">
                    <t-form-item name="cover" label="Cover">
            <FUploadCover class="w-[300px] h-[200px]">
            </FUploadCover>
        </t-form-item>

            <t-form-item name="cover" label="Cover2">
            <FUploadCover2>
            </FUploadCover2>
        </t-form-item>
            </t-collapse-panel>

      </t-collapse>

            
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
<style>
.form-collapse .t-collapse-panel__header{
    padding: 8px 0;
    /* border-bottom: solid 1px var(--td-gray-color-4)!important; */
}
.form-collapse .t-collapse-panel__content{
    padding: 16px 8px;
}
</style>