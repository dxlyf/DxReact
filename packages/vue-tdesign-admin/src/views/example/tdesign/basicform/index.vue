<script setup lang="ts">
import { ref } from 'vue'
const activeTabKey = ref(1)
import ConcatForm from './ConcatForm.vue'
import CollapsePanel from './CollapsePanel.vue'

const tabs=[
  {
    label:'连接联动',
    value:1,
    component:ConcatForm
  },
    {
    label:'面板展开',
    value:2,
    component:CollapsePanel
  }
]
</script>

<template>

  <div>
    <t-tabs v-model="activeTabKey">
      <t-tab-panel  v-for="(item) in tabs" :key="item.value" :value="item.value" :label="item.label">
          <component :is="item.component" />
      </t-tab-panel>

    </t-tabs>

  </div>
</template>