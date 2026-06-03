<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequest } from 'src/hooks/useRequest2';

type Props = {
    type: 'create' | 'edit' | 'copy'
    id?: string
}

const props = withDefaults(defineProps<Props>(), {
    id: ''
})
const router = useRouter()
const route = useRoute()
const editId = route.query.id as string || props.id

const pageInfo = computed(() => {
    switch (props.type) {
        case 'create':
        case 'copy':
            return { title: '新增二级导航' }
        case 'edit':
            return { title: '编辑二级导航' }
    }
})

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '新闻导航', to: '/example/tdesign/media/news_navs' },
    { content: pageInfo.value.title }
])

const linkTypeOptions = [
    { label: '请选择', value: '' },
    { label: '相对链接', value: 'relative-path' },
    { label: '绝对链接', value: 'absolute-path' },
]

const linkTargetOptions = [
    { label: '当前页打开', value: '_self' },
    { label: '新窗口打开', value: '_blank' },
]

const localeOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en' },
    { label: '日本語', value: 'ja' },
    { label: '한국어', value: 'ko' },
]

const countryOptions = [
    { label: '中国', value: 'CN' },
    { label: '美国', value: 'US' },
    { label: '日本', value: 'JP' },
    { label: '韩国', value: 'KR' },
    { label: '英国', value: 'GB' },
    { label: '德国', value: 'DE' },
]

const appOptions = [
    { label: '默认APP', value: 'default-app' },
]

type FormData = {
    id?: number
    name: string
    country: string[]
    sort: number
    app: string
    locale: string
    isSubscribe: boolean
    linkType: string
    linkTarget: string
    link: string
}

const createFormData = (): FormData => ({
    name: '',
    country: [],
    sort: 0,
    app: 'default-app',
    locale: '',
    isSubscribe: false,
    linkType: 'relative-path',
    linkTarget: '_self',
    link: '',
})

const formData = reactive<FormData>(createFormData())

watch(() => formData.linkType, (val) => {
    if (!val) {
        formData.link = ''
    }
})

watch(() => formData.isSubscribe, (val) => {
    if (val) {
        formData.linkType = ''
        formData.link = ''
    }
})

const linkRules = computed(() => {
    if (!formData.linkType) {
        return []
    }
    if (formData.linkType === 'absolute-path') {
        return [
            { required: true, whitespace: true, message: '请输入链接' },
            { pattern: /^https?:\/\//, message: '绝对链接必须以 http:// 或 https:// 开头' },
        ]
    }
    return [
        { required: true, whitespace: true, message: '请输入链接' },
        { pattern: /^\//, message: '相对链接必须以 / 开头' },
    ]
})

const rules = computed(() => ({
    name: [{ required: true, whitespace: true, message: '请输入名称' }],
    link: linkRules.value,
    sort: [
        { required: true, message: '请输入排序值' },
       // { pattern: /^\d+$/, message: '只能输入整数' },
        { validator: (val: number) => val >= 0, message: '值必须大于或等于0'},
        { validator: (val: number) => val <= 100 , message: '值必须小于等于100' },
    ],
}))

const linkTip = computed(() => {
    if (formData.linkType === 'absolute-path') {
        return '绝对链接格式：完整的URL，例如:https://www.example.com'
    }
    return '相对链接格式：以/开头，例如/news/category'
})

const submitLoading = ref(false)

const mockData: Record<string, FormData> = {
    '1': {
        id: 1,
        name: 'name1',
        country: ['CN', 'US'],
        sort: 80,
        app: 'default-app',
        locale: 'zh-CN',
        isSubscribe: true,
        linkType: 'absolute-path',
        linkTarget: '_blank',
        link: 'https://example.com/news/1',
    },
    '2': {
        id: 2,
        name: 'name2',
        country: ['JP', 'KR'],
        sort: 50,
        app: 'default-app',
        locale: 'en',
        isSubscribe: false,
        linkType: 'relative-path',
        linkTarget: '_self',
        link: '/news/2',
    },
}

const [detail, detailInst] = useRequest({
    manualRequest: true,
    request: async (params: { id: string }) => {
        return mockData[params.id] || null
    },
    onSuccess: (data) => {
        if (data) {
            formData.id = data.id
            formData.name = data.name
            formData.country = data.country
            formData.sort = data.sort
            formData.app = data.app
            formData.locale = data.locale
            formData.isSubscribe = data.isSubscribe
            formData.linkType = data.linkType
            formData.linkTarget = data.linkTarget
            formData.link = data.link
        }
    }
})

onMounted(() => {
    if (editId && props.type === 'edit') {
        detailInst.request({ id: editId })
    }
})

const handleSubmit = async (e: any) => {
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
    } finally {
        submitLoading.value = false
    }
}

const handleReturn = () => {
    router.push('/example/tdesign/media/news_navs')
}

const submitText = computed(() => {
    switch (props.type) {
        case 'create':
            return '新增'
        case 'edit':
            return '保存'
        case 'copy':
            return '新增'
    }
})
</script>

<template>
    <MainLayout layout="edit" :loading="detail.loading" :show-not-found="!!detail.error" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form :data="formData" :rules="rules" class="w-full" label-align="top" @submit="handleSubmit">
            <t-form-item label="名称" name="name">
                <t-input v-model.trim="formData.name" placeholder="请输入名称" :maxlength="255" />
            </t-form-item>
            <t-form-item label="国家" name="country">
                <t-select v-model="formData.country" :options="countryOptions" placeholder="请选择国家" multiple clearable />
            </t-form-item>
            <t-form-item label="排序" name="sort">
                <t-input-number v-model="formData.sort" :min="0" :max="100" theme="column" />
                <template #tips>
                    显示范围0-100，数字越大显示越靠前
                </template>
            </t-form-item>
            <t-form-item label="所属APP" name="app">
                <t-select v-model="formData.app" :options="appOptions" disabled />
                <template #tips>
                    所属App不可修改
                </template>
            </t-form-item>
            <t-form-item label="语言" name="locale">
                <t-select v-model="formData.locale" :options="localeOptions" placeholder="请选择语言" clearable />
            </t-form-item>
            <t-form-item label="是否订阅" name="isSubscribe">
                <t-switch v-model="formData.isSubscribe" :label="['是', '否']" />
                <template #tips>
                    如果选择订阅，则隐藏链接相关字段
                </template>
            </t-form-item>
            <template v-if="!formData.isSubscribe">
                <t-form-item label="链接类型" name="linkType">
                    <t-select v-model="formData.linkType" :options="linkTypeOptions" placeholder="请选择链接类型" />
                </t-form-item>
                <t-form-item label="链接打开方式" name="linkTarget">
                    <t-select v-model="formData.linkTarget" :options="linkTargetOptions" placeholder="请选择链接打开方式" />
                </t-form-item>
                <t-form-item label="链接" name="link">
                    <t-input v-model.trim="formData.link" placeholder="请输入链接" :maxlength="500" />
                    <template #tips>
                        {{ linkTip }}
                    </template>
                </t-form-item>
            </template>
            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">{{ submitText }}</t-button>
                </t-space>
            </div>
        </t-form>
    </MainLayout>
</template>
<style scoped>

</style>
