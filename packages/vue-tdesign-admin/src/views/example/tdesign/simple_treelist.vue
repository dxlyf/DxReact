<script setup lang="ts">
import type { FormInstanceFunctions, TdBreadcrumbProps, TdTreeProps, TreeInstanceFunctions, TreeNodeModel } from 'tdesign-vue-next';
import FLangSwitch from './components/FLangSwitch/index.vue';
import './theme.css'
import { computed, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import { useRequest } from '@/hooks/useRequest2'
import { cloneDeep } from 'lodash-es';
import { useTree } from './hooks/useTree';
import MainLayout from './components/Layouts/MainLayout.vue'
import FSelectDialog from './components/FSelectDialog/index.vue'
import EditForm from './components/ProductGroups/EditForm.vue';
import { useRouter } from 'vue-router'

const router = useRouter()

const breadcrumbOptions: TdBreadcrumbProps['options'] = [
    {
        content: '首页',
        to: '/',
    },
    {
        content: 'prodcut',
        to: '/product',
    },
    {
        content: '产口分组'
    }
]

type VideoGroupItem = {
    id: number
    slug: string
    childCount: number
    nodes?: VideoGroupItem[] | null

}
const formRef = shallowRef<FormInstanceFunctions>(null)

const [state, treeInst] = useRequest<VideoGroupItem[]>({
    request: async () => {
        return [
            {
                id: 1,
                slug: 'group1',
                childCount: 2,
              //  disabled: true,
               // draggable: false,
                nodes: [
                    {
                        id: 2,
                        slug: 'group1-1',
                        childCount: 0,
                        nodes: null
                    },
                    {
                        id: 3,
                        slug: 'group1-2',
                        childCount: 3,
                        nodes: [{
                            id: 3001,
                            slug: 'group1-2-1',
                            childCount: 0,
                            nodes: null
                        }, {
                            id: 3002,
                            slug: 'group1-2-2',
                            childCount: 0,
                            nodes: null
                        }, {
                            id: 3003,
                            slug: 'group1-2-3',
                            childCount: 0,
                            nodes: null
                        }]
                    },
                    {
                        id: 7,
                        slug: 'group1-3',
                        childCount: 0,
                        nodes: null
                    },
                    {
                        id: 8,
                        slug: 'group1-4',
                        childCount: 0,
                        nodes: null
                    }
                ]
            }, {
                id: 4,
                slug: 'group2',
                childCount: 0,
                nodes: null
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
const treeRef = shallowRef<TreeInstanceFunctions>()
const handleNewAdd = () => {
    router.push({
        path: './treelist_new',
        query: {
        }
    })
}

const handleDrop: TdTreeProps['onDrop'] = ({ dragNode, dropNode, dropPosition }) => {
    console.log('dragNode', dragNode)
    console.log('dropNode', dropNode)
    console.log('dropPosition', dropPosition)
}
const handleFilterTreeNode = shallowRef(null)
const handleFilterInput = (val: string) => {
    if (val) {
        handleFilterTreeNode.value = (node: TreeNodeModel) => {
            return node.data.slug.includes(val)
        }
    } else {
        handleFilterTreeNode.value = null
    }
}
const enableDrag=ref(true)
const handleDragStart: TdTreeProps['onDragStart'] = ({ e,dragNode }) => {
    //enableDrag.value=true
  //  activeKeys.value=[]
}
const handleActive: TdTreeProps['onActive'] = (value, { trigger, node }) => {
    console.log('value',value,'onActive', 'node', node, 'trigger', trigger)
    activeKeys.value=value.slice()
}
const activeKeys=shallowRef([])
const showEmpty=computed(()=>{
    return activeKeys.value.length<=0
})
const currentActiveNode=computed(()=>{
    return treeRef.value.getItem(activeKeys.value[0])
})
const formData=reactive<any>({})
const rules={
    slug:[
        {required:true,message:'请输入Slug'}
    ]
}
const delay=(time:number)=>{
    return new Promise(resolve=>setTimeout(resolve,time))
}
const requestProducts=async (keywork:string)=>{
    console.log('keywork',keywork)

    await delay(3000)
    return Array.from({ length: 1000 }, (item, index) => ({ value: index, label: `产品${index + 1}` }))
}
console.log('new',history.state)

</script>
<template>
    <MainLayout   show-lang title="产口分组" :breadcrumb-options="breadcrumbOptions">
        <template #actions>
            <t-button theme="primary"  @click="handleNewAdd">新增</t-button>
        </template>
            <div class="flex gap-4 flex-1">
            <div class="w-[260px] box-border p-3 bg-white rounded-sm">
                <t-input @change="handleFilterInput" class="mb-2"></t-input> 
                <t-tree class="tree" activable :actived="activeKeys" :class="{'tree-drag-mode':enableDrag}" :filter="handleFilterTreeNode"  @active="handleActive"
                    @drag-start="handleDragStart" :draggable="enableDrag" :keys="{ value: 'id', label: 'slug', children: 'nodes' }" ref="treeRef"
                     :data="state.data" hover @drop="handleDrop">
                    <template #icon="{ node }">
                        <div class="tree-move-icon" :class="{ 'tree-move-icon-leaf': node.isLeaf() }">
                            <t-icon name="move" size="12" style="color:#333"></t-icon>
                        </div>
                        <div v-if="!node.isLeaf()" >
                            <t-icon v-if="node.expanded" style="color:#333" name="caret-down-small"
                                color="#333"></t-icon>
                            <t-icon v-else name="caret-right-small" style="color:#333"></t-icon>
                        </div>
                    </template>
                    <!-- <template #label="{ node }">
                        <div @click.stop class="flex justify-between group relative">
                            <div class="flex-1">{{ node.label }} </div>
                            <div class="flex-none invisible group-hover:visible">
                                <t-icon name="drag-move" style="cursor: move;"></t-icon>
                            </div>
                           <div class="flex items-center">
                             <div v-if="node.data.childCount > 0" class="bg-[rgba(0,0,0,0.6)] text-white rounded-full px-1 mr-1 text-xs" > {{ node.data.childCount }}</div>
                           </div>
                        </div>
                    </template> -->
                    <template #operations="{ node }">
                        <div v-if="node.data.childCount > 0" class="bg-[rgba(0,0,0,0.6)] text-white rounded-full px-1 mr-1 text-xs" > {{ node.data.childCount }}</div>
                    </template>
                </t-tree>
            </div>
            <div class="flex-1 bg-white rounded-sm p-4">
                <div v-if="showEmpty" class="h-full flex flex-col items-center justify-center">
                    <div>
                        <t-icon name="file" sty></t-icon>
                    </div>
                    <div class="text-gray-500">暂无数据</div>
                </div>
                 <div v-else class="h-full flex flex-col">
                     <EditForm :id="currentActiveNode.data.id"></EditForm>
                 </div>
            </div>
        </div>
    </MainLayout>
  
</template>
<style scoped>
/* :deep(.t-is-active .t-tree__label){
        background-color: #f3f4f5!important;
    } */
/* .tree-move-icon {
    display: none;
}

.t-tree__icon {
    width: 30px !important;
    justify-content: flex-end !important;
}

.t-tree__item:hover>.t-tree__icon>.tree-move-icon {
    display: block;
} */
 .tree :deep(.t-tree__icon) {
    width: 30px !important;
    justify-content: flex-end !important;
}

.tree-move-icon{
    visibility: hidden;
}

.tree :deep(.t-tree__item--draggable:hover) .tree-move-icon{
    visibility: visible;
}
/* .t-tree__icon{
        width: 60px!important;
    } */
</style>