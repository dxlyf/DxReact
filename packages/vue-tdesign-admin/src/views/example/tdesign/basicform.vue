<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, reactive, toRaw } from 'vue'
import type { TabPanel, TdFormItemProps, TdInputProps, TdInputNumberProps, TdSelectProps, TdCheckTagProps, TdCheckboxProps, TdUploadProps, TdCheckTagGroupProps } from 'tdesign-vue-next'
import FSelect from './components/FSelect/index.vue'
import Collapse from './components/FCollapse/index.vue'
import CollapsePanel from './components/FCollapse/CollapsePanel.vue'
import { useSelect } from './hooks/useSelect'
import axios from 'axios'
import type { FormProps } from 'tdesign-vue-next'
import { useTitle } from 'src/hooks/useTitle'
const activeTabKey = ref(1)

const formData = reactive<any>({
  virtualSelect: {
    value: 2,
    label: '选项2'
  },
  enabled: false,
  concatType:'0',
  linkType:'relative',
  linkUrl:''
})


const selectOptions = ref([])


const rules:FormProps['rules'] = {
  virtualSelect: [{
    required: true,
    message: '请选择动态搜索'
  }],
  linkUrl:[{
     validator:(val,{formData})=>{
        if(formData.linkType==='absolute'){
            if(val&&!val.toLowerCase().startsWith('http')){
                return {
                  result:false,
                  message:'请输入正确的绝对链接'
                }
            }
        }
        return true
     }
  }]
}
const handleSubmit = async (e: any) => {

  console.log('handleSubmit', toRaw(formData))
}
const optionsSource = Array.from({ length: 10000 }, (item, index) => ({
  label: `选项` + index,
  value: index
}))
const delay = async (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
const [selectProps] = useSelect(() => ({
  valueType: 'object',
  multiple: false,
  placeholder: '输入值可搜索',
  value: formData.virtualSelect,
  onChange: (val: any) => {
    formData.virtualSelect = val
  },
  request: async (keywork: string) => {
    await delay(1000)
    return optionsSource.filter(item => item.label.includes(keywork)).slice(0, 10)
  },
  debounce: 100,
  //options:optionsSource.slice(0,10),
  remote: true,
}))

const handleDownLoad = () => {
  // axios.get('/api/download',{
  //     responseType:'blob',
  //     headers:{
  //         'custome-userId':'123'
  //     }
  // }).then(res=>{
  //     const blob=res.data;
  //     const filename=res.headers['content-disposition']?.split('=')[1]?.trim().replace(/"/g,'') || 'aaa.svg';
  //     console.log(filename,'filename',res.headers['content-disposition'])
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = filename;
  //     a.click();
  //     URL.revokeObjectURL(url);
  // })

  fetch('/api/download', {
    method: 'GET',
    headers: {
      'custome-userId': '123'
    }
  }).then(async res => {
    const reader = res.body.getReader();
    let chunk = []
    let contentLength = Number(res.headers.get('Content-Length')) || 0;
    let progress = 0;
    let fileLen = 0
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      fileLen += value.byteLength;
      progress = fileLen / contentLength * 100;
      console.log('progress', progress, 'fileLen', fileLen, 'contentLength', contentLength)
      chunk.push(value);
    }
    const blob = new Blob(chunk);
    //   const match=res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/);
    //   const filename=match?.[1] || 'aaa.svg';
    const filename = res.headers.get('Content-Disposition')?.split('=')[1]?.trim().replace(/"/g, '') || 'aaa.svg';
    console.log(filename, 'filename', res.headers.get('Content-Disposition'))
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  })
  //     const blob=await res.blob();
  //     const filename=res.headers.get('Content-Disposition')?.split('=')[1]?.trim().replace(/"/g,'') || 'aaa.svg';
  //     console.log(filename,'filename',res.headers.get('Content-Disposition'))
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = filename;
  //     a.click();
  //     URL.revokeObjectURL(url);
  // })
}

const LinkTypeOptions = ref([
  {
    label: '相对',
    value: 'relative'
  },
  {
    label: '绝对',
    value: 'absolute'
  }
])

const title=ref('基础表单')
useTitle(title)
const handleCahngeTab=(val:number)=>{
    title.value=`基础表单${val}`
}
</script>

<template>

  <div>
    <t-tabs v-model="activeTabKey" @change="handleCahngeTab">
      <t-tab-panel :value="1" label="基础信息">
        <t-form @submit="handleSubmit" :rules="rules" :data="formData" ref="formRef" class="w-full">
          <t-button @click="handleDownLoad">下载</t-button>
          <t-form-item label="动态搜索" name="virtualSelect">
            <t-select v-bind="selectProps"></t-select>
          </t-form-item>
          <div class="flex">
            <t-form-item label="链接类型" name="linkType">
              <t-select :options="LinkTypeOptions" v-model="formData.linkType"></t-select>
            </t-form-item>
              <t-form-item label="链接地址" name="linkUrl">
              <t-input v-model="formData.linkUrl" placeholder="请输入链接地址"></t-input>
            </t-form-item>
          </div>
          <t-form-item label="启用" name="enable">
            <t-switch v-model="formData.enable" :label="['启用','禁用']"></t-switch>
          </t-form-item>
           <t-form-item label="连接类型" name="concatType" v-show="formData.enable">
              <t-radio-group v-model="formData.concatType">
                <t-radio value="0">前缀</t-radio>
                <t-radio value="1">后缀</t-radio>
              </t-radio-group>
          </t-form-item>
          <t-form-item>
            <t-button type="submit" theme="primary">提交</t-button>
          </t-form-item>
        </t-form>

      </t-tab-panel>
      <t-tab-panel :value="2" label="选项卡2">
        <template #panel>

          <div class="bg-white p-4">
            <Collapse>
              <CollapsePanel value="1" header="选项1">
                <Collapse>
                  <CollapsePanel value="1" header="选项1-1"></CollapsePanel>
                  <CollapsePanel value="2" header="选项1-2"></CollapsePanel>
                </Collapse>
                <template #headerRight>
                  <t-button theme="primary" size="small">添加</t-button>
                </template>
              </CollapsePanel>
              <CollapsePanel value="2" header="选项2">
                <p>选项2的内容</p>
                <template #headerRight>
                  <t-button theme="primary" size="small">添加</t-button>
                </template>
              </CollapsePanel>
            </Collapse>
          </div>
        </template>
      </t-tab-panel>
      <t-tab-panel :value="3" label="选项卡3">
        <p style="padding: 25px">选项卡3的内容，使用 t-tab-panel 渲染</p>
      </t-tab-panel>
    </t-tabs>

  </div>
</template>