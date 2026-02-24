<script setup lang="ts">
  import FLanguage from '../FLanguage/index.vue'
  import {Breadcrumb,type BreadcrumbProps} from 'tdesign-vue-next'
  type Props={
     langType?:'button'|'text',
     title?:string,
    breadcrumbOptions?:BreadcrumbProps['options']
  }
  const props=withDefaults(defineProps<Props>(), {
    langType:'text',
    breadcrumbOptions:()=>[]
  })
</script>
<template>
<div class="wrapper flex-col">
    <FLanguage :type="langType" />
   <div class="mb-4">
     <t-breadcrumb :options="breadcrumbOptions">
      </t-breadcrumb>
   </div>
    <div class="flex-auto">
        <t-card :bordered="false" :title="title" header-bordered class="edit-body">
          <slot></slot>
        </t-card>
    </div>
</div>

</template>
<style scoped>

.wrapper{
 
}
.edit-body{
  padding:16px;
}
.edit-body :deep(.t-card__header){
  padding:0 0 16px;
}
.edit-body :deep(.t-card__body){
  padding:16px 0 16px;
}
</style>