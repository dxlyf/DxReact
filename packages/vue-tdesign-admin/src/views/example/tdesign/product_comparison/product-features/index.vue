<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import Table from 'src/views/example/tdesign/components/FTable/index.vue';
import FTagList from 'src/views/example/tdesign/components/FTagList/index.vue';
import { formatDate } from '@/utils/formatDate'
import { SearchForm, type SearchField } from 'src/views/example/tdesign/components/FSearchForm';
import type { TableProps } from 'tdesign-vue-next';
import { DialogPlugin } from 'tdesign-vue-next';
import { useTable } from '../../hooks/useTable';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';

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

const categoryNames = ['关键特性分类一fdasdsa城十分大', '关键特性分类二', '关键特性分类三', '关键特性分类四', '关键特性分类五']

const featureNames = ['特性A', '特性B', '特性C', '特性D', '特性E', '特性F', '特性G', '特性H', '特性I', '特性J', '特性K', '特性L', '特性M', '特性N']

type ProductFeature = {
  id: number;
  title: string;
  slug: string;
  category: string;
  features: string[];
  createdAt: string;
}

const mockData: ProductFeature[] = Array.from({ length: 68 }, (_, i) => {
  const assignedFeatures = featureNames.filter(() => Math.random() > 0.4)
  return {
    id: i + 1,
    title: `产品特性${i + 1}`,
    slug: `product-feature-${i + 1}`,
    category: categoryNames[i % categoryNames.length],
    features: assignedFeatures.length ? assignedFeatures : [featureNames[i % featureNames.length]],
    createdAt: new Date(Date.now() - i * 86400000 * Math.random()).toISOString()
  }
})

const selectedRowKeys = ref<Array<string | number>>([])

const handleSelectChange: TableProps['onSelectChange'] = (keys) => {
  selectedRowKeys.value = keys
}

const searchColumns = computed<SearchField[]>(() => [
  {
    name: 'title',
    type: 't-input',
    defaultValue: '',
    props: {
      placeholder: '请输入产品名称',
      clearable: true
    }
  },
  {
    name: 'slug',
    type: 't-input',
    defaultValue: '',
    props: {
      placeholder: '请输入产品Slug',
      clearable: true
    }
  },
  {
    name: 'category',
    type: 't-select',
    defaultValue: '',
    props: {
      placeholder: '请选择关联分类',
      clearable: true,
      options: categoryNames.map(name => ({ label: name, value: name }))
    }
  }
])

const handleSearch = (params: Record<string, any>) => {
  selectedRowKeys.value = []
  tableInst.query(params)
}

const [tableProps, tableInst] = useTable({
  manualRequest: true,
  tableProps:{
    //tableContentWidth:'2000px',
    maxHeight:300
  },
  request: async (params) => {
    const { current, pageSize, ...rest } = params
    let filtered = mockData
    if (rest.title) {
      filtered = filtered.filter(item => item.title.includes(rest.title))
    }
    if (rest.slug) {
      filtered = filtered.filter(item => item.slug.includes(rest.slug))
    }
    if (rest.category) {
      filtered = filtered.filter(item => item.category === rest.category)
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
    type: 'multiple' as any,
    colKey:'',
    width: 60
  },
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
    width: 160,
  //  ellipsis: true
  },
  {
    title: '包含特性',
    colKey: 'features',
    minWidth:300
  },
  {
    title: '创建时间',
    colKey: 'createdAt',
    width: 180
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

const handleBatchDelete = () => {
  DialogPlugin.confirm({
    theme: 'danger',
    header: '确认批量删除',
    body: `确定删除已选中的 ${selectedRowKeys.value.length} 个产品关键特性吗？此操作不可撤销。`,
    onConfirm: () => {
      console.log('批量删除产品关键特性', selectedRowKeys.value)
      selectedRowKeys.value = []
      tableInst.refresh()
    },
    onCancel: () => {
      console.log('取消批量删除')
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

    <div class="flex">
      <div class="flex-auto">
        <SearchForm :defaultColumns="3" :columns="searchColumns" @change="handleSearch">
        </SearchForm>
      </div>
      <div class="flex-none w-[120px]">
        <t-space>
          <t-button :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete" theme="danger">批量删除{{ selectedRowKeys.length ? ` (${selectedRowKeys.length})` : '' }}</t-button>
        </t-space>
      </div>
    </div>

    <Table v-bind="tableProps" :columns="columns" :selectedRowKeys="selectedRowKeys" @select-change="handleSelectChange">
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
         <t-tooltip :content="row.category || '-'" >
          <t-tag variant="light" theme="warning" size="small" class="!inline-block truncate max-w-[140px]">{{ row.category || '-' }}</t-tag>
        </t-tooltip>
      </template>
      <template #features="{ row }">
        <FTagList v-if="row.features && row.features.length" :items="row.features" theme="primary" />
        <span v-else>-</span>
      </template>
      <template #createdAt="{ row }">
        {{ formatDate(row.createdAt) }}
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
