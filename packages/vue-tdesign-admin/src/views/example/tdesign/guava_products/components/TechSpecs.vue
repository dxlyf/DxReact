<script setup lang="ts">
import { SchemaForm, type FormSchema } from 'src/views/example/tdesign/components/SchemaForm2'
import { computed, onMounted, ref } from 'vue';

const formRef = ref<any>()
const value = ref<any>({})

onMounted(()=>{
  setTimeout(() => {
  formRef.value?.init({
    "groups": [
      {
        "title": "霏霏",
        "items": [
          {
            "title": "fdsa",
            "specs": [
              {
                "key": "fd",
                "value": "fdafds"
              },
              {
                "key": "aaa",
                "value": "fff"
              },
              {
                "key": "343",
                "value": "4343"
              }
            ]
          }
        ]
      },
      {
        "title": "斯塔克豪斯",
        "items": [
          {
            "img": "aa",
            "title": "ff",
            "specs": [
              {
                "key": "ff",
                "value": "ff"
              },
              {
                "key": "aaa",
                "value": "bbbb"
              }
            ]
          }
        ],
        "bb": "fdfdfdafd"
      }
    ]
  })
}, 1000)
})
const schema = computed<FormSchema>(() => {
  return {
    type: 'object',
    key: 'roots',
    label: '技术规格(Tech Specs)',
    schemas: [
      {
        type: 'array',
        key: 'groups',
        label: '分组（groups）',
        formatItemLabel: (item, index) => `分组 ${index + 1}`,
        sortable: true,
        schemas: [
          {
            type: 'atom',
            key: 'title',
            label: '标题（title）',
            component: 't-input',
          }, {
            type: 'array',
            key: 'items',
            label: '条目（items）',
            formatItemLabel: (item, index) => `条目 ${index + 1}`,
            sortable: true,
            schemas: [
              {
                type: 'atom',
                key: 'img',
                label: '图片（img）',
                component: 't-input',
              }, {
                type: 'atom',
                key: 'title',
                label: '标题（title）',
                component: 't-input',
              }, {
                type: 'array',
                key: 'specs',
                label: '规格（specs）',
                formatItemLabel: (item, index) => `规格 ${index + 1}`,
                sortable: true,
                schemas: [
                  {
                    type: 'atom',
                    key: 'key',
                    label: '参数名（key）',
                    component: 't-input',
                  }, {
                    type: 'atom',
                    key: 'value',
                    label: '参数值（value）',
                    component: 't-input',
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
})
const valueStr = computed(() => {
  return JSON.stringify(value.value, null, 2)
})
</script>
<template>
  <div>
    <t-form class="w-full" layout="vertical" label-align="top">
      <t-form-item label="Tech Specs">
        <t-textarea v-model="valueStr" style="height:200px;"></t-textarea>
      </t-form-item>
      <div>
        <div class="flex gap-2">
          <t-button theme="primary">导入技术规格</t-button>
          <t-button theme="primary">导出技术规格</t-button>
          <div class="text-xs text-gray-500 self-end">导入/导出仅影响groups属性</div>
        </div>
      </div>
      <SchemaForm ref="formRef" :schema="schema" @change="value = $event"></SchemaForm>
    </t-form>
  </div>
</template>
