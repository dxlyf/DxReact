<script lang="ts">

import { computed, defineComponent,inject,provide,useModel,type PropType } from 'vue'

export type TreeNodeItem={
    value:string
    label:string
    children?:TreeNodeItem[]
}
export type TreeNodeContext={
    deep:number
}
export default defineComponent({
    name:'TreeNode',
    
    props:{
        modelValue:{
            type:Object as PropType<TreeNodeItem>,
            default:()=>{}
        },
    },
    emits:['update:modelValue'],
    setup(props){
   
        const model=useModel(props,'modelValue')
        const isLeaf=computed(()=>{
            return !Array.isArray(model.value.children)
        })
        const ctx=inject('TREE_CONTEXT')
        const nodeCtx=inject<TreeNodeContext>('TREE_NODE_CONTEXT',{
            deep:0
        })
        provide('TREE_NODE_CONTEXT',{
            deep:nodeCtx.deep+1
        })
        const deep=computed(()=>{
            return nodeCtx.deep
        })
        const isExpanded=computed(()=>{
            return ctx?.isExpanded(model.value.value)
        })
        const toggleExpanded=()=>{
            ctx?.toggleExpanded(model.value.value)
        }
        return{
            data:model,
            isLeaf,
            deep,
            isExpanded,
            toggleExpanded
        }
    }
})
</script>

<template>
  <div class="tree-item">
       <div class="tree-item-node">
         <div class="indentations">
            <div v-for="i in deep" :key="i" class="indentation"></div>
         </div>
         <div class="tree-item-icon">
            <template v-if="!isLeaf">
                <t-icon @click="toggleExpanded" v-if="!isExpanded" name="caret-right-small"></t-icon>
                <t-icon @click="toggleExpanded" v-else name="caret-down-small"></t-icon>
            </template>
         </div>
         <div class="tree-item-label">{{data.label}}</div>
       </div>
       <div v-if="!isLeaf&&data.children" class="tree-item-container" :class="{expand:isExpanded}">
           <div class="tree-item-wrapper">
             <TreeNode  v-for="(item,index) in data.children" :key="item.value" v-model="data.children[index]"  />
           </div>
       </div>
  </div>
</template>
<style>
.tree-item-node{
    display: flex;
    justify-content: flex-start;
}
.tree-item-icon{
    width:24px;
    text-align: end;
}
.tree-item-label{
    flex:1;
}
.indentations>.indentation{
    display: inline-block;
    width: 22px;
}
.tree-item-label:hover{
    background-color: #f3f4f5;
}
.tree-item-container{
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}
.tree-item-container.expand{
    grid-template-rows: 1fr;
}
.tree-item-wrapper{
    min-height: 0;
}

.n-enter-from,
.n-leave-to{
  
   height: 0;
}
.n-enter-active,
.n-leave-active{
    transform:scale(1,0);
}
.tree-item{
    min-height: 0;
}
.n-enter-active2{
    transition: all 0.5s cubic-bezier(0, 0.8, 0., 1);

}
.n-leave-active2{
     /* transform:scale(1,0);
    transition: all 0.5s cubic-bezier(0, 0.8, 0., 1); */
    animation: ccc2 0.5s cubic-bezier(0,0.9,0,1);
    transform-origin:center top;
}
@keyframes ccc2{
    0%{
        transform:scale(1,1);
    }
    100%{
        transform:scale(1,0);
    }
}
</style>