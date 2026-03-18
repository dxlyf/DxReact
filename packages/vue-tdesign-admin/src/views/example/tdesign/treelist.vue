<script setup lang="ts">
import type { TdBreadcrumbProps,TdTreeProps,TreeInstanceFunctions, TreeNodeModel } from 'tdesign-vue-next';
import FLangSwitch from './components/FLangSwitch/index.vue';
import './theme.css'
import { ref, shallowRef,toRaw,watch } from 'vue';
import {useRequest} from '@/hooks/useRequest2'
import { cloneDeep } from 'lodash-es';
import { useTree } from './hooks/useTree';
import MainLayout from './components/Layouts/MainLayout.vue'
const breadcrumbOptions:TdBreadcrumbProps['options'] = [
    {
        content:'首页',
        to:'/',
    },
    {
        content:'prodcut',
        to:'/product',
    },
    {
        content:'产口分组'
    }
]

type VideoGroupItem={
    id:number
    slug:string                    
    childCount:number
    nodes?:VideoGroupItem[]|null

}

const [state,treeInst]=useRequest<VideoGroupItem[]>({
    request:async ()=>{
        return [
            {
                id:1,
                slug:'group1',
                childCount:2,
                nodes:[
                    {
                        id:2,
                        slug:'group1-1',
                        childCount:0,
                        nodes:null
                    },
                    {
                        id:3,
                        slug:'group1-2',
                        childCount:3,
                        nodes:[{
                            id:3001,
                            slug:'group1-2-1',
                            childCount:0,
                            nodes:null
                        },{
                            id:3002,
                            slug:'group1-2-2',
                            childCount:0,
                            nodes:null
                        },{
                            id:3003,
                            slug:'group1-2-3',
                            childCount:0,
                            nodes:null
                        }]
                    },
                    {
                        id:7,
                        slug:'group1-3',
                        childCount:0,
                        nodes:null
                    },
                    {
                        id:8,
                        slug:'group1-4',
                        childCount:0,
                        nodes:null
                    }
                ]
            },{
                id:4,
                slug:'group2',
                childCount:0,
                nodes:null
            }
        ]
    },
    // transform(data){
    //     const mapTreeDataItem=(d:VideoGroupItem,parentId:number,deep=0)=>{
            
    //         const newItem:any= {
    //             label:d.slug,
    //             value:d.id,
    //             children:null,
    //             parentId:parentId,
    //             //isLeaf:true
    //         }
    //         if(d.nodes&&Array.isArray(d.nodes)){
    //             newItem.children=d.nodes.map(child=>mapTreeDataItem(child,d.id,deep+1))
                
    //         }
    //         return newItem
    //     }
    //     treeData.value= data.map(d=>mapTreeDataItem(d,-1,0))
    // }
})
treeInst.request()
const treeRef=shallowRef<TreeInstanceFunctions>()
const handleNewAdd=()=>{
    console.log('treeData',toRaw(state.data))
    console.log('treeRef',treeRef.value.getTreeData())
}

const handleDrop: TdTreeProps['onDrop'] = ({dragNode,dropNode,dropPosition})=>{
    console.log('dragNode',dragNode)
    console.log('dropNode',dropNode)
    console.log('dropPosition',dropPosition)
}
const handleFilterTreeNode=shallowRef(null)
const handleFilterInput=(val:string)=>{
    if(val){
        handleFilterTreeNode.value=(node:TreeNodeModel)=>{
            return node.data.slug.includes(val)
        }
    }else{
        handleFilterTreeNode.value=null
    }
}

</script>                  
<template>
    <div class="flex flex-col h-full">
        <div class="mb-2">
        <t-breadcrumb separator="/" :options="breadcrumbOptions">
    </t-breadcrumb>
    </div>
    <div class="flex">
        <div class="flex-1">
            <div class="font-semibold text-xl">产口分组</div>
        </div>
        <div class="flex-none">
            <t-space>
                <t-button theme="primary" @click="handleNewAdd">新增</t-button>
            </t-space>
        </div>
    </div>
    <FLangSwitch class="mt-4"></FLangSwitch>
    <div class="mt-4 flex gap-4 flex-1">
        <div class="w-[260px] box-border p-3 bg-white rounded-sm">
            <t-input @change="handleFilterInput" class="mb-2"></t-input>
            <t-tree :filter="handleFilterTreeNode" :activable="true" :keys="{value:'id',label:'slug',children:'nodes'}" ref="treeRef" draggable :data="state.data"  hover @drop="handleDrop">
                <template #icon="{node}">
                    <div  class="tree-move-icon" :class="{'tree-move-icon-leaf':node.isLeaf()}">
                            <t-icon name="move" size="12" style="color:#333"></t-icon>
                    </div>
                    <div v-if="!node.isLeaf()" class="flex">       
                        <t-icon v-if="node.expanded" style="color:#333" name="caret-down-small" color="#333"></t-icon>
                        <t-icon v-else name="caret-right-small" style="color:#333"></t-icon>
                    </div>
                </template>
                <!-- <template #label="{node}">
                    <div class="flex justify-between group px-2 py-1 rounded-sm relative">
                        <div  class="flex-none invisible group-hover:visible mr-2">
                            <t-icon name="drag-move"></t-icon>
                        </div>
                        <div class="flex-1">{{node.label}} </div>
                    </div>
                </template> -->
                <template #operations="{node}">
                    <div class="bg-[rgba(0,0,0,0.6)] text-white rounded-full px-1 mr-1 text-xs" v-if="node.data.childCount>0">  {{node.data.childCount}}</div>
                </template>
            </t-tree>
        </div>
        <div class="flex-1 bg-white rounded-sm">
            <div class="h-full flex flex-col items-center justify-center">
                <div>
                    <t-icon name="file"></t-icon>
                </div>
                <div class="text-gray-500">暂无数据</div>
            </div>
        </div>
    </div>
    </div>
</template>
<style >
    /* :deep(.t-is-active .t-tree__label){
        background-color: #f3f4f5!important;
    } */
    .tree-move-icon{
        display: none;
    }
   
    .t-tree__icon{
        width: 30px!important;
       justify-content: flex-end!important;
    }
    .t-tree__item:hover>.t-tree__icon>.tree-move-icon{
        display: block;
    }
    /* .t-tree__icon{
        width: 60px!important;
    } */
</style>