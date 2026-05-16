<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import Table from 'src/views/example/tdesign/components/FTable/index.vue';
import FTagList from 'src/views/example/tdesign/components/FTagList/index.vue';
import type { TableProps } from 'tdesign-vue-next';
import { DialogPlugin } from 'tdesign-vue-next';
import { useTable } from '../../hooks/useTable';
import { useRouter } from 'vue-router';

const router = useRouter();

const breadcrumbOptions = [
  {
    content: '首页',
    to: '/'
  },
  {
    content: '关键特性分类',
    to: '/example/tdesign/product_comparison/key_feature_categories'
  }
]

type KeyFeatureCategory = {
  id: number;
  title: string;
  slug: string;
  feature: string[];
}

const mockData: KeyFeatureCategory[] = Array.from({ length: 68 }, (_, i) => ({
  id: i + 1,
  title: `关键特性分类${i + 1}`,
  slug: `key-feature-category-${i + 1}`,
  feature: Array.from({ length: 30 }, (_, j) => `特性${i * 10 + j + 1}`).filter(() => Math.random() > 0.3)
}))

const [tableProps, tableInst] = useTable({
  manualRequest: true,
  request: async (params) => {
    const { current, pageSize, ...rest } = params
    let filtered = mockData
    if (rest.title) {
      filtered = filtered.filter(item => item.title.includes(rest.title))
    }
    if (rest.slug) {
      filtered = filtered.filter(item => item.slug.includes(rest.slug))
    }
    return {
      success: true,
      records: filtered.slice((current - 1) * pageSize, current * pageSize),
      total: filtered.length
    }
  }
})

const columns: TableProps['columns'] = [
  {
    title: '#',
    colKey: 'serial-number',
    width: 60
  },
  {
    title: '标题',
    colKey: 'title',
    width: 200,
    ellipsis: true
  },
  {
    title: '唯一标识',
    colKey: 'slug',
    width: 200,
    ellipsis: true
  },
  {
    title: '包含特性',
    colKey: 'feature',
  },
  {
    title: '操作',
    colKey: 'actions',
    width: 160
  }
]

const handleCreate = () => {
  router.push({ path: './new' })
}

const handleEdit = (row: KeyFeatureCategory) => {
  router.push({ path: './edit', query: { id: row.id } })
}

const handleDelete = (row: KeyFeatureCategory) => {
  DialogPlugin.confirm({
    theme: 'danger',
    header: '确认删除',
    body: `确定删除「${row.title}」吗？`,
    onConfirm: () => {
      console.log('删除关键特性分类', row)
    },
    onCancel: () => {
      console.log('取消删除')
    }
  })
}

tableInst.query()
</script>

<template>
  <MainLayout :breadcrumbOptions="breadcrumbOptions" title="关键特性分类列表" layout="list" :showLang="true">
    <template #operation>
      <t-space>
        <t-button theme="primary" @click="handleCreate">新增</t-button>
      </t-space>
    </template>
    <Table v-bind="tableProps" :columns="columns">
      <template #title="{ row }">
        <t-link theme="primary">{{ row.title || '-' }}</t-link>
      </template>
      <template #slug="{ row }">
        {{ row.slug || '-' }}
      </template>
      <template #feature="{ row }">
        <FTagList v-if="row.feature && row.feature.length" :items="row.feature" />
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <t-space>
          <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
          <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
        </t-space>
      </template>
    </Table>
  </MainLayout>
</template>
