<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRequest } from 'src/hooks/useRequest2';
import FeatureList from './FeatureList.vue';
import type { FeatureItem } from './FeatureList.vue';
import { MessagePlugin, type UploadFile } from 'tdesign-vue-next';
import { useDialog } from '@/hooks/useDialog';
import { usePolling } from '@/hooks/usePolling';

type Props = {
    id?: string
    type: 'create' | 'edit' | 'copy'
}

const props = defineProps<Props>()
const router = useRouter()

const pageInfo = computed(() => {
    switch (props.type) {
        case 'create':
        case 'copy':
            return { title: '新增关键特性分类' }
        case 'edit':
            return { title: '编辑关键特性分类' }
    }
})

const breadcrumbOptions = computed(() => [
    { content: '首页', to: '/' },
    { content: '关键特性分类', to: '/example/tdesign/product_comparison/key_feature_categories' },
    { content: pageInfo.value.title }
])

type FormData = {
    title: string
    slug: string
    productGroupId: string
    productSubGroupId: string
    features: FeatureItem[]
}

const rules = {
    title: [{ required: true, message: '请输入分类名称', whitespace: true }],
    slug: [
        { required: true, message: '请输入Slug', whitespace: true },
        { pattern: /^[a-z0-9_-]+$/, message: '仅支持小写字母、数字、下划线及短横线' }
    ],
    productGroupId: [{ required: true, message: '请选择产品分组' }],
    productSubGroupId: [{ required: true, message: '请选择子产品分组' }]
}

const productGroupOptions = ref<{ label: string; value: string }[]>([])

const [productGroupState] = useRequest({
    request: async () => {
        return {
            productGroupOptions: [
                { label: '电子产品', value: 'electronics' },
                { label: '家居产品', value: 'home' },
                { label: '服饰产品', value: 'clothing' }
            ]
        }
    },
    onSuccess: (data) => {
        productGroupOptions.value = data.productGroupOptions
    }
})

const [productSubGroup, productSubGroupInst] = useRequest({
    request: async (params: { productGroupId: string }) => {
        const map: Record<string, { label: string; value: string }[]> = {
            electronics: [
                { label: '手机', value: 'phone' },
                { label: '电脑', value: 'computer' },
                { label: '平板', value: 'tablet' }
            ],
            home: [
                { label: '家具', value: 'furniture' },
                { label: '厨具', value: 'kitchen' }
            ],
            clothing: [
                { label: '男装', value: 'men' },
                { label: '女装', value: 'women' }
            ]
        }
        return map[params.productGroupId] || []
    },
    manualRequest: true,
    defaultValue: []
})

const formData = reactive<FormData>({
    title: '',
    slug: '',
    productGroupId: '',
    productSubGroupId: '',
    features: []
})

watch(() => formData.productGroupId, (val, oldVal) => {
    if (oldVal) {
        formData.productSubGroupId = ''
    }
    if (val) {
        productSubGroupInst.request({ productGroupId: val })
    } else {
        productSubGroup.data = []
    }
}, { immediate: true })


const formRef = ref()
const submitLoading = ref(false)
const collapseRef = ref()
const expandedPanel = ref(['basic', 'features'])

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
    slug: `key-feature-category-${jobId}`
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
      slug: `key-feature-category-${jobId}`
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

const handleFeatureAdd = () => {
    if (!expandedPanel.value.includes('features')) {
        expandedPanel.value = [...expandedPanel.value, 'features']
    }
}

const handleSubmit = async (e: any) => {
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        console.log('提交', { ...formData })
    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const handleReturn = () => {
    router.push('/example/tdesign/product_comparison/key_feature_categories')
}
</script>

<template>
    <MainLayout layout="edit" :title="pageInfo.title" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
            <t-button theme="default" @click="handleImport">导入</t-button>
            <t-button theme="default">导出</t-button>
            <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
            </t-space>
        </template>
        <t-form ref="formRef" :data="formData" :label-width="140" @submit="handleSubmit" class="w-full" label-align="top">
            <t-collapse ref="collapseRef" v-model="expandedPanel" :expand-on-row-click="false"
                expand-icon-placement="right" borderless>
                <t-collapse-panel value="basic">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item label="分类名称" name="title" :rules="rules.title">
                        <t-input v-model="formData.title" placeholder="请输入分类名称" :maxlength="255" />
                    </t-form-item>
                    <t-form-item label="Slug" name="slug" :rules="rules.slug">
                        <t-input v-model="formData.slug" placeholder="请输入 Slug" :maxlength="255" />
                        <template #tips>
                            全局唯一标识，不随语言变化
                        </template>
                    </t-form-item>
                    <t-form-item label="产品分组" name="productGroupId" :rules="rules.productGroupId" class="flex-1">
                        <t-space>
                            <t-select v-model="formData.productGroupId" :options="productGroupOptions"
                                placeholder="请选择产品分组" filterable clearable />
                            <t-select v-model="formData.productSubGroupId" :options="productSubGroup.data"
                                :loading="productSubGroup.loading" placeholder="请选择子产品分组" filterable clearable />
                        </t-space>
                    </t-form-item>


                    <div></div>
                </t-collapse-panel>
                <t-collapse-panel value="features">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">关键特性配置</div>
                    </template>
                    <FeatureList show-add show-delete v-model="formData.features" @add="handleFeatureAdd" />
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
