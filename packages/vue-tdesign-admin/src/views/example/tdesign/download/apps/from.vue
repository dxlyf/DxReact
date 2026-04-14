<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, reactive, shallowReactive, shallowRef, toRaw } from 'vue'
import { useRequest } from 'src/hooks/useRequest2'
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import UploadImage from '@/views/example/tdesign/components/FUpload/FUploadImage.vue'
import FLanguageFields from '@/views/example/tdesign/components/FLanguageFields/index.vue'
import APPFormItem,{type APPCategoryDTO} from '@/views/example/tdesign/download/apps/APPFormItem.vue'
import { TdFormProps } from 'tdesign-vue-next'
import {cloneDeep} from 'lodash-es'
import { request } from 'src/utils/request'
type LocaleContentItem = Record<string, string>
 
type FormData = {
    id?: string
    iconUrl?: string
    qrCodeUrl?: string
    iconFile?: File
    qrCodeFile?: File
    slug: string
    publishAt: string
    offlineAt: string
    stopUpdating?: boolean
    isHideen?: boolean
    countries?: string[]
    productIds?: number[]
    downloadBaseCategoryIds: number[]
    name?: LocaleContentItem
    description?: LocaleContentItem
    status: LocaleContentItem
    ios?:APPCategoryDTO
    google?:APPCategoryDTO
    apk?:APPCategoryDTO

}
type Props = {
    id?: string
    type: 'create' | 'edit' | 'copy'
}

const pageInfo = computed<{ title: string }>(() => {
    const type = props.type
    switch (type) {
        case 'create':
        case 'copy':
            return {
                title: '新增应用'
            }
        case 'edit':
            return {
                title: '编辑应用',

            }
    }
})
const breadcrumbOptions = computed(() => {
    return [{
        content: '首页',
        to: '/'
    },
    {
        content: '应用程序列表',
        to: '/example/tdesign/download/apps'
    },
    {
        content: pageInfo.value.title
    }]
})
const props = defineProps<Props>()
const submitLoading = shallowRef(false)
const router = useRouter()

const createAppCategory=():APPCategoryDTO=>{
    return {
        version: '',
        links: {},
        systemInfo: {},
        compatibility: {},
        additionalInfo: {},
        supportingDevice: {},
    }
}
const createFormData = (): FormData => {
    return {
        slug: '',
        iconUrl: '/uploads/aaa.jpg',
        qrCodeUrl: '',
        publishAt: '',
        offlineAt: '',
        iconFile: null,
        qrCodeFile: null,
        stopUpdating: false,
        isHideen: false,
        countries: [],
        productIds: [],
        downloadBaseCategoryIds: [],
        name: {},
        description: {},
        status: {},
        ios: createAppCategory(),
        google: createAppCategory(),
        apk: createAppCategory(),
    }
}
const formData = reactive<FormData>(createFormData())
const [detail, detailInst] = useRequest({
    manualRequest: true,
    request: async (params) => {
        return {}
    }
})
const rules: TdFormProps['rules'] = {
    slug: [{ required: true, whitespace: true, message: '请输入slug' }],
    status: [{
        required: true, validator: (val: any) => {
            if (val !== null && typeof val === 'object' && Object.keys(val).length > 0) {
                return true
            }
            return {
                result: false,
                message: '请选择状态',
                type: 'error'
            }
        }
    }],
    publishAt: [{ required: true, message: '请选择上线时间' }],
    offlineAt: [{ required: true, message: '请选择下线时间' }],
}

const [productState, productStateInst] = useRequest({
    manualRequest: false,
    defaultValue: [],
    request: async (params) => {
        return [{
            label: '产品1',
            value: 1
        }, {
            label: '产品2',
            value: 2
        }]
    }
})
const [downloadBaseCategoryState, downloadBaseCategoryStateInst] = useRequest({
    manualRequest: false,
    defaultValue: [],
    request: async (params) => {
        return [{
            label: '下载分类1',
            value: 1
        }, {
            label: '下载分类2',
            value: 2
        }]
    }
})
const handleReturn = () => {
    router.push({ path: './apps' })
}

// 工具函数：将嵌套对象转换为 FormData
function objectToFormData(obj:Record<string,any>, formData = new FormData(), parentKey = '') {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const fieldName = parentKey ? `${parentKey}[${key}]` : key;
            
            if (value === null || value === undefined) {
                continue;
            }
            
            // 处理 File 或 Blob 对象
            if (value instanceof File || value instanceof Blob) {
                formData.append(fieldName, value);
            }
            // 处理数组
            else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (item instanceof File || item instanceof Blob) {
                        formData.append(`${fieldName}[${index}]`, item);
                    } else if (typeof item === 'object') {
                        objectToFormData(item, formData, `${fieldName}[${index}]`);
                    } else {
                        formData.append(`${fieldName}[${index}]`, String(item));
                    }
                });
            }
            // 处理普通对象
            else if (typeof value === 'object') {
                objectToFormData(value, formData, fieldName);
            }
            // 处理基本类型
            else {
                formData.append(fieldName, String(value));
            }
        }
    }
    return formData;
}
const handleSubmit: TdFormProps['onSubmit'] = async (e) => {
    if(e.validateResult!==true){
        return
    }
    console.log('handleSubmit', toRaw(formData))
    const form = objectToFormData(toRaw(formData))
   // console.log('handleSubmit', form)

  // let form=new FormData()
   //form.append('obj[slug]', formData.slug)
    request({
        url: '/api/savefile',
        method: 'POST',
        data: form,
        // headers: {
        //     'Content-Type': 'multipart/form-data'
        // }
    }).then(res => {
        console.log('handleSubmit:success', res)
    }).catch(err => {
        console.log('handleSubmit:error', err)
    })
}

</script>
<template>
    <MainLayout :show-not-found="!!detail.error" :loading="detail.loading" :title="pageInfo.title" layout="edit"
        show-lang :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form @submit="handleSubmit" :data="formData"  class="w-full" label-align="top">
            <t-collapse :default-expand-all="true" :expand-mutex="false" :expand-on-row-click="true"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="1">
                    <template #header>
                        <div class="header">基础信息</div>
                    </template>
                    <t-form-item label="Slug" name="slug">
                        <t-input :maxlength="255" v-model.trim="formData.slug" placeholder="请输入slug" />
                        <template #tips>
                            仅可用英文、数字、下划线和短横线
                        </template>
                    </t-form-item>
                    <t-form-item label="Icon" name="iconUrl">
                        <UploadImage v-model="formData.iconUrl" v-model:rawfile="formData.iconFile" />
                    </t-form-item>
                    <t-form-item label="QR Code" name="qrCodeUrl">
                        <UploadImage v-model="formData.qrCodeUrl" v-model:rawfile="formData.qrCodeFile" />
                    </t-form-item>
                    <t-form-item label="名称" name="name">
                        <FLanguageFields title="名称" placeholder="下载APP名称" :field-props="{ maxlength: 255 }"
                            v-model="formData.name" btn-text="编辑" />
                    </t-form-item>
                    <t-form-item label="描述" name="description">
                        <FLanguageFields title="描述" placeholder="下载APP描述" type="textarea" v-model="formData.description"
                            btn-text="编辑" />
                    </t-form-item>
                    <t-form-item label="停止更新" name="stopUpdating">
                        <t-switch v-model="formData.stopUpdating" :custom-value="[true, false]"
                            :label="['ON', 'OFF']" />
                    </t-form-item>
                    <t-form-item label="隐藏在下载中心" name="isHideen">
                        <t-switch v-model="formData.isHideen" :custom-value="[true, false]" :label="['ON', 'OFF']" />
                    </t-form-item>
                    <t-form-item label="发布状态" name="status">
                        <FLanguageFields title="发布状态" default-value="Draft" placeholder="下载APP发布状态" type="select"
                            :options="[{ value: 'Draft', label: '草稿' }, { value: 'Publish', label: '发布' }]"
                            v-model="formData.status" btn-text="编辑" />
                    </t-form-item>
                    <t-form-item label="上线时间" name="publishAt">
                        <t-date-picker format="YYYY-MM-DD HH:mm:ss" :enable-time-picker="true"
                            v-model="formData.publishAt" />
                    </t-form-item>
                    <t-form-item label="下线时间" name="offlineAt">
                        <t-date-picker format="YYYY-MM-DD HH:mm:ss" :enable-time-picker="true"
                            v-model="formData.offlineAt" />
                    </t-form-item>
                    <t-form-item label="国家" name="countries">

                    </t-form-item>
                    <t-form-item label="关联产品" name="productIds">
                        <t-select :scroll="{ type: 'virtual' }" v-model="formData.productIds" :multiple="true"
                            :options="productState.data" filterable placeholder="请选择产品ID" />
                    </t-form-item>
                    <t-form-item label="应用分类" name="downloadBaseCategoryIds">
                        <t-select :scroll="{ type: 'virtual' }" v-model="formData.downloadBaseCategoryIds"
                            :multiple="true" :options="downloadBaseCategoryState.data" filterable
                            placeholder="请选择应用分类" />
                    </t-form-item>
                </t-collapse-panel>

                <t-collapse-panel value="2">
                    <template #header>
                        <div class="header">IOS</div>
                    </template>
                    <APPFormItem prefix="ios" v-model="formData.ios"/>
                </t-collapse-panel>
                <t-collapse-panel value="3">
                    <template #header>
                        <div class="header">Google Play</div>
                    </template>
                    <APPFormItem prefix="google" v-model="formData.google"/>
                </t-collapse-panel>
                <t-collapse-panel value="4">
                    <template #header>
                        <div class="header">APK</div>
                    </template>
                    <APPFormItem prefix="apk" v-model="formData.apk"/>
                </t-collapse-panel>

            </t-collapse>

            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">提交</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
  
</template>
<style lang="css" scoped>
.header {
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}
</style>