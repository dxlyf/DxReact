<template>
  <div class="w-full">
     
      <t-table class="pro-table"  v-bind="tableProps">
        <template #topContent >
          <div class="mb-4" v-if="searchForm"> <search-form v-bind="searchForm" /></div>
          <div class="mb-4 flex flex-row" v-if="$slots.leftOperation||$slots.rightOperation">
            <div class="flex flex-1">
                  <slot name="leftOperation" ></slot>
            </div>
            <div class="flex-none">
              <slot name="rightOperation" ></slot>
            </div>
          </div>
        </template>
        <template v-for="(value,name,index) of omit(slots,'leftOperation','rightOperation')" :key="name" #[name]="slotData">
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
import type {ProTableProps} from './index.ts'
import SearchForm from '../form/search-form.vue'
import { omit } from 'lodash-es';
const props=withDefaults(defineProps<ProTableProps>(),{
    rowKey:'id',
    showHeader:true,
    hover:true,
})
const slots=defineSlots<{
    leftOperation:()=>any,
    rightOperation:()=>any,
}>()
const tableProps=computed(()=>{
    const {searchForm,...restProps}=props
    return restProps
})


</script>