<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import BasicInfo from './components/BasicInfo.vue'
import TechSpecs from './components/TechSpecs.vue'
import Downloads from './components/Downloads.vue'
import Faq from './components/Faq.vue'
import { ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

type TabItem = {
    value: string
    label: string
    component: Component
    props?: Record<string, any>
}

const tabs: TabItem[] = [
    { value: 'basic_info', label: 'BasicInfo', component: BasicInfo, props: { submitText: '保存' } },
    { value: 'tech_specs', label: 'TechSpecs', component: TechSpecs },
    { value: 'downloads', label: 'Downloads', component: Downloads },
    { value: 'faq', label: 'Faq', component: Faq },
]

const tabKeys = tabs.map((tab) => tab.value)
const activeTab = ref<string>(
    tabKeys.includes(route.query.tab as string) ? (route.query.tab as string) : tabs[0].value,
)

const handleTabChange = (value: string | number) => {
    activeTab.value = value as string
    router.replace({
        query: {
            ...route.query,
            tab: value,
        },
    })
}

const pageInfo = { title: '编辑产品' }
const breadcrumbOptions = [
    { content: '首页', to: '/' },
    { content: '产品列表', to: '/example/tdesign/guava_products' },
    { content: pageInfo.title },
]

const handleReturn = () => {
    router.push('/example/tdesign/guava_products')
}
</script>
<template>
    <MainLayout layout="edit" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" @click="handleReturn">返回</t-button>
        </template>
        <t-tabs :value="activeTab" @change="handleTabChange">
            <t-tab-panel v-for="tab in tabs" :key="tab.value" :value="tab.value" :label="tab.label">
                <component :is="tab.component" v-bind="tab.props" />
            </t-tab-panel>
        </t-tabs>
    </MainLayout>
</template>
<style scoped></style>
