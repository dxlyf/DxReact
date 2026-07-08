<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref } from 'vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import type { TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import { confirmDelete, delay } from '@/views/example/tdesign/util'
import { SearchForm, type SearchField } from '@/views/example/tdesign/components/FSearchForm'
import TableAction from '@/views/example/tdesign/components/FTable/TableAction.vue'

const router = useRouter()

const breadcrumbOptions = [
  {
    content: '首页',
    to: '/',
  },
  {
    content: '联系我们',
    to: '/example/tdesign/support_contacts',
  },
  {
    content: '列表',
  },
]

type ContactRecord = {
  id: number
  version: string
  country: string
}

const mockData: ContactRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  version: `V${Math.floor(i / 5) + 1}.${(i % 5) + 1}.0`,
  country: ['中国', '美国', '日本', '德国', '法国'][i % 5],
}))

const [tableProps, tableInst] = useTable<ContactRecord>({
  manualRequest: false,
  request: async (params) => {
    const { version, country, ...rest } = params
    let filtered = mockData.filter((item) => {
      if (version && !item.version.includes(version)) return false
      if (country && !item.country.includes(country)) return false
      return true
    })
    return {
      success: true,
      records: filtered.slice(
        (params.current - 1) * params.pageSize,
        params.current * params.pageSize,
      ),
      total: filtered.length,
    }
  },
})

const columns: TableProps['columns'] = [
  {
    title: '版本',
    colKey: 'version',
    width: 200,
    ellipsis: true,
  },
  {
    title: '国家',
    colKey: 'country',
    width: 200,
    ellipsis: true,
  },
  {
    title: '操作',
    colKey: 'actions',
    width: 160,
  },
]

const searchColumns: SearchField[] = [
  {
    name: 'version',
    type: 't-input',
    props: {
      placeholder: '请输入版本',
    },
  },
  {
    name: 'country',
    type: 't-input',
    props: {
      placeholder: '请输入国家',
    },
  },
]

const handleSearch = (params: any) => {
  tableInst.query(params)
}

const handleEdit = (row: ContactRecord) => {
  router.push({ path: './edit', query: { id: row.id } })
}

const handleDelete = (row: ContactRecord) => {
  confirmDelete({
    onConfirm: async () => {
      await delay(1000)
      console.log('删除', row)
      tableInst.refresh()
    },
  })
}

const actions = [
  {
    label: '编辑',
    key: 'edit',
    order: 1000,
    onClick: (data: ContactRecord) => {
      handleEdit(data)
    },
  },
  {
    label: '删除',
    key: 'delete',
    order: 900,
    props: {
      theme: 'danger',
    },
    confirm: {
      body: '确认删除该记录吗？',
    },
    onClick: async (data: ContactRecord) => {
      await delay(2000)
      console.log('删除', data)
      tableInst.refresh()
    },
  },
]
</script>

<template>
  <MainLayout layout="list" show-lang title="联系我们" :breadcrumb-options="breadcrumbOptions">
    <template #operation>
      <t-space>
        <t-button theme="primary" @click="router.push('./edit')">新增</t-button>
      </t-space>
    </template>

    <SearchForm :columns="searchColumns" @change="handleSearch" />

    <Table v-bind="tableProps" :columns="columns">
      <template #version="{ row }">
        <t-link theme="primary">{{ row.version }}</t-link>
      </template>

      <template #country="{ row }">
        {{ row.country || '-' }}
      </template>

      <template #actions="{ row }">
        <TableAction :data="row" :items="actions" />
      </template>
    </Table>
  </MainLayout>
</template>

<style scoped>
</style>
