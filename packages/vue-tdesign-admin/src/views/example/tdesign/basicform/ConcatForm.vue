<script setup lang="ts">

import dayjs from 'dayjs'
import { request } from 'src/utils/request'
import type { FormProps, FormInstanceFunctions } from 'tdesign-vue-next'
import { reactive, ref, shallowRef, toRaw, watch } from 'vue'


const formData = reactive<{
  slug: string
  color: string
  linkType: string
  linkUrl: string
  concatType: string
  enableEnable: string
  currentDateTime: string
  testApi: string
}>({
  slug: '',
  linkType: 'relative',
  linkUrl: '',
  concatType: '1',
  enableEnable: '1',
  currentDateTime: '',
  color: '',
  testApi: '/api/savefie'
})

const formRef = shallowRef<FormInstanceFunctions>()
const LinkTypeOptions = ref([
  {
    label: '相对',
    value: 'relative'
  },
  {
    label: '商城相对',
    value: 'store'
  },
  {
    label: '绝对',
    value: 'absolute'
  }
])

const handleSubmit: FormProps['onSubmit'] = (e) => {
  console.log('formData', toRaw(formData))
}
const rules: FormProps['rules'] = {
  slug: [{ required: true, message: '请输入slug' }],
  // linkType: [{ required: true, message: '请选择链接类型' }],
  linkUrl: [{
    validator: (val, { formData }) => {
      if (formData.linkType === 'absolute' && val && !/^https?:\/\//.test(val)) {
        return {
          result: false,
          type: 'error',
          message: '请输入绝对链接地址'
        }
      }
      return true
    },
    message: '请输入链接地址'
  }],
}
watch(() => formData.linkType, (val) => {
  if (val !== 'relative') {
    formData.concatType = '1'
  }
  if (val !== 'absolute') {

    formRef.value?.clearValidate(['linkUrl'])
  } else {
    formRef.value?.validate({
      fields: ['linkUrl'],
      // showErrorMessage:true,
      // trigger:'submit'
    }).then(d => {
      console.log('ffffff', d)
    })
  }

})
const handleTestOfflineSubmit = () => {
  request({
    url: formData.testApi,
    method: 'post',
    data: { id: 44 },
    timeout:1000
  })
}
const testAPIOptions = [
{value:'/api/timeout',label:'timeout'},
  {
    label: 'savefile',
    value: '/api/savefile'
  },{
    label: '403',
    value: '/api/403'
  },
    {
    label: '404',
    value: '/api/404'
  },
  {
    label: '401',
    value: '/api/401'
  },
  {
    label: '500',
    value: '/api/500'
  }
]
</script>
<template>
  <t-form @submit="handleSubmit" label-align="top" :rules="rules" :data="formData" ref="formRef">
    <t-select v-model="formData.testApi" :options="testAPIOptions"></t-select>
    <t-button @click="handleTestOfflineSubmit">测试离线提交</t-button>
    <t-form-item label="slug" name="slug" class="flex-1">
      <div class="w-full flex gap-4">
        <div class="flex-1"> <t-input v-model="formData.slug" /></div>
        <div class="flex-none"> <t-button theme="primary">提交</t-button></div>
      </div>
    </t-form-item>
    <t-form-item label="color" name="color" :rules="[{
      required: true,
      message: '请选择颜色'
    }, {
      validator: (val) => {
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val) || /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(val)
      },
      message: '支持#fff、#ffffff、rgb(r,g,b)、rgba(r,g,b,a)格式的颜色'
    }]">
      <t-color-picker :enable-alpha="true" format="RGBA" :recentColors="true" :swatch-colors="null"
        :show-primary-color-preview="true" :color-modes="['monochrome']" v-model="formData.color" />
    </t-form-item>
    <div class="flex">
      <t-form-item label="链接类型" name="linkType" class="flex-1">
        <t-select v-model="formData.linkType" :options="LinkTypeOptions" />
      </t-form-item>
      <t-form-item label="链接地址" name="linkUrl" class="flex-1">
        <t-input v-model="formData.linkUrl" />
      </t-form-item>
    </div>
    <div class="flex">
      <t-form-item label="拼接产品" name="enableEnable" class="flex-1">
        <t-switch v-model="formData.enableEnable" :custom-value="['1', '0']" />
      </t-form-item>
      <t-form-item label="拼接位置" name="concatType" class="flex-1" v-show="formData.enableEnable == '1'">
        <t-radio-group v-model="formData.concatType">
          <t-radio value="0" :disabled="formData.linkType !== 'relative'">前拼接</t-radio>
          <t-radio value="1">后拼接</t-radio>
        </t-radio-group>
      </t-form-item>
    </div>
    <t-form-item label="当前日期时间选择" name="currentDateTime" class="flex-1">
      <t-date-picker v-model="formData.currentDateTime" enable-time-picker format="YYYY-MM-DD HH:mm:ss" />
    </t-form-item>
    <t-button theme="primary" type="submit">提交</t-button>
  </t-form>

</template>