<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import Table from 'src/views/example/tdesign/components/FTable/index.vue';
import FTagList from 'src/views/example/tdesign/components/FTagList/index.vue';
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

let mockData: KeyFeatureCategory[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `关键特性分类${i + 1}`,
  slug: `key-feature-category-${i + 1}`,
  feature: Array.from({ length: 30 }, (_, j) => `特性${i * 10 + j + 1}`.repeat(Math.ceil(Math.random()*5))).filter(() => Math.random() > 0.3)
}))
mockData=[{"id":1,"title":"关键特性分类1","slug":"key-feature-category-1","feature":["特性1特性1特性1特性1","特性3特性3特性3特性3特性3","特性5特性5特性5","特性6特性6特性6特性6特性6","特性8特性8","特性9特性9","特性10特性10","特性11","特性12特性12特性12","特性14特性14特性14","特性15特性15特性15","特性16特性16特性16特性16","特性19特性19特性19","特性21特性21特性21特性21","特性25特性25特性25","特性26特性26特性26","特性27特性27","特性29特性29特性29特性29特性29"]},{"id":2,"title":"关键特性分类2","slug":"key-feature-category-2","feature":["特性11特性11特性11特性11特性11","特性12","特性16特性16特性16特性16特性16","特性17特性17特性17","特性18特性18特性18","特性19特性19特性19特性19","特性21特性21特性21特性21特性21","特性22","特性23特性23","特性25特性25特性25特性25","特性26特性26特性26","特性28特性28","特性29特性29","特性30特性30","特性31特性31特性31特性31","特性32特性32特性32特性32","特性33特性33特性33特性33特性33","特性35特性35特性35","特性36特性36特性36特性36特性36","特性37特性37","特性38特性38特性38","特性39特性39特性39","特性40特性40特性40特性40特性40"]},{"id":3,"title":"关键特性分类3","slug":"key-feature-category-3","feature":["特性21特性21特性21特性21特性21","特性24","特性25","特性26特性26特性26","特性27特性27特性27特性27特性27","特性28特性28特性28特性28","特性30特性30","特性31特性31特性31特性31特性31","特性32特性32特性32","特性33特性33特性33特性33特性33","特性34特性34","特性35特性35","特性36特性36特性36特性36","特性37特性37","特性39特性39特性39","特性40特性40","特性41特性41特性41","特性43","特性44特性44特性44","特性45","特性46特性46特性46特性46","特性47特性47特性47特性47特性47"]},{"id":4,"title":"关键特性分类4","slug":"key-feature-category-4","feature":["特性31特性31特性31","特性35","特性36特性36","特性37","特性38特性38特性38特性38","特性39特性39特性39特性39","特性40特性40","特性41特性41","特性42特性42","特性43特性43特性43特性43","特性44特性44特性44","特性45特性45","特性46特性46特性46","特性47特性47特性47特性47特性47","特性50特性50","特性51特性51特性51","特性52特性52特性52特性52","特性53","特性55特性55特性55特性55特性55","特性56特性56特性56特性56","特性58","特性59特性59特性59特性59特性59","特性60特性60特性60特性60特性60"]},{"id":5,"title":"关键特性分类5","slug":"key-feature-category-5","feature":["特性41","特性42特性42特性42特性42","特性43特性43特性43特性43特性43","特性44特性44特性44特性44特性44","特性45特性45","特性47特性47特性47","特性48特性48特性48","特性49特性49","特性50特性50","特性53特性53特性53","特性54特性54特性54","特性55特性55特性55特性55","特性57特性57特性57特性57特性57","特性58特性58特性58特性58","特性59特性59特性59","特性61特性61特性61特性61","特性62","特性67","特性70"]},{"id":6,"title":"关键特性分类6","slug":"key-feature-category-6","feature":["特性51特性51特性51特性51特性51","特性53特性53","特性54特性54特性54特性54","特性56特性56","特性59","特性60特性60特性60特性60特性60","特性62","特性63特性63","特性64特性64特性64","特性65特性65特性65","特性67特性67特性67","特性68","特性69","特性71","特性72特性72特性72特性72","特性74","特性75","特性76特性76特性76特性76特性76","特性77","特性78特性78特性78特性78","特性80特性80特性80特性80"]},{"id":7,"title":"关键特性分类7","slug":"key-feature-category-7","feature":["特性62特性62特性62特性62特性62","特性64特性64特性64特性64","特性65特性65特性65特性65特性65","特性67特性67特性67特性67","特性68特性68特性68","特性70特性70特性70特性70特性70","特性72特性72","特性73特性73特性73特性73","特性74特性74特性74","特性76特性76特性76","特性77","特性78特性78","特性79","特性80特性80特性80","特性81特性81特性81特性81","特性82","特性84特性84","特性85特性85特性85特性85特性85","特性86特性86特性86特性86特性86","特性87特性87特性87特性87"]},{"id":8,"title":"关键特性分类8","slug":"key-feature-category-8","feature":["特性71特性71特性71","特性72特性72","特性73特性73特性73特性73特性73","特性74特性74特性74特性74","特性76特性76特性76特性76特性76","特性78特性78特性78特性78","特性80特性80特性80特性80特性80","特性81特性81特性81特性81","特性82特性82特性82","特性83特性83","特性86特性86特性86特性86","特性87特性87特性87","特性88特性88特性88","特性89特性89特性89特性89","特性90","特性91特性91特性91特性91","特性94","特性95特性95特性95","特性96特性96特性96特性96","特性97特性97特性97特性97","特性98特性98","特性99"]},{"id":9,"title":"关键特性分类9","slug":"key-feature-category-9","feature":["特性81特性81","特性82特性82特性82特性82特性82","特性83特性83","特性85特性85特性85特性85特性85","特性86特性86","特性87特性87特性87","特性88特性88","特性89","特性91特性91特性91特性91特性91","特性92特性92特性92","特性95特性95特性95特性95","特性96特性96特性96特性96特性96","特性99特性99特性99","特性105","特性106","特性107特性107特性107特性107","特性109特性109","特性110特性110"]},{"id":10,"title":"关键特性分类10","slug":"key-feature-category-10","feature":["特性91特性91","特性95特性95","特性96特性96特性96特性96特性96","特性97","特性98特性98特性98","特性99","特性100特性100特性100特性100特性100","特性101特性101","特性104特性104特性104特性104特性104","特性105特性105特性105特性105","特性106特性106特性106特性106特性106","特性107","特性108","特性109特性109特性109特性109","特性110特性110特性110","特性111","特性112特性112特性112","特性113特性113特性113特性113特性113","特性114特性114特性114特性114特性114","特性115特性115特性115","特性116特性116特性116特性116特性116","特性117特性117特性117","特性119特性119"]}]
const [tableProps, tableInst] = useTable({
  manualRequest: true,
  tableProps: {
    //tableLayout: 'fixed',
    //tableContentWidth: '2000px',
    maxHeight: 240,
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
    return {
      success: true,
      records: filtered.slice((current - 1) * pageSize, current * pageSize),
      total: filtered.length
    }
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
      placeholder: '请输入分类名称',
      clearable: true
    }
  },
  {
    name: 'slug',
    type: 't-input',
    defaultValue: '',
    props: {
      placeholder: '请输入分类标识',
      clearable: true
    }
  }
])

const handleSearch = (params: Record<string, any>) => {
  selectedRowKeys.value = []
  tableInst.query(params)
}

const columns: TableProps['columns'] = [
  {
    type: 'multiple' as any,
    colKey:'',
    width: 60
  },
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
    minWidth: 200,
  //  ellipsis: true
  },
    {
    title: '创建时间',
    colKey: 'createdAt',
    width: 200,
    ellipsis: true
  },
  {
    title: '操作',
    colKey: 'actions',
    fixed:'right',
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

const handleBatchDelete = () => {
  DialogPlugin.confirm({
    theme: 'danger',
    header: '确认批量删除',
    body: `确定删除已选中的 ${selectedRowKeys.value.length} 个关键特性分类吗？此操作不可撤销。`,
    onConfirm: () => {
      console.log('批量删除关键特性分类', selectedRowKeys.value)
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
  <MainLayout :breadcrumbOptions="breadcrumbOptions" title="关键特性分类列表" layout="list" :showLang="true">
    <template #operation>
      <t-space>
        <!-- <t-button theme="danger" :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">批量删除</t-button> -->
        <t-button theme="primary" @click="handleCreate">新增</t-button>
      </t-space>
    </template>

    <div class="flex">
      <div class="flex-1">
        <SearchForm :defaultColumns="3" :columns="searchColumns"  @change="handleSearch" >
      </SearchForm>
      </div>
      <div class="flex-none">
       <t-space>
                <t-button :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete" theme="danger" >批量删除</t-button>
       </t-space>
      </div>
    </div>
        <Table v-bind="tableProps" :columns="columns" :selectedRowKeys="selectedRowKeys" @select-change="handleSelectChange">
      <!-- <template #topContent>
       <div class="mb-2 flex justify-end">
         <t-space>
          <t-button theme="primary" @click="handleCreate">新增</t-button>
        </t-space>
       </div>
      </template> -->
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
