<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, reactive, shallowReactive, shallowRef, toRaw, watch } from 'vue'
import { useRequest } from 'src/hooks/useRequest2'
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import UploadImage from '@/views/example/tdesign/components/FUpload/FUploadImage.vue'
import FUploadCover2 from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'

import FLanguageFields from '@/views/example/tdesign/components/FLanguageFields/index.vue'
import APPFormItem, { type APPCategoryDTO } from '@/views/example/tdesign/download/apps/APPFormItem.vue'
import { TdFormProps } from 'tdesign-vue-next'
import { cloneDeep } from 'lodash-es'
import { request } from 'src/utils/request'
import DownLoadVersionFields, { type DownloadVersionDTO } from './DownLoadVersionFields.vue'
import DocumentFields, { type DocumentDTO } from './DocumentFields.vue'
import { confirm } from '@/views/example/tdesign/util'
import FSelectPagination from '@/views/example/tdesign/components/FSelectPagination/index.vue'
import { delay } from 'src/utils'
type LocaleContentItem = Record<string, string>


type FormData = {
    id?: string
    slug: string
    productTitle: string
    productTitleId?: number
    firmwareCategoryId: string
    stopUpdating: boolean
    status: Record<string, string>
    publishAt: string
    countries: string[]
    version: string
    url: string
    releaseAt: string
    products: {value:string,label:string}[]
    downloadVersions: DownloadVersionDTO[]
    documents: DocumentDTO[]
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
                title: '新增固件'
            }
        case 'edit':
            return {
                title: '编辑固件',

            }
    }
})
const breadcrumbOptions = computed(() => {
    return [{
        content: '首页',
        to: '/'
    },
    {
        content: '固件列表',
        to: '/example/tdesign/download/firmwares'
    },
    {
        content: pageInfo.value.title
    }]
})
const props = defineProps<Props>()
const submitLoading = shallowRef(false)
const router = useRouter()
const route=useRoute()

const createFormData = (): FormData => {
    return {
        slug: '',
        productTitle: '',
        productTitleId: undefined,
        firmwareCategoryId: '',
        stopUpdating: false,
        status: {},
        publishAt: '',
        countries: [],
        version: '',
        url: '',
        releaseAt: '',
        products: [],
        downloadVersions: [],
        documents:[]
    }
}
const formData = reactive<FormData>(createFormData())
const [detail, detailInst] = useRequest({
    manualRequest:!route.query.id,
    request: async (params) => {
        //await delay(2000)
        return {
            id: 1,
            slug: 'firmware1',
            productTitle: '固件1',
            productTitleId: 1,
            firmwareCategoryId: 'category1',
            stopUpdating: false,
            status: { '1': '已发布' },
            publishAt: '2023-01-01',
            countries: ['中国', '美国'],
            version: '1.0.0',
            url: 'https://www.baidu.com',
            releaseAt: '2023-01-01',
            products: [{ value: '1', label: '产品1' }],
            downloadVersions: [{ version: '1.0.0', url: 'https://www.baidu.com' }],
            documents: [{ categoryId: 'category1', linksAttributes:[
                {
                    locale:'zh-CN',
                    url:'https://www.baidu.comfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                    version:'1.0.0',
                    releaseAt:'2023-01-01'
                }, {
                    locale:'zh-CN',
                    url:'https://www.baidu.comfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                    version:'',
                    releaseAt:''
                }
            ] }] 
        }
    },
    onSuccess: (data: any) => {
        formData.id = data.id
        formData.slug = data.slug
        formData.productTitle = data.productTitle
        formData.productTitleId = data.productTitleId
        formData.firmwareCategoryId = data.firmwareCategoryId
        formData.stopUpdating = data.stopUpdating
        formData.status = data.status
        formData.publishAt = data.publishAt
        formData.countries = data.countries
        formData.version = data.version
        formData.url = data.url
        formData.releaseAt = data.releaseAt
        formData.products = data.products
        formData.downloadVersions = data.downloadVersions
        formData.documents = data.documents
    }
})

const productData=Array.from({length:100},(item,index)=>({
    label:`产品${index+1}`,
    value:(index+1)+''
}))
const handleRequestProduct=({keywork,current,pageSize})=>{
         let data=productData
        if(keywork){
            data=productData.filter(item=>item.label.includes(keywork))
        }
        return {
            total:data.length,
            records:data.slice((current-1)*pageSize,current*pageSize)
        }     
}
const rules: TdFormProps['rules'] = {
    slug: [{ required: true, whitespace: true, message: '请输入唯一标识符' }],
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
    publishAt: [{ required: true, message: '请选择发布时间' }],
    products: [{ required: true, message: '请选择关联产品' }],
    url: [{ pattern: /^https?:\/\//, message: '下载链接地址：请以http或https协议开头' }]
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
const [firmwareCategoryState, firmwareCategoryStateInst] = useRequest({
    manualRequest: false,
    defaultValue: [],
    request: async (params) => {
        return [{
            label: '固件分类1',
            value: 1
        }, {
            label: '固件分类2',
            value: 2
        }]
    }
})
const [docCategoryState, docCategoryStateInst] = useRequest({
    manualRequest: false,
    defaultValue: [],
    request: async (params) => {
        return [{
            label: '文档分类1',
            value: 1
        }, {
            label: '文档分类2',
            value: 2
        }]
    }
})
const handleReturn = () => {
    router.push({ path: '../firmwares' })
}


const handleSubmit: TdFormProps['onSubmit'] = async (e) => {
    if (e.validateResult !== true) {
        return
    }
    console.log('handleSubmit', toRaw(formData))

}
// 版本项tab
const activeVersionTabKey = shallowRef('0')
// 添加版本项
const handleAddVersionItem = () => {
    activeVersionTabKey.value = formData.downloadVersions.length + ''
    formData.downloadVersions.push({
        categoryId: '',
        url: '',
        version: '',
        releaseAt: '',
        countries: []
    })
}
// 删除版本项
const handleRemoveVersionItem = (i: number) => {
    confirm({
        header: '删除确认',
        body: '确认删除吗？',
        confirmBtn: {
            theme: 'danger'
        },
        onConfirm: async () => {
            formData.downloadVersions.splice(i, 1)
           // activeVersionTabKey.value = (formData.downloadVersions.length - 1) + ''
        },
        onCancel: () => {
            console.log('取消删除');
        }
    })
}

// 添加文档项
const handleAddDocumentItem = () => {
    const linksAttributes=[]
    linksAttributes.push({
        locale: 'english',
        url: '',
        version: '',
        releaseAt: ''
    })
    formData.documents.push({
        categoryId: '',
        linksAttributes: linksAttributes
    })
}
// 删除文档项
const handleRemoveDocumentItem = (i: number) => {
    confirm({
        header: '删除确认',
        body: '确认删除吗？',
        confirmBtn: {
            theme: 'danger'
        },
        onConfirm: async () => {
            formData.documents.splice(i, 1)
        },
        onCancel: () => {
            console.log('取消删除');
        }
    })
}
const formatlabel=(item:any)=>{
    return `(${item.value}) ${item.label}`
}
</script>
<template>
    <MainLayout :show-not-found="!!detail.error" :loading="detail.loading" :title="pageInfo.title" layout="edit"
        show-lang :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form @submit="handleSubmit" :data="formData" :rules="rules" class="w-full" label-align="top">
            <t-collapse class="f-form-collapse" :default-expand-all="true" :expand-mutex="false"
                :expand-on-row-click="false" expand-icon-placement="right" borderless>
                <t-collapse-panel value="1">
                    <template #header>
                        <div class="header">基础信息</div>
                    </template>
                    <t-form-item label="唯一标识符" name="slug">
                        <t-input :maxlength="255" v-model.trim="formData.slug" />
                        <template #tips>
                            仅可用英文、数字、下划线和短横线
                        </template>
                    </t-form-item>
                    <t-form-item label="关联产品标题" name="productTitleId">
                        <t-select :scroll="{ type: 'virtual' }" v-model="formData.productTitleId"
                            :options="productState.data" filterable />
                    </t-form-item>
                    <t-form-item label="固件分类" name="firmwareCategoryId">
                        <t-select :scroll="{ type: 'virtual' }" v-model="formData.firmwareCategoryId"
                            :options="firmwareCategoryState.data" filterable />
                    </t-form-item>
                    <t-form-item label="停止更新" name="stopUpdating">
                        <t-switch v-model="formData.stopUpdating" :custom-value="[true, false]"
                            :label="['ON', 'OFF']" />
                    </t-form-item>
                    <t-form-item label="发布状态" name="status">
                        <FLanguageFields title="发布状态" default-value="Draft" placeholder="固件发布状态" type="select"
                            :options="[{ value: 'Draft', label: '草稿' }, { value: 'Publish', label: '发布' }]"
                            v-model="formData.status" btn-text="编辑" />
                    </t-form-item>
                    <t-form-item label="发布时间" name="publishAt">
                        <t-date-picker format="YYYY-MM-DD HH:mm:ss" :enable-time-picker="true"
                            v-model="formData.publishAt" />
                    </t-form-item>

                    <t-form-item label="关联国家" name="countries">

                    </t-form-item>

                    <t-form-item label="版本号" name="version">
                        <t-input v-model.trim="formData.version" placeholder="e.g:v01.00.00.06" />
                    </t-form-item>
                    <t-form-item label="下载链接" name="url">
                        <t-input v-model.trim="formData.url" />
                    </t-form-item>
                    <t-form-item label="发布日期" name="releaseAt">
                        <t-date-picker format="YYYY-MM-DD" v-model="formData.releaseAt" />
                    </t-form-item>
                    <t-form-item label="关联产品" name="products">
                            <FSelectPagination :format-label="formatlabel" v-model="formData.products" :request="handleRequestProduct" :multiple="true" />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="2" class="f-version-collapse">
                    <template #header>
                        <div class="header">下载版本</div>
                    </template>
                    <template #headerRightContent>
                        <t-button size="small" theme="primary" variant='outline'
                            @click="handleAddVersionItem">新增版本</t-button>
                    </template>
                    <div class="f-version-body bg-[rgba(0,0,0,0.1)] p-4 [&>div:nth-child(n+2)]:mt-4"
                        v-if="formData.downloadVersions.length > 0">
                        <!-- <t-tabs v-model="activeVersionTabKey" theme="card" >
                        <t-tab-panel v-for="(item,index) in formData.downloadVersions" :key="index" :value="index + ''" :label="`版本${index}`">
                             <DownLoadVersionFields :category-options="firmwareCategoryState.data" v-model="formData.downloadVersions[index]"></DownLoadVersionFields>
                        </t-tab-panel>
                    </t-tabs> -->
                        <div v-for="(item, i) in formData.downloadVersions" :key="i" class="bg-white p-4">
                            <DownLoadVersionFields :prefix="`downloadVersions[${i}]`"
                                :category-options="firmwareCategoryState.data" v-model="formData.downloadVersions[i]">
                            </DownLoadVersionFields>
                            <div class="flex justify-end">
                                <t-button size="small" theme="danger" @click="handleRemoveVersionItem(i)">删除</t-button>
                            </div>
                        </div>
                    </div>

                </t-collapse-panel>


            <t-collapse-panel value="3" class="f-version-collapse" v-if="type!='create'">
                <template #header>
                    <div class="header">文档</div>
                </template>
                <template #headerRightContent>
                    <t-button size="small" theme="primary" variant='outline'
                        @click="handleAddDocumentItem">新增文档</t-button>
                </template>
                <div class="f-version-body bg-[rgba(0,0,0,0.1)] p-4 [&>div:nth-child(n+2)]:mt-4"
                    v-if="formData.documents.length > 0">
                    <!-- <t-tabs v-model="activeVersionTabKey" theme="card" >
                        <t-tab-panel v-for="(item,index) in formData.downloadVersions" :key="index" :value="index + ''" :label="`版本${index}`">
                             <DownLoadVersionFields :category-options="firmwareCategoryState.data" v-model="formData.downloadVersions[index]"></DownLoadVersionFields>
                        </t-tab-panel>
                    </t-tabs> -->
                    <div v-for="(item, i) in formData.documents" :key="i" class="bg-white p-4">
                        <DocumentFields :prefix="`documents[${i}]`"
                            :category-options="docCategoryState.data" v-model="formData.documents[i]">
                        </DocumentFields>
                        <div class="flex justify-end">
                            <t-button size="small" theme="danger" @click="handleRemoveDocumentItem(i)">删除</t-button>
                        </div>
                    </div>
                </div>

            </t-collapse-panel>


            </t-collapse>
            <div class="flex justify-end mt-4">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">新增固件</t-button>
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

.f-version-collapse :deep(.t-collapse-panel__content) {
    padding: 0 !important;
    background-color: transparent;
}

.f-version-collapse :deep(.t-tab-panel) {
    padding: 16px !important;
}
</style>