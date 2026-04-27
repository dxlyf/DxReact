<script setup lang="ts">
import { ref } from 'vue'
import CountrySelect from '@/components/country-select/index.vue'
export type DownloadVersionDTO={
    categoryId:string
    url:string
    version:string
    releaseAt:string
    countries:string[]
}
const props=defineProps<{
    prefix:string
    categoryOptions:{value:string,label:string}[]
}>()
const model=defineModel<DownloadVersionDTO>()

</script>
<template>
    <t-form-item label="固件分类" :name="`${prefix}.categoryId`">
        <t-select :scroll="{ type: 'virtual' }" v-model="model.categoryId" filterable  :options="categoryOptions"  />
    </t-form-item>
    <t-form-item label="下载链接地址" :name="`${prefix}.url`" :rules="[{pattern:/^https?:\/\//,message:'请输入正确的下载链接地址'}]" >
        <t-input v-model="model.url"  />
    </t-form-item>
    <t-form-item label="版本号" :name="`${prefix}.version`">
        <t-input v-model="model.version" placeholder="v1.2" />
    </t-form-item>
    <t-form-item label="发布时间" :name="`${prefix}.releaseAt`">
        <t-date-picker v-model="model.releaseAt" format="YYYY-MM-DD" />
    </t-form-item>
    <t-form-item label="适用国家" :name="`${prefix}.countries`" :rules="[{required:true,message:'请选择适用国家'}]">
        <CountrySelect v-model="model.countries" />
    </t-form-item>
</template>