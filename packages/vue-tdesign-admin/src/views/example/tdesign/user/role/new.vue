<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue'
import { computed, reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import type { TdFormProps } from 'tdesign-vue-next'
import PermissionTree from './PermissionTree.vue'

const router = useRouter()

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '角色管理', to: '/example/tdesign/user/role' },
    { content: '新增角色' }
])

const languageOptions = [
    { label: '中文', value: 'zh-CN' },
    { label: '英文', value: 'en-US' },
    { label: '日文', value: 'ja-JP' },
    { label: '韩文', value: 'ko-KR' },
    { label: '法文', value: 'fr-FR' },
    { label: '德文', value: 'de-DE' },
    { label: '西班牙文', value: 'es-ES' },
    { label: '葡萄牙文', value: 'pt-PT' }
]

const accountOptions = [
    { label: 'admin', value: 'admin' },
    { label: 'developer', value: 'developer' },
    { label: 'operator', value: 'operator' },
    { label: 'viewer', value: 'viewer' },
    { label: 'editor', value: 'editor' },
    { label: 'manager', value: 'manager' }
]

const moduleOptions = [
    { label: '系统管理', value: '系统管理' },
    { label: '内容管理', value: '内容管理' },
    { label: '用户管理', value: '用户管理' },
    { label: '产品管理', value: '产品管理' },
    { label: '统计报表', value: '统计报表' }
]

type FormData = {
    roleName: string
    description: string
    languagePermissions: string[]
    adAccounts: string[]
    module: string
    permissionKeys: string[]
}

const formData = reactive<FormData>({
    roleName: '',
    description: '',
    languagePermissions: [],
    adAccounts: [],
    module: '',
    permissionKeys: []
})

const rules: TdFormProps['rules'] = {
    roleName: [{ required: true, message: '请输入角色名称' }]
}

const submitLoading = ref(false)
const expandedPanel = ref(['basic', 'permission'])

const handleReturn = () => {
    router.push({ path: '../role' })
}

const handleSubmit: TdFormProps['onSubmit'] = async (e) => {
    if (e.validateResult !== true) return
    try {
        submitLoading.value = true
        console.log('提交角色数据', toRaw(formData))
    } finally {
        submitLoading.value = false
    }
}
</script>

<template>
    <MainLayout layout="edit" :title="'新增角色'" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
        </template>
        <t-form :data="formData" :label-width="140" label-align="top" @submit="handleSubmit" class="w-full">
            <t-collapse v-model="expandedPanel" :expand-mutex="false" :expand-on-row-click="false"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="basic">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item label="角色名称" name="roleName" :rules="rules.roleName">
                        <t-input v-model="formData.roleName" placeholder="请输入角色名称" clearable />
                    </t-form-item>
                    <t-form-item label="描述" name="description">
                        <t-textarea v-model="formData.description" placeholder="请输入角色描述" :rows="4" clearable />
                    </t-form-item>
                    <t-form-item label="所属模块" name="module">
                        <t-select v-model="formData.module" :options="moduleOptions" placeholder="请选择所属模块" clearable />
                    </t-form-item>
                    <t-form-item label="语言权限" name="languagePermissions">
                        <t-select v-model="formData.languagePermissions" :options="languageOptions" placeholder="请选择语言权限"
                            multiple clearable filterable />
                    </t-form-item>
                    <t-form-item label="关联账号" name="adAccounts">
                        <t-select v-model="formData.adAccounts" :options="accountOptions" placeholder="请选择关联账号"
                            multiple clearable filterable />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="permission">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">菜单与操作权限</div>
                    </template>
                    <t-form-item label="权限菜单树" name="permissionKeys">
                        <PermissionTree v-model="formData.permissionKeys" />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
            </t-collapse>
            <div class="flex justify-end mt-8">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">新增角色</t-button>
                </t-space>
            </div>
        </t-form>
    </MainLayout>
</template>

<style scoped>
:deep(.t-collapse-panel__content),
:deep(.t-collapse-panel__header) {
    background: #fff;
}
</style>
