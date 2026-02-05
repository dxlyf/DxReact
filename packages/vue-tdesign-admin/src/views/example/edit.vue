<template>
    <div>
        <t-breadcrumb>
            <t-breadcrumb-item>首页</t-breadcrumb-item>
            <t-breadcrumb-item>示例</t-breadcrumb-item>
            <t-breadcrumb-item>编辑</t-breadcrumb-item>
        </t-breadcrumb>
    </div>
    <t-card title="编辑" bordered>
        <t-form layout='vertical' label-align='top' :data="formData" :rules="rules">
        <t-row :gutter="[10,10]">
            <t-col :span="12">
                <t-form-item  label="姓名" name="name">
            <t-input v-model="formData.name" placeholder="请输入姓名"></t-input>
        </t-form-item>
            </t-col>
               <t-col :span="12">
                <t-form-item label="国家" name="country">
                    <t-button theme="default" @click="dialogCountry.open()">选择</t-button>
                </t-form-item>
            </t-col>
              <t-col :span="12">
                <t-space>
                    <t-button theme="primary" type="submit">保存</t-button>
                    <t-button theme="default">取消</t-button>
                </t-space>
            </t-col>
        </t-row>
    </t-form>
</t-card>
<t-dialog v-bind="dialogProps">
</t-dialog>
</template>
<script setup lang="ts">
import type { FormRules,BreadcrumbItemProps} from 'tdesign-vue-next'
import { onMounted, reactive, ref, shallowReactive ,Teleport} from 'vue'
import { useRoute } from 'vue-router'
import { useDialog } from '@/hooks/useDialog'
const title=ref('选择国家')
const [dialogProps,dialogCountry]=useDialog(()=>({
    header:title.value,
}))

const route = useRoute()
const params = route.params
const formData=shallowReactive({name:''})

const rules:FormRules={
    name:[{message:'请输入姓名',whitespace:true,required:true,}],
    country:[{message:'请选择国家',required:true}]
}
console.log('params',params)
</script>