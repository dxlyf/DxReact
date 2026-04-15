<script setup lang="ts">
import { confirm,type ConfirmProps } from '@/views/example/tdesign/util'
import { computed, ComputedRef, h, proxyRefs, toRefs } from 'vue'

export type ActionItem={
    key:string
    label:string
    visible?:boolean
    confirm?:Partial<ConfirmProps>,
    order?:number // 倒序显示
    props?:Record<string,any>
    onClick?:(data:any)=>(void|Promise<void>)
}

export type TableActionProps={
    onItemClick?:(item:ActionItem,data:any)=>(void|Promise<void>)
    items?:ActionItem[]
    data?:any // 行数据
    max?:number // 最大显示数量,超过数量的会显示更多更多按钮
}
export type TableActionEmit={
    //(e:'itemClicki',tem:ActionItem,data:any):(void|Promise<void>)
    itemClick:[item:ActionItem,data:any]
}

const props=withDefaults(defineProps<TableActionProps>(),{
    items:()=>[],
    max:2
})
const emit=defineEmits<TableActionEmit>()

const actionState=computed<{
    normalActions:ActionItem[]
    moreActions:ActionItem[]
}>(()=>{
    const items=props.items||[]
    const maxCount=props.max
    const visibleItems= items.filter(item=>item.visible!==false).map((item,index)=>{
        const {props,...restItem}=item
        const newItem={
            order:item.order||index,
            props:{
                ...(props||{})
            },
            ...restItem
        }
        return newItem;
    })
    visibleItems.sort((a,b)=>(b.order||0)-(a.order||0))
    const normalActions:ActionItem[]=[]
    const moreActions:ActionItem[]=[]
    const moreActionCount=visibleItems.length-maxCount
  
    for(let i=0;i<maxCount;i++){
        normalActions.push(visibleItems[i])
    }
    if(moreActionCount>1){
        for(let i=maxCount;i<visibleItems.length;i++){
            moreActions.push(visibleItems[i])
        }
    }else if(moreActionCount===1){
        normalActions.push(visibleItems[maxCount])
    }

    return {normalActions,moreActions}
})
// utils/index.ts
function toComputedRefs<T extends Record<string, any>>(
  computedObj: ComputedRef<T>
) {
  const refs = {} as Record<string, ComputedRef<any>>
  Object.keys(computedObj.value).forEach(key => {
    refs[key] = computed(() => computedObj.value[key])
  })
  return refs as { [K in keyof T]: ComputedRef<T[K]> }
}
const {normalActions,moreActions}=toComputedRefs(actionState)

const moreActionsMenu=computed(()=>{
    return moreActions.value.map(item=>{
        return {
            content:item.label,
           // content:h('span',{class:'text-blue-500'},item.label),
            value:item.key,
            
        }
    })
})
const handleItemClick=(item:ActionItem)=>{
    if(item.confirm){
        confirm({
            ...item.confirm,
            onConfirm:async ()=>{
                await item.onClick?.(props.data)
                emit('itemClick',item,props.data)
            }
        })
        return
    }
    item.onClick?.(props.data)
    emit('itemClick',item,props.data)
}
const handleMenuItemClick=(item:any)=>{
    const curItem=moreActions.value.find(i=>i.key===item.value)
    if(curItem){
       handleItemClick(curItem)
    }
}
</script>

<template>
    <div class="flex gap-2">
        <t-link  theme="primary" v-for="(item) in normalActions" @click="handleItemClick(item)" :key="item.key" v-bind="item.props">
            {{item.label}}
        </t-link>
        <template v-if="moreActionsMenu.length>0">
         <t-dropdown :options="moreActionsMenu" trigger="click" @click="handleMenuItemClick">
            <t-space>
                <t-link theme="primary" >
                更多
                <template #suffix> <t-icon name="chevron-down" size="14" /></template>
                </t-link>
            </t-space>
            </t-dropdown>
        </template>
    </div>
</template>
<style lang="css" scoped>

</style>