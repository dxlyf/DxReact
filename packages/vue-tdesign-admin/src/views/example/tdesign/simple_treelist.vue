<script setup lang="ts">
import type { FormInstanceFunctions, TdBreadcrumbProps, TdTreeProps, TreeInstanceFunctions, TreeNodeModel } from 'tdesign-vue-next';
import FLangSwitch from './components/FLangSwitch/index.vue';
import './theme.css'
import { computed, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import { useRequest } from '@/hooks/useRequest2'
import { cloneDeep } from 'lodash-es';
import { useTree } from './hooks/useTree';
import MainLayout from './components/Layouts/MainLayout.vue'
import FSelectDialog from './components/FSelectDialog/index.vue'
import EditForm from './components/ProductGroups/EditForm.vue';
import { useRouter } from 'vue-router'
import { useElementSize } from 'src/hooks/useElementSize';
import {useElementBounding,useWindowScroll} from '@vueuse/core'
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
const expandedKeys = shallowRef<any[]>([])
const activeKeys = shallowRef<any[]>([])
const formRef = shallowRef<FormInstanceFunctions>(null)

const delay = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time))
}
const [state, treeInst] = useRequest<VideoGroupItem[]>({
    request: async () => {
        await delay(2000)
        return [
            {
                id: 1,
                slug: 'group1fdasfdasfsafdsafdsafdafdsa',
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
            }, ...Array.from({ length: 30 }, (v, i) => ({
                id: i + 4,
                slug: `group${i + 4}`,
                childCount: 0,
                nodes: null
            }))
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
treeInst.request().then((data) => {
    if (data) {
        expandedKeys.value = data.map(d => d.id)
    }
})
const treeRef = shallowRef<TreeInstanceFunctions>()
const handleNewAdd = () => {
    router.push({
        path: './treelist_new',
        query: {
        }
    })
}

const handleDrop: TdTreeProps['onDrop'] = ({ dragNode, dropNode, dropPosition }) => {
    const id=dragNode.data.id
    const panret=dropNode.getParent()
    const targetIndex=dropPosition
    const index=dropNode.getIndex()-1
    const parentId=panret?panret.data.id:null
     console.log('id',id,'parentId',parentId,'targetIndex',dropPosition,'index',index)
    // console.log('dragNode', dragNode)
    // console.log('dropNode', dropNode)
    // console.log('dropPosition', dropPosition)
     //state.data=treeRef.value.getTreeData()wwu
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
const enableDrag = ref(true)
const handleDragStart: TdTreeProps['onDragStart'] = ({ e, dragNode }) => {
    //enableDrag.value=true
    //  activeKeys.value=[]
}
const handleActive: TdTreeProps['onActive'] = (value, { trigger, node }) => {
    // console.log('value',value,'onActive', 'node', node, 'trigger', trigger)
    activeKeys.value = value.slice()
}
const handleExpand: TdTreeProps['onExpand'] = (value, { trigger, node }) => {
    // console.log('value',value,'onExpand', 'node', node, 'trigger', trigger)
    expandedKeys.value = value.slice()
}
const showEmpty = computed(() => {
    return activeKeys.value.length <= 0
})
const currentActiveNode = computed(() => {
    return treeRef.value.getItem(activeKeys.value[0])
})
const formData = reactive<any>({})
const rules = {
    slug: [
        { required: true, message: '请输入Slug' }
    ]
}

const requestProducts = async (keywork: string) => {
    console.log('keywork', keywork)

    await delay(3000)
    return Array.from({ length: 1000 }, (item, index) => ({ value: index, label: `产品${index + 1}` }))
}

// const [treeWrapRef,treeWrapState]=useElementSize({
//     onResize:(state,rect)=>{
//         console.log('rect',rect.height,state.previous?.height)
//         if(!state.previous||state.previous.height!=rect.height){
//             state.height=window.innerHeight-state.top-50
//         }

//     }
// })

// const treeHeight = computed(() => {
//     return Math.max(window.innerHeight - 300,200)
// })
let clearScrollTimeout: any
let leftTreeWrap = shallowRef<HTMLDivElement>(null)
let isFixedTop = shallowRef(false)
const setupScroll = () => {
    const handle = () => {
        if (leftTreeWrap.value) {
            const rect = leftTreeWrap.value.getBoundingClientRect()
            if (rect.top < 60) {
                isFixedTop.value = true
            } else {
                isFixedTop.value = false
            }
        }
    }
    window.addEventListener('scroll', handle)
}
onMounted(() => {
   // clearScrollTimeout = setupScroll()
})
onBeforeUnmount(() => {
    clearScrollTimeout && clearScrollTimeout()
})
const treeWrapRef=shallowRef<HTMLDivElement>(null)
const {top}=useElementBounding(treeWrapRef,{
 // windowScroll:false
})

const treeHeight=computed(()=>{
    console.log('top',top.value,'window.innerHeight',window.innerHeight,'scrollTop',window.pageYOffset)
    return window.innerHeight-top.value+window.pageYOffset
})
</script>
<template>
    <MainLayout show-lang title="产口分组" :breadcrumb-options="breadcrumbOptions">
        <template #actions>
            <t-button theme="primary" @click="handleNewAdd">新增</t-button>
        </template>
        <div class="grid grid-cols-[260px_1fr] gap-x-4" >
            <t-loading :loading="state.loading"  class="self-start grid grid-rows-[1fr]  box-border p-3 bg-white rounded-sm relative">
               <div :style="{position:top<56?'fixed':'static',top:'56px'}">
                 <div class="mb-2">
                        <t-input @change="handleFilterInput"></t-input>
                    </div>
                <div ref="treeWrapRef">
                    <t-tree class="tree"  :height="treeHeight" @expand="handleExpand" :expanded="expandedKeys" activable
                        :actived="activeKeys" :class="{ 'tree-drag-mode': enableDrag }" :filter="handleFilterTreeNode"
                        @active="handleActive" @drag-start="handleDragStart" :draggable="enableDrag"
                        :keys="{ value: 'id', label: 'slug', children: 'nodes' }" ref="treeRef" :data="state.data" hover
                        @drop="handleDrop">
                        <template #icon="{ node }">
                            <div class="tree-move-icon" :class="{ 'tree-move-icon-leaf': node.isLeaf() }">
                                <t-icon name="move" size="12" style="color:#333"></t-icon>
                            </div>
                            <div v-if="!node.isLeaf()">
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
                            <div v-if="node.data.childCount > 0"
                                class="bg-[rgba(0,0,0,0.6)] text-white rounded-full px-1 mr-1 text-xs"> {{
                                    node.data.childCount }}</div>
                        </template>
                    </t-tree>
                </div>
               </div>
            </t-loading>
            <div class="grid grid-rows-[1fr]">
                <div v-if="showEmpty" class="h-full flex flex-col items-center justify-center bg-white rounded-sm p-4">
                    <div>
                        <t-icon name="file"></t-icon>
                    </div>
                    <div class="text-gray-500 mt-2">暂无数据</div>
                </div>
                <div v-else class="h-full flex flex-col">
                    <EditForm :header="currentActiveNode.data.slug" :id="currentActiveNode.data.id">
                    </EditForm>
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

.tree-move-icon {
    visibility: hidden;
}

.tree :deep(.t-tree__item--draggable:hover) .tree-move-icon {
    visibility: visible;
}
.tree :deep(.t-tree__label>span){
    display: inline-block;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: fit-content;
}
.tree{
    width: 240px;
}
/* .t-tree__icon{
        width: 60px!important;
    } */
</style>