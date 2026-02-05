<script setup lang="ts">
import { ref, onMounted, shallowRef, inject } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const params = route.params
const formData=shallowRef({name:''})
console.log('route',route)
console.log('lang',inject('lang'))
</script>
<style lang="less">
.edit-form-card{
    padding: 16px;
    &>.t-card__header{
        padding:0 0 16px;
    }
    &>.t-card__body{
        padding:16px 0 16px;
    }
}
</style>
<template>
        <div class="mb-3">
            <div class="mb-[10px]"><span class="text-[rgb(51,51,51)]">当前配置语言:</span><span class="text-[rgb(51,51,51)] font-bold ml-2">中文</span></div>
            <t-breadcrumb separator="/">
                <t-breadcrumb-item to="/home">首页</t-breadcrumb-item>
                <t-breadcrumb-item>示例</t-breadcrumb-item>
                <t-breadcrumb-item>基础编辑</t-breadcrumb-item>
            </t-breadcrumb>
        </div>
        <t-card class="edit-form-card" title="编辑表单" header-bordered>
            <t-alert title="fff" v-if="false">
               fdafd
            </t-alert>
            <t-form reset-type="initial" :data="formData" label-align="top">
                <t-row :gutter="[8,8]">
                    <t-col :span="12">
                        <t-form-item label="Slug" name="slug">
                            <t-input v-model="formData.name" placeholder="标签唯一标识"></t-input>
                        </t-form-item>
                    </t-col>
                    <t-col :span="12">
                        <t-form-item label="标签文案" name="text">
                            <t-input v-model="formData.name" placeholder="标签唯一标识"></t-input>
                        </t-form-item>
                    </t-col>
                    <t-col :span="12">
                        <t-form-item label="标签板块" name="section">
                            <t-input v-model="formData.name" placeholder="标签唯一标识"></t-input>
                        </t-form-item>
                    </t-col>
                                        <t-col :span="12">
                        <t-form-item label="Slug" name="slug">
                            <t-input v-model="formData.name" placeholder="标签唯一标识"></t-input>
                        </t-form-item>
                    </t-col>
                    <t-col :span="12">
                        <t-space>
                            <t-button theme="primary" type="submit">保存</t-button>
                            <t-button theme="default">返回</t-button>
                        </t-space>
                    </t-col>
                </t-row>
            </t-form>
            
        </t-card>
</template>
