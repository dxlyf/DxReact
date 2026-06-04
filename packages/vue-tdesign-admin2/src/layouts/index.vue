<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from './AdminLayout.vue'
import BlankLayout from './BlankLayout.vue'

const route=useRoute()
const layouts={
    'admin':AdminLayout,
    'blank':BlankLayout
}
const layout=computed(()=>{
    return layouts[route.meta.layout as keyof typeof layouts]
})
</script>
<template>
  <component :is="layout" />
</template>
