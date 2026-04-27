<script setup lang="ts">
import { ref } from 'vue'
import CountrySelect from '@/components/country-select/index.vue'
import {useLang} from '@/hooks/useLang'

export type LinkAttributeDTO={
   locale:string
   url:string
   version:string
   releaseAt:string
}
export type DocumentDTO = {
    categoryId: string
    linksAttributes:LinkAttributeDTO[]
}
const props = defineProps<{
    prefix: string
    categoryOptions: { value: string, label: string }[]
}>()
const model = defineModel<DocumentDTO>()


</script>
<template>
    <t-form-item label="固件分类" :name="`${prefix}.categoryId`">
        <t-select :scroll="{ type: 'virtual' }" v-model="model.categoryId" filterable :options="categoryOptions" />
    </t-form-item>
   <div>
    <t-row :gutter="8" class="py-4!">
        <t-col flex="120px">语言</t-col>
        <t-col flex="auto">链接</t-col>
        <t-col flex="200px">版本</t-col>
        <t-col flex="auto">发布日期</t-col>
    </t-row>
     <t-row  :gutter="8" align="middle" v-for="(item,index) in model.linksAttributes" :key="index">
        <t-col flex="120px">{{item.locale}}</t-col>
        <t-col flex="auto">
            <form-item :name="`${prefix}.linksAttributes[${index}].url`">
                <t-input v-model.trim="item.url" />
            </form-item>
            <div></div>
        </t-col>
        <t-col flex="200px">
            <form-item :name="`${prefix}.linksAttributes[${index}].version`">
                <t-input v-model.trim="item.version" />
            </form-item>
            <div></div>
        </t-col>
        <t-col flex="auto">
            <form-item :name="`${prefix}.linksAttributes[${index}].releaseAt`">
                <t-date-picker v-model.trim="item.releaseAt" format="YYYY-MM-DD" />
            </form-item>
            <div></div>
        </t-col>
    </t-row>
   </div>
</template>