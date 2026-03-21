<script setup lang="ts">
import { shallowRef,ref, watch } from 'vue'
import { useDraggable } from 'vue-draggable-plus'

type Item={
  [Key:string]:any
}
type Props={
  rowKey?:string
  items:Item[]
}
const props=withDefaults(defineProps<Props>(),{
  rowKey:'index',
  items:()=>[]
})
const list=ref([])
const emit=defineEmits(['change'])
const el=shallowRef<HTMLElement>()
watch(()=>props.items,(val)=>{
  if(val){
    list.value=val.slice()
  }
},{
  immediate:true
})
useDraggable(el, list, { 
  animation: 150, 
  //handle: '.handle',
  onEnd:(e)=>{
    const {clonedData,data,oldIndex,newIndex}=e
  //  console.log('newList',list.value)
    emit('change',list.value.slice())
  }
 })

</script>

<template>
  <div ref="el" class="max-h-[300px] overflow-y-auto rounded-sm p-4 bg-[#f8f9fa] flex flex-col gap-2 self-stretch border border-[#e6e8eb]">
     <div class="rounded-sm bg-white h-8 flex items-center box-border p-4 gap-2" v-for="(item,index) in list" :key="rowKey=='index'?index:item[rowKey]">
       <div class="handle"><t-icon name="move"></t-icon></div>
       <div><slot :item="item"></slot></div>
     </div>
  </div>
</template>