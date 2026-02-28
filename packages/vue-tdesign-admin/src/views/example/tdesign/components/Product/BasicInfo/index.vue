<script setup lang="ts">
import {CollapsePanel} from 'tdesign-vue-next'
import { reactive } from 'vue';

const formData=reactive({})
const rules={
    slug:[
        { required: true, message: '请输入Slug' }
    ],
    cover:[
        { required: true, message: '请输入Cover' }
    ]
}
</script>
<template>
    <t-form :data="formData" :rules="rules" label-align="top" layout='vertical'>
        <t-collapse default-expand-all expand-icon-placement="right" borderless>
            <t-collapse-panel title="Basic Info" value="basic_info">
                <template #header>
                    <div class="header">基础信息配置</div>
                </template>
                <t-form-item label="Slug(唯一标识)" name="slug">
                    <t-input v-model="formData.slug" :maxlength="255" />
                </t-form-item>
                <t-form-item label="Cover(封面图)" name="cover">
                    <t-input v-model="formData.cover" :maxlength="255" />
                    <template #help>
                        <div><t-icon name="error-circle"></t-icon>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Title(产品名称)" name="title" >
                    <t-input v-model="formData.title" :maxlength="255" />
                    <template #tips>
                        <div>哈哈</div>
                    </template>
                    <template #help>
                        <div>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Accessory Link" >
                <div class="grid grid-cols-2">
                           <t-form-item label-width="0" name="accessoryLink">
                     <t-input v-model="formData.accessoryLink" :maxlength="255" />
                   </t-form-item>
                      <t-form-item label-width="0" name="accessoryLink2">
                     <t-input v-model="formData.accessoryLink2" :maxlength="255" />
                   </t-form-item>
                </div>
                </t-form-item>
                <div></div>
            </t-collapse-panel>
        </t-collapse>
    </t-form>
</template>
<style lang="css" scoped>
.header{
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}
</style>