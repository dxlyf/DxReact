<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import FLanguageInput from '@/views/example/tdesign/components/FLanguageInput/index.vue';
import { reactive, ref, shallowRef } from 'vue';
import type { FormInstanceFunctions } from 'tdesign-vue-next';
import { useRouter } from 'vue-router'

const router = useRouter()

const breadcrumbOptions = [
  {
    content: '首页',
    to: '/',
  },
  {
    content: '推荐内容列',
    to: '/example/tdesign/support_suggest_items',
  },
  {
    content: '新增推荐内容',
  },
]

type FormData = {
  slug: string
  title: Record<string, string>
  description: Record<string, string>
  linkText: Record<string, string>
  onlineTime: string
  offlineTime: string
  status: string
  isFirstRecommend: boolean
}

const rules = {
  slug: [
    { required: true, whitespace: true, message: '请输入Slug' },
  ],
  onlineTime: [
    { required: true, message: '请选择上线时间' },
  ],
  offlineTime: [
    { required: true, message: '请选择下线时间' },
  ],
}

const formData = reactive<FormData>({
  slug: '',
  title: {},
  description: {},
  linkText: {},
  onlineTime: '',
  offlineTime: '',
  status: '草稿',
  isFirstRecommend: false,
})

const submitLoading = ref(false)
const formRef = shallowRef<FormInstanceFunctions>()

const handleSubmit = async (e: any) => {
  if (e.validateResult !== true) {
    return
  }
  try {
    submitLoading.value = true
    console.log('提交', { ...formData })
    // await createSupportSuggestItem({ ...formData })
    router.push('/example/tdesign/support_suggest_items')
  } catch (err) {
  } finally {
    submitLoading.value = false
  }
}

const handleReturn = () => {
  router.push('/example/tdesign/support_suggest_items')
}
</script>

<template>
  <MainLayout
    title="新增推荐内容"
    layout="edit"
    show-lang
    :breadcrumb-options="breadcrumbOptions"
  >
    <template #operation>
      <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
    </template>
    <t-form
      ref="formRef"
      @submit="handleSubmit"
      :data="formData"
      :rules="rules"
      class="w-full"
      label-align="top"
    >
      <t-form-item label="Slug" name="slug">
        <t-input v-model="formData.slug" :maxlength="255" placeholder="请输入Slug" />
      </t-form-item>
      <t-form-item label="标题">
        <FLanguageInput v-model="formData.title" />
      </t-form-item>
      <t-form-item label="描述">
        <FLanguageInput v-model="formData.description" type="textarea" />
      </t-form-item>
      <t-form-item label="链接文案">
        <FLanguageInput v-model="formData.linkText" />
      </t-form-item>
      <t-form-item label="上线时间" name="onlineTime">
        <t-date-picker
          v-model="formData.onlineTime"
          enable-time-picker
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择上线时间"
          clearable
        />
      </t-form-item>
      <t-form-item label="下线时间" name="offlineTime">
        <t-date-picker
          v-model="formData.offlineTime"
          enable-time-picker
          format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择下线时间"
          clearable
        />
      </t-form-item>
      <t-form-item label="发布状态" name="status">
        <t-radio-group v-model="formData.status">
          <t-radio value="草稿">草稿</t-radio>
          <t-radio value="待审核">待审核</t-radio>
          <t-radio value="已发布">已发布</t-radio>
        </t-radio-group>
      </t-form-item>
      <t-form-item label="是否首位推荐" name="isFirstRecommend">
        <t-switch v-model="formData.isFirstRecommend" />
      </t-form-item>
      <div class="flex justify-end">
        <t-space>
          <t-button theme="default" @click="handleReturn">取消</t-button>
          <t-button theme="primary" :loading="submitLoading" type="submit">保存</t-button>
        </t-space>
      </div>
    </t-form>
  </MainLayout>
</template>

<style scoped></style>
