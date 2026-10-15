<!--
  FormRenderer.vue
  作用：递归渲染器。接收 schema 数组与当前数据路径 path，
  对每个节点渲染 <FormField>；自身作为 24 栅格布局容器（子节点通过 span 占位）。
-->
<script setup lang="ts">
import type { SchemaNode } from './types'
import FormField from './FormField.vue'

const props = withDefaults(defineProps<{ schema: SchemaNode[]; path?: string }>(), {
  path: '',
})

const getKey = (node: SchemaNode, index: number): string =>
  node.key || `${node.type}-${props.path}-${index}`
</script>

<template>
  <div class="sf-grid">
    <FormField
      v-for="(node, index) in schema"
      :key="getKey(node, index)"
      :node="node"
      :path="path"
    />
  </div>
</template>

<style scoped>
/* 24 栅格：每个 FormField 通过 grid-column: span N 占位 */
.sf-grid {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

@media (max-width: 768px) {
  /* 小屏降级为单列，并强制每个字段占满整行 */
  .sf-grid {
    grid-template-columns: 1fr;
  }

  .sf-grid :deep(.sf-field) {
    grid-column: 1 / -1 !important;
  }
}
</style>
