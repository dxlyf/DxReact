<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import type { TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import { confirm, confirmDelete, delay } from '@/views/example/tdesign/util'
import { SearchForm, type SearchField } from '@/views/example/tdesign/components/FSearchForm'
import TableAction from '@/views/example/tdesign/components/FTable/TableAction.vue'

const router = useRouter()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '角色管理',
        to: '/example/tdesign/user/role'
    },
    {
        content: 'index'
    }
]

type RoleRecord = {
    id: number
    roleName: string
    description: string
    module: string
    languagePermissions: string[]
    adAccounts: string[]
    permissionDesign: string[]
    status: 'enabled' | 'disabled'
}

const mockData: RoleRecord[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    roleName: `角色名称${i + 1}`,
    description: `这是角色${i + 1}的描述信息`,
    module: i % 3 === 0 ? '系统管理' : i % 3 === 1 ? '内容管理' : '用户管理',
    languagePermissions: i % 2 === 0 ? ['中文', '英文', '日文'] : ['中文', '英文'],
    adAccounts: i % 3 === 0 ? ['admin', 'developer'] : i % 3 === 1 ? ['admin'] : ['operator', 'viewer'],
    permissionDesign: i % 2 === 0 ? ['读取', '写入', '删除'] : ['读取'],
    status: i % 4 === 0 ? 'disabled' : 'enabled'
}))

const [tableProps, tableInst] = useTable<RoleRecord>({
    manualRequest: false,
    request: async (params) => {
        const { roleName, status, ...rest } = params
        let filtered = mockData.filter(item => {
            if (roleName && !item.roleName.includes(roleName)) return false
            if (status && item.status !== status) return false
            return true
        })
        return {
            success: true,
            records: filtered.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: filtered.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        title: '角色名称',
        colKey: 'roleName',
        width: 160,
        ellipsis: true
    },
    {
        title: '描述',
        colKey: 'description',
        ellipsis: true
    },
    {
        title: '所属模块',
        colKey: 'module',
        width: 120
    },
    {
        title: '语言权限',
        colKey: 'languagePermissions',
        width: 240
    },
    {
        title: 'AD账号',
        colKey: 'adAccounts',
        width: 220
    },
    {
        title: '权限设计',
        colKey: 'permissionDesign',
        width: 220
    },
    {
        title: '状态',
        colKey: 'status',
        width: 100
    },
    {
        title: '操作',
        colKey: 'actions',
        width: 160
    }
]

const searchColumns: SearchField[] = [
    {
        name: 'roleName',
        type: 't-input',
        props: {
            placeholder: '请输入角色名称'
        }
    },
    {
        name: 'status',
        type: 't-select',
        defaultValue: '',
        props: {
            placeholder: '请选择状态',
            options: [
                { label: '全部', value: '' },
                { label: '启用', value: 'enabled' },
                { label: '禁用', value: 'disabled' }
            ]
        }
    }
]

const handleSearch = (params: any) => {
    tableInst.query(params)
}

const handleCreate = () => {
    router.push({ path: './role/new' })
}

const handleEdit = (row: RoleRecord) => {
    router.push({ path: './role/edit', query: { id: row.id } })
}

const handleDelete = (row: RoleRecord) => {
    confirmDelete({
        onConfirm: async () => {
            await delay(1000)
            console.log('删除角色', row)
            tableInst.refresh()
        },
        onCancel: () => {
            console.log('取消删除')
        }
    })
}

const actions = [
    {
        label: '编辑',
        key: 'edit',
        order: 1000,
        onClick: (data: RoleRecord) => {
            handleEdit(data)
        }
    },
    {
        label: '删除',
        key: 'delete',
        order: 900,
        props: {
            theme: 'danger'
        },
        confirm: {
            body: '确认删除该角色吗？'
        },
        onClick: async (data: RoleRecord) => {
            await delay(2000)
            console.log('删除角色', data)
            tableInst.refresh()
        }
    }
]
</script>

<template>
    <MainLayout layout="list" show-lang title="角色管理" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新增角色</t-button>
            </t-space>
        </template>

        <SearchForm :columns="searchColumns" @change="handleSearch" />

        <Table v-bind="tableProps" :columns="columns">
            <template #roleName="{ row }">
                <t-link theme="primary">{{ row.roleName }}</t-link>
            </template>

            <template #description="{ row }">
                {{ row.description || '-' }}
            </template>

            <template #module="{ row }">
                {{ row.module || '-' }}
            </template>

            <template #languagePermissions="{ row }">
                <t-space v-if="row.languagePermissions && row.languagePermissions.length">
                    <t-tag v-for="(lang, i) in row.languagePermissions" :key="i" variant="light" theme="primary">
                        {{ lang }}
                    </t-tag>
                </t-space>
                <span v-else>-</span>
            </template>

            <template #adAccounts="{ row }">
                <t-space v-if="row.adAccounts && row.adAccounts.length">
                    <t-tag v-for="(account, i) in row.adAccounts" :key="i" variant="light" theme="warning">
                        {{ account }}
                    </t-tag>
                </t-space>
                <span v-else>-</span>
            </template>

            <template #permissionDesign="{ row }">
                <t-space v-if="row.permissionDesign && row.permissionDesign.length">
                    <t-tag v-for="(perm, i) in row.permissionDesign" :key="i" variant="light" theme="success">
                        {{ perm }}
                    </t-tag>
                </t-space>
                <span v-else>-</span>
            </template>

            <template #status="{ row }">
                <t-tag variant="light" :theme="row.status === 'enabled' ? 'success' : 'danger'">
                    {{ row.status === 'enabled' ? '启用' : '禁用' }}
                </t-tag>
            </template>

            <template #actions="{ row }">
                <TableAction :data="row" :items="actions" />
            </template>
        </Table>
    </MainLayout>
</template>

<style scoped>
</style>
