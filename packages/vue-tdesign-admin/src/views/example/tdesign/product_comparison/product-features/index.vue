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
    content: '产品关键特性',
    to: '/example/tdesign/product_comparison/product-features'
  }
]

const categoryNames = ['关键特性分类一', '关键特性分类二', '关键特性分类三', '关键特性分类四', '关键特性分类五']

const featureNames = ['特性A', '特性B', '特性C', '特性D', '特性E', '特性F', '特性G', '特性H', '特性I', '特性J', '特性K', '特性L', '特性M', '特性N']

type ProductFeature = {
  id: number;
  title: string;
  slug: string;
  category: string;
  features: string[];
}

const mockData: ProductFeature[] = Array.from({ length: 68 }, (_, i) => {
  const assignedFeatures = featureNames.filter(() => Math.random() > 0.4)
  return {
    id: i + 1,
    title: `产品特性${i + 1}`,
    slug: `product-feature-${i + 1}`,
    category: categoryNames[i % categoryNames.length],
    features: assignedFeatures.length ? assignedFeatures : [featureNames[i % featureNames.length]]
  }
})

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
    colKey: 'rowIndex',
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
    title: '关联分类',
    colKey: 'category',
    width: 160
  },
  {
    title: '包含特性',
    colKey: 'features',
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

const handleEdit = (row: ProductFeature) => {
  router.push({ path: './edit', query: { id: row.id } })
}

const handleDelete = (row: ProductFeature) => {
  DialogPlugin.confirm({
    theme: 'danger',
    header: '确认删除',
    body: `确定删除「${row.title}」吗？`,
    onConfirm: () => {
      console.log('删除产品关键特性', row)
    },
    onCancel: () => {
      console.log('取消删除')
    }
  })
}

tableInst.query()
</script>

<template>
  <MainLayout :breadcrumbOptions="breadcrumbOptions" title="产品关键特性列表" layout="list" :showLang="true">
    <template #operation>
      <t-space>
        <t-button theme="primary" @click="handleCreate">新增</t-button>
      </t-space>
    </template>
    <Table v-bind="tableProps" :columns="columns">
      <template #rowIndex="{ rowIndex }">
        {{ rowIndex + 1 }}
      </template>
      <template #title="{ row }">
        <t-link theme="primary">{{ row.title || '-' }}</t-link>
      </template>
      <template #slug="{ row }">
        {{ row.slug || '-' }}
      </template>
      <template #category="{ row }">
        <t-tag variant="light" theme="warning" size="small">{{ row.category || '-' }}</t-tag>
      </template>
      <template #features="{ row }">
        <FTagList v-if="row.features && row.features.length" :items="row.features" theme="primary" />
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
