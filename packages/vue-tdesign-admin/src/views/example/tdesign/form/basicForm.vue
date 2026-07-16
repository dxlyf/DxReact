<script setup lang="ts">
import { reactive } from 'vue'
import { Slider as TSlider,type FormRule,type FormProps } from 'tdesign-vue-next'
import FSelectPagination from '../components/FSelectPagination/index.vue'
const formData = reactive({
  name: '',
  gender: '',
  city: '',
  date: '',
  city2:[],
  count: 0,
  score: 50,
  tags: [],
  color: '#1677ff',
  bio: '',
  agree: false,
})

const GENDER_OPTIONS = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '其他', value: 'other' },
]

const CITY_OPTIONS = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
]

function handleSubmit({ validateResult, firstError }: { validateResult: boolean; firstError: string }) {
  if (validateResult === true) {
    console.log('表单提交:', JSON.parse(JSON.stringify(formData)))
  } else {
    console.warn('表单验证失败:', firstError)
  }
}

function handleReset() {
  console.log('表单已重置')
}

const RULES:FormProps['rules'] = {
  name: [{ required: true, message: '请输入姓名', type: 'error' }],
  gender: [{ required: true, message: '请选择性别', type: 'error' }],
  city: [{ required: true, message: '请选择城市', type: 'error' }],
  bio: [{ required: true, message: '请输入个人简介', type: 'error' }],
  agree: [
    {
      validator: (val: boolean) => val === true,
      message: '请先同意用户协议',
      type: 'error',
    },
  ],
}
const handleRequest=async ()=>{
    return {
        total:CITY_OPTIONS.length,
        records:CITY_OPTIONS
    }
}
</script>

<template>
  <div style="max-width: 640px; margin: 40px auto; padding: 24px;">
    <h3 style="margin-bottom: 24px; font-weight: 600; font-size: 18px;">基本表单示例</h3>

    <t-form
      :data="formData"
      :rules="RULES"
      :label-width="100"
      @submit="handleSubmit"
      @reset="handleReset"
    >
      <t-form-item label="姓名" name="name">
        <t-input
          v-model="formData.name"
          placeholder="请输入姓名"
          clearable
          :style="{ width: '100%' }"
        />
      </t-form-item>

      <t-form-item label="性别" name="gender">
        <t-radio-group v-model="formData.gender">
          <t-radio
            v-for="opt in GENDER_OPTIONS"
            :key="opt.value"
            :value="opt.value"
          >{{ opt.label }}</t-radio>
        </t-radio-group>
      </t-form-item>

      <t-form-item label="城市" name="city">
        <t-select
          v-model="formData.city"
          placeholder="请选择城市"
          :options="CITY_OPTIONS"
          multiple
          :min-collapsed-num="3"
          clearable
          filterable
          :style="{ width: '100%' }"
        />
      </t-form-item>
    <t-form-item label="城市2" name="city2">
        <FSelectPagination
          v-model="formData.city2"
          :request="handleRequest"
          placeholder="请选择城市"
          :options="CITY_OPTIONS"
          multiple
      
          clearable
          filterable
          :style="{ width: '100%' }"
        />
      </t-form-item>
      <t-form-item label="日期" name="date">
        <t-date-picker
          v-model="formData.date"
          placeholder="请选择日期"
          clearable
          :style="{ width: '100%' }"
        />
      </t-form-item>

      <t-form-item label="数量" name="count">
        <t-input-number
          v-model="formData.count"
          :min="0"
          :max="100"
          :step="1"
          :style="{ width: '200px' }"
        />
      </t-form-item>

      <t-form-item label="评分" name="score">
        <t-slider v-model="formData.score" :min="0" :max="100" :style="{ width: '100%' }" />
      </t-form-item>

      <t-form-item label="标签" name="tags">
        <t-tag-input
          v-model="formData.tags"
          placeholder="输入后按回车添加"
          clearable
          :style="{ width: '100%' }"
        />
      </t-form-item>

      <t-form-item label="颜色" name="color">
        <t-color-picker v-model="formData.color" />
      </t-form-item>

      <t-form-item label="个人简介" name="bio">
        <t-textarea
          v-model="formData.bio"
          placeholder="请输入个人简介"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :style="{ width: '100%' }"
        />
      </t-form-item>

      <t-form-item label=" ">
        <t-checkbox v-model="formData.agree">我已阅读并同意用户协议</t-checkbox>
      </t-form-item>

      <t-form-item label=" ">
        <t-space size="16px">
          <t-button type="submit" theme="primary">提交</t-button>
          <t-button type="reset" theme="default">重置</t-button>
        </t-space>
      </t-form-item>
    </t-form>

    <div
      style="
        margin-top: 24px;
        padding: 16px;
        background: #f5f5f5;
        border-radius: 6px;
        font-size: 13px;
        color: #555;
        white-space: pre-wrap;
        word-break: break-all;
      "
    >
      <strong style="color: #1677ff;">表单数据 (JSON):</strong>
      {{ JSON.stringify(formData, null, 2) }}
    </div>
  </div>
</template>
