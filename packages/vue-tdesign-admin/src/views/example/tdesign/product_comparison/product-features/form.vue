<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, watch, onMounted, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRequest } from 'src/hooks/useRequest';
import FeatureTable from './FeatureTable.vue';
import type { FeatureItem } from './FeatureList.vue';
import { MessagePlugin, type UploadFile } from 'tdesign-vue-next';
import { useDialog } from '@/hooks/useDialog';
import { usePolling } from '@/hooks/usePolling';
import * as XLSX from 'xlsx';

type Props = {
    type: 'create' | 'edit' | 'copy'
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const editId = route.query.id
const pageInfo = computed(() => {
    switch (props.type) {
        case 'create':
        case 'copy':
            return { title: '新增产品关键特性' }
        case 'edit':
            return { title: '编辑产品关键特性' }
    }
})

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '产品关键特性', to: '/example/tdesign/product_comparison/product-features' },
    { content: pageInfo.value.title }
])

const productOptions = [
    { label: '产品一', value: '产品一', slug: 'product-1' },
    { label: '产品二', value: '产品二', slug: 'product-2' },
    { label: '产品三', value: '产品三', slug: 'product-3' },
    { label: '产品四', value: '产品四', slug: 'product-4' },
    { label: '产品五', value: '产品五', slug: 'product-5' }
]

const slugOptions = productOptions.map(p => ({ label: p.label, value: p.slug }))

const categoryOptions = [
    { label: '请选择关联分类', value: '' },
    { label: '关键特性分类一', value: '关键特性分类一' },
    { label: '关键特性分类二', value: '关键特性分类二' },
    { label: '关键特性分类三', value: '关键特性分类三' },
    { label: '关键特性分类四', value: '关键特性分类四' },
    { label: '关键特性分类五', value: '关键特性分类五' }
]

const mockCategoryFeatures: Record<string, FeatureItem[]> = {
    '关键特性分类一': [
        { id: 1, title: '屏幕尺寸', type: 'text', content: '6.7英寸' },
        { id: 2, title: '处理器', type: 'text', content: 'A17 Pro' },
        { id: 3, title: '产品图片', type: 'image', imageUrl: '/uploads/placeholder.jpg' }
    ],
    '关键特性分类二': [
        { id: 4, title: '电池容量', type: 'text', content: '5000mAh' },
        { id: 5, title: '充电功率', type: 'text', content: '120W' }
    ],
    '关键特性分类三': [
        { id: 6, title: '摄像头', type: 'text', content: '4800万像素' },
        { id: 7, title: '外观渲染图', type: 'image', imageUrl: '/uploads/placeholder.jpg' },
        { id: 8, title: '内存容量', type: 'text', content: '12GB' }
    ],
    '关键特性分类四': [
        { id: 9, title: '存储空间', type: 'text', content: '256GB' }
    ],
    '关键特性分类五': [
        { id: 10, title: '操作系统', type: 'text', content: 'iOS 18' },
        { id: 11, title: '重量', type: 'text', content: '200g' }
    ]
}

const mockProductData: Record<string, { title: string; slug: string; category: string; features: FeatureItem[] }> = {
    '1': {
        title: '产品一',
        slug: 'product-1',
        category: '关键特性分类一',
        features: [
            { id: 1, title: '屏幕尺寸', type: 'text', content: '6.7英寸', description: 'OLED屏幕', prefix: '约', floatComment: '仅供参考' },
            { id: 3, title: '产品图片', type: 'image', imageUrl: '/uploads/placeholder.jpg', description: '产品渲染图' }
        ]
    },
    '2': {
        title: '产品二',
        slug: 'product-2',
        category: '关键特性分类二',
        features: [
            { id: 4, title: '电池容量', type: 'text', content: '5000mAh', description: '大容量电池', floatComment: '典型值' },
            { id: 5, title: '充电功率', type: 'text', content: '120W', description: '快速充电', prefix: '最大' }
        ]
    }
}

type FormData = {
    title: string
    slug: string
    category: string
    features: FeatureItem[]
}

const formData = reactive<FormData>({
    title: '',
    slug: '',
    category: '',
    features: []
})

const rules = {
    slug: [{ required: true, message: '请选择产品Slug' }]
}

const submitLoading = ref(false)
const formRef = ref()
const collapseRef = ref()
const expandedPanel = ref(['basic', 'category', 'features'])
const isInitializing = ref(false)

const handleSlugChange = (value: string) => {
    const product = productOptions.find(p => p.slug === value)
    formData.title = product?.label ?? ''
}

watch(() => formData.category, (val) => {
    if (isInitializing.value) return
    if (val && mockCategoryFeatures[val]) {
        formData.features = mockCategoryFeatures[val].map(f => ({ ...f }))
    } else {
        formData.features = []
    }
})

const importFile = shallowRef<UploadFile[]>([])
const importLoading = ref(false)

const confirmLoading = computed(() => importLoading.value || pollingState.value === 'polling')

const mockImportApi = async (): Promise<{ code: number; data: { jobId: number } }> => {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return { code: 0, data: { jobId: Date.now() } }
}

const mockPollJobApi = async (jobId: number) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    jobId,
    status: 'importing',
    message: '导入中...',
    slug: `product-feature-${jobId}`
  }
}

const {
  pollingState,
  pollingCount,
  lastResult,
  start: startPolling,
  stop: stopPolling,
  resetPollingState
} = usePolling(async (jobId: number) => {
  if (pollingCount.value >= 5) {
    stopPolling()
    return {
      jobId,
      status: 'finished',
      message: '导入完成',
      slug: `product-feature-${jobId}`
    }
  }
  return mockPollJobApi(jobId)
}, {
  interval: 2000,
  maxRetries: 10,
  onError: (err) => {
    MessagePlugin.error(err.message)
  }
})

const [dialogProps, dialogInst] = useDialog(() => ({
  header: '导入数据',
  autoHeight: true,
  width: 520,
  confirmBtn: { loading: importLoading.value, theme: 'primary' as const, content: '确定导入' },
  onConfirm: handleImportConfirm,
  onClose: () => {
    importFile.value = []
    stopPolling()
    resetPollingState()
  }
}))

const handleImport = async () => {
  const validateResult = await formRef.value?.validate()
  if (validateResult !== true) {
    return
  }
  importFile.value = []
  dialogInst.open()
}

async function handleImportConfirm() {
  if (!importFile.value.length) {
    MessagePlugin.warning('请选择要上传的文件')
    return
  }
  try {
    importLoading.value = true
    const res = await mockImportApi()
    if (res.code === 0) {
      startPolling(res.data.jobId)
    }
  } catch {
    MessagePlugin.error('导入请求失败')
  } finally {
    importLoading.value = false
  }
}

watch(pollingState, (state) => {
  if (state === 'stopped') {
    if (lastResult.value?.status === 'finished') {
      MessagePlugin.success('导入成功')
      dialogInst.close()
    }
  }
})

const [detail, detailInst] = useRequest({
    manualRequest: true,
    service: async (params: { id: string }) => {
        return mockProductData[params.id] || null
    },
    onSuccess: (data) => {
        if (data) {
            formData.title = data.title
            formData.slug = data.slug
            formData.category = data.category
            formData.features = data.features.map(f => ({ ...f }))
        }
    },
    onComplete: () => {

    }
})

onMounted(() => {
    if (editId && props.type === 'edit') {
        detailInst.request()
    }
})

const handleReturn = () => {
    router.push('/example/tdesign/product_comparison/product-features')
}

const handleSubmit = async (e: any) => {
    if (e.validateResult !== true) return
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const handleDownloadTemplate = () => {
    if (!formData.category || !formData.features.length) {
        MessagePlugin.warning('请先选择关联关键特性分类')
        return
    }

    const productNames = productOptions.map(p => p.label)
    const featureTitles = formData.features.map(f => f.title)

    // Header row: 产品名称 + 各特性标题
    const header = ['产品名称', ...featureTitles]
    const data = [header]

    // Data rows: one row per product
    productNames.forEach(name => {
        const row = [name, ...featureTitles.map(() => '')]
        data.push(row)
    })

    const ws = XLSX.utils.aoa_to_sheet(data)

    // Set column widths
    ws['!cols'] = [
        { wch: 15 }, // 产品名称
        ...featureTitles.map(() => ({ wch: 20 }))
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '导入模板')
    XLSX.writeFile(wb, '产品特性分类模板.xlsx')
}
</script>

<template>
    <MainLayout layout="edit" :loading="detail.loading" :show-not-found="!!detail.error" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="default" @click="handleDownloadTemplate">下载导入模板</t-button>
                <t-button theme="default" @click="handleImport">导入</t-button>
                <t-button theme="default">导出</t-button>
                <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
            </t-space>
        </template>
        <t-form ref="formRef" :data="formData" :label-width="140" @submit="handleSubmit" class="w-full" label-align="top">
            <t-collapse ref="collapseRef" v-model="expandedPanel" :expand-mutex="false" :expand-on-row-click="false"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="basic">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item label="产品Slug" name="slug" :rules="rules.slug">
                        <t-select v-model="formData.slug" :options="slugOptions" placeholder="请选择产品Slug" filterable
                            clearable @change="handleSlugChange" />
                    </t-form-item>
                    <t-form-item  name="title">
                        <template #label>
                            <span>产品名称</span><span class="text-xs text-gray-400">（选择产品Slug后自动带出）</span>
                        </template>
                        <t-input v-model="formData.title" placeholder="选择产品Slug后自动带出" disabled />
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="category">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">关联关键特性分类</div>
                    </template>
                    <t-form-item label="选择分类" name="category">
                        <t-select v-model="formData.category" :options="categoryOptions" placeholder="请选择关联分类" filterable clearable />
                    </t-form-item>
                    <t-form-item  name="features">
                        <template #label>
                            <div class="flex items-center">
                                <span>关键特性配置</span>
                                <span v-if="formData.category" class="text-xs text-blue-500 ml-2">基于[{{ formData.category }}] 分类，共{{ formData.features.length }}个特性</span>
                            </div>
                        </template>
                        <div v-if="!formData.category" class="text-gray-400 text-sm mt-2 flex justify-center items-center w-full">
                            请从上方下拉列表中选择一个关键特性分类，选择后将自动加载该分类下的所有特性数据
                        </div>
                        <div v-else class="w-full">
                            <FeatureTable
                                v-model="formData.features"
                                :show-header="false"
                                :disabled-title="false"
                            />
                        </div>
                    </t-form-item>
                    <div></div>
                </t-collapse-panel>
            </t-collapse>
            <div class="flex justify-end mt-8">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" type="submit">{{ pageInfo.title }}</t-button>
                </t-space>
            </div>
        </t-form>

    </MainLayout>
    <t-dialog v-bind="dialogProps">
      <t-form :data="{ file: importFile }" label-align="top" label-width="80">
        <t-form-item label="上传文件" name="file" :rules="[{ required: true, message: '请选择文件' }]">
          <t-upload v-model="importFile" theme="file" action="/api/import" :size-limit="{ size: 10, unit: 'MB' }" accept=".xlsx,.xls,.csv" :auto-upload="false" :disabled="pollingState === 'polling'" />
        </t-form-item>
        <div v-if="pollingState === 'polling' || lastResult" class="mt-4">
          <table class="job-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="lastResult && lastResult.status === 'finished'">
                <td>{{ lastResult.slug }}</td>
                <td>
                  <t-tag theme="success" variant="light">导入完成</t-tag>
                </td>
              </tr>
              <tr v-else-if="lastResult">
                <td>{{ lastResult.slug }}</td>
                <td>
                  <t-loading size="small" :text="lastResult.message || '导入中...'" />
                </td>
              </tr>
              <tr v-else>
                <td colspan="2" class="text-center">
                  <t-loading size="small" text="正在提交导入请求..." />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div></div>
      </t-form>
    </t-dialog>
</template>

<style scoped>
:deep(.t-collapse-panel__content),
:deep(.t-collapse-panel__header) {
    background: #fff;
}
.job-table{
    width: 100%;
    border-collapse: collapse;
}
.job-table :deep(:where(td,th)){
    border: solid 1px rgba(0,0,0,0.2);
    text-align: center;
}
.job-table :deep(thead th){
    font-weight: 700;
    padding: 4px 0;
    background-color: rgba(0,0,0,0.1);
}
.job-table :deep(tbody td){
    padding: 8px 0;
}
</style>
