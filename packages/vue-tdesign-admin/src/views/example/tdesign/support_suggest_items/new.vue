<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import FLanguageInput from '@/views/example/tdesign/components/FLanguageInput/index.vue';
import FLanguagePublishInfo from '@/views/example/tdesign/components/FLanguagePublishInfo/index.vue';
import { reactive, ref, shallowRef, toRaw } from 'vue';
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
  publishInfo: Record<string, { status: string; onlineTime: string; offlineTime: string }>
  isFirstRecommend: boolean
}

const rules = {
  slug: [
    { required: true, whitespace: true, message: '请输入Slug' },
  ],
}

const formData = reactive<FormData>({
  slug: '',
  title: {},
  description: {},
  linkText: {},
  publishInfo: {},
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
    console.log('提交', toRaw(formData))
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
      <t-form-item label="发布配置">
        <FLanguagePublishInfo
          v-model="formData.publishInfo"
          status-required
          online-time-required
          offline-time-required
        />
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
