<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import FUploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { reactive, ref, shallowRef, toRaw } from 'vue';
import type { FormInstanceFunctions } from 'tdesign-vue-next';
import { useRoute, useRouter } from 'vue-router'
import FunctionFormGroup, { type FunctionButtonConfig } from './FunctionFormGroup.vue'

const router = useRouter()
const route = useRoute()

const isEdit = !!route.query.id

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
    content: isEdit ? '编辑' : '新增',
  },
]

type FormData = {
  versionName: string
  country: string
  pageScope: string[]
  cover: any[]
  publishStatus: string
  publishTime: string
  showRemark: boolean
  floatingTip: string
}

const rules = {
  versionName: [
    { required: true, whitespace: true, message: '请输入版本名称' },
    { max: 255, message: '版本名称长度不能超过255个字符' },
  ],
  floatingTip: [
    { max: 255, message: '悬浮窗提示文案长度不能超过255个字符' },
  ],
}

const pageScopeOptions = [
  { label: '售前页面', value: '售前页面' },
  { label: '售后页面', value: '售后页面' },
]

const publishStatusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已下架', value: 'offline' },
]

const formData = reactive<FormData>({
  versionName: '',
  country: '',
  pageScope: [],
  cover: [],
  publishStatus: 'draft',
  publishTime: '',
  showRemark: false,
  floatingTip: '',
})

// 功能按钮配置 — 根据实际需求修改字段
const functionButtons: FunctionButtonConfig[] = [
  {
    key: 'contactInfo',
    label: '联系信息',
    fields: [
      { key: 'personName', label: '联系人姓名', type: 'input', required: true, maxlength: 50, showLimitNumber: true },
      { key: 'phone', label: '联系电话', type: 'input', maxlength: 20 },
      { key: 'email', label: '邮箱', type: 'input' },
      { key: 'department', label: '部门', type: 'select', options: [{ label: '销售部', value: 'sales' }, { label: '技术部', value: 'tech' }, { label: '客服部', value: 'service' }] },
    ],
  },
  {
    key: 'address',
    label: '地址信息',
    fields: [
      { key: 'country', label: '国家', type: 'input' },
      { key: 'city', label: '城市', type: 'input' },
      { key: 'address', label: '详细地址', type: 'input', maxlength: 255, showLimitNumber: true },
      { key: 'zipCode', label: '邮编', type: 'input' },
    ],
  },
  {
    key: 'remark',
    label: '备注信息',
    fields: [
      { key: 'title', label: '标题', type: 'input', maxlength: 100 },
      { key: 'content', label: '备注内容', type: 'textarea', maxlength: 500, showLimitNumber: true },
      { key: 'isImportant', label: '是否重要', type: 'switch' },
    ],
  },
]

const functionFormData = reactive<Record<string, Record<string, any>[]>>({})

const submitLoading = ref(false)
const formRef = shallowRef<FormInstanceFunctions>()
const functionFormGroupRef = shallowRef<InstanceType<typeof FunctionFormGroup>>()

const handleSubmit = async () => {
  const validateResult = await formRef.value?.validate?.()
  if (validateResult !== true) {
    return
  }
  // 校验所有动态表单
  const functionValidateResult = await functionFormGroupRef.value?.validateAll?.()
  if (functionValidateResult !== true) {
    return
  }
  try {
    submitLoading.value = true
    const payload = {
      ...toRaw(formData),
      functionForms: toRaw(functionFormData),
    }
    console.log('提交', payload)
    router.push('/example/tdesign/support_contacts')
  } catch (err) {
  } finally {
    submitLoading.value = false
  }
}

const handleReturn = () => {
  router.push('/example/tdesign/support_contacts')
}
</script>

<template>
  <MainLayout
    :title="isEdit ? '编辑' : '新增'"
    layout="edit"
    show-lang
    :breadcrumb-options="breadcrumbOptions"
  >
    <template #operation>
      <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
    </template>
    <t-form
      ref="formRef"
      :data="formData"
      :rules="rules"
      class="w-full"
      label-align="top"
    >
      <t-form-item label="版本名称" name="versionName">
        <t-input v-model="formData.versionName" :maxlength="255" show-limit-number placeholder="请输入版本名称" />
      </t-form-item>

      <t-form-item label="国家" name="country">
        <t-input v-model="formData.country" placeholder="请输入国家" />
      </t-form-item>

      <t-form-item label="覆盖页面范围" name="pageScope">
        <t-select
          v-model="formData.pageScope"
          :options="pageScopeOptions"
          multiple
          placeholder="请选择覆盖页面范围"
          class="w-full"
        />
      </t-form-item>

      <t-form-item label="封面图" name="cover">
        <FUploadCover v-model="formData.cover" />
      </t-form-item>

      <t-form-item label="发布状态" name="publishStatus">
        <t-radio-group v-model="formData.publishStatus">
          <t-radio v-for="opt in publishStatusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </t-radio>
        </t-radio-group>
      </t-form-item>

      <t-form-item label="发布时间" name="publishTime">
        <t-date-picker
          v-model="formData.publishTime"
          enable-time-picker
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择发布时间"
          clearable
        />
      </t-form-item>

      <t-form-item label="是否显示备注" name="showRemark">
        <t-switch v-model="formData.showRemark" />
      </t-form-item>

      <t-form-item label="悬浮窗提示文案" name="floatingTip">
        <t-input v-model="formData.floatingTip" :maxlength="255" show-limit-number placeholder="请输入悬浮窗提示文案" />
      </t-form-item>
    </t-form>

    <!-- 功能按钮动态表单（独立于主表单，避免嵌套 t-form-item） -->
    <div class="mt-6">
      <div class="text-sm font-medium text-[#4e5969] mb-3">功能配置</div>
      <FunctionFormGroup
        ref="functionFormGroupRef"
        :buttons="functionButtons"
        v-model="functionFormData"
      />
    </div>

    <div class="flex justify-end mt-6">
      <t-space>
        <t-button theme="default" @click="handleReturn">取消</t-button>
        <t-button theme="primary" :loading="submitLoading" @click="handleSubmit">保存</t-button>
      </t-space>
    </div>
  </MainLayout>
</template>

<style scoped></style>
