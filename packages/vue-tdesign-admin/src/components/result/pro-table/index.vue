<template>
  <div class="w-full">
      <t-table class="pro-table"  v-bind="tableProps">
        <template #header>
        <slot name="header" />
        </template>
        <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
        </template>
    </t-table>
  </div>
</template>
<style lang="less" scoped>
.pro-table :global(.t-table__header th){
    background-color: #f8f9fa;
    color:#212733;
    font-weight: 600;
}
</style>
<script  setup lang="ts">
import { toRefs,computed,ref } from 'vue'
import type {ProTableProps} from './inndex.ts'
const props=withDefaults(defineProps<ProTableProps>(),{
    rowKey:'id',
    showHeader:true,
    hover:true,
})
const slots=defineSlots()
const tableProps=computed(()=>{
    return {
        ...props
    }
})

</script>