<script setup lang="ts">
  import FLanguage from '../FLanguage/index.vue'
  import {Breadcrumb,type BreadcrumbProps, type TdCardProps} from 'tdesign-vue-next'
  type Props={
    langType?:'button'|'text',
    title?:string,
    breadcrumbOptions?:BreadcrumbProps['options']
    cardProps?:TdCardProps
  }
  const props=withDefaults(defineProps<Props>(), {
    langType:'text',
    breadcrumbOptions:()=>[]
  })
</script>
<template>
<div class="wrapper flex-col h-full flex">
    <FLanguage :type="langType" />
   <div class="mb-4">
     <t-breadcrumb :options="breadcrumbOptions">
      </t-breadcrumb>
   </div>
    <div class="flex-auto flex flex-col">
        <slot name="content">
          <t-card v-bind="cardProps||{}" :bordered="false" :title="title" header-bordered class="edit-body">
          <slot></slot>
          <template #actions>
            <slot name="actions"></slot>
          </template>
        </t-card>
        </slot>
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