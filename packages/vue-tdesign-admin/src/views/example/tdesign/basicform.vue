<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, reactive, toRaw } from 'vue'
import type { TabPanel, TdFormItemProps, TdInputProps, TdInputNumberProps, TdSelectProps, TdCheckTagProps, TdCheckboxProps, TdUploadProps, TdCheckTagGroupProps } from 'tdesign-vue-next'
import FSelect from './components/FSelect/index.vue'
import Collapse from './components/FCollapse/index.vue'
import CollapsePanel from './components/FCollapse/CollapsePanel.vue'
import { useSelect } from './hooks/useSelect'
const activeTabKey = ref(1)

const formData = reactive<any>({
  virtualSelect: {
    value: 2,
    label: '选项2'
  }
})


const selectOptions = ref([])


const rules = {
  virtualSelect: [{
    required: true,
    message: '请选择动态搜索'
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
</script>

<template>

  <div>
    <t-tabs v-model="activeTabKey">
      <t-tab-panel :value="1" label="基础信息">
        <t-form @submit="handleSubmit" :rules="rules" :data="formData" ref="formRef" class="w-full">
          <t-form-item label="动态搜索" name="virtualSelect">
            <t-select v-bind="selectProps"></t-select>
          </t-form-item>

          <t-form-item>
            <t-button type="submit" theme="primary">提交</t-button>
          </t-form-item>
        </t-form>

      </t-tab-panel>
      <t-tab-panel :value="2" label="选项卡2">
        <template #panel>

          <div class="bg-white p-4">
            <Collapse >
                <CollapsePanel value="1" header="选项1">
               <Collapse >
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