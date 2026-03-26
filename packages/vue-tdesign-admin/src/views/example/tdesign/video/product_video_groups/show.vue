<script setup lang="ts">
import {watch} from 'vue'
import { useRequest } from 'src/hooks/useRequest2';
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { DialogPlugin } from 'tdesign-vue-next';
import { useRouter,useRoute } from 'vue-router'

const router=useRouter()
const route=useRoute()
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '产品视频分组列表',
        to: '/example/tdesign/video/product_group/index'
    },
    {
        content: '产品视频分组详情'
    }
]
type ChildItem={
    id:number
    title:string
}
type VideoItem={
    id:number
    title:string
    slug:string
}
type ProductVideoGroup = {
    id?: number
    slug: string
    title: string
    pareintId?:number
    parentTitle:string
    childList:ChildItem[]
    videoList:VideoItem[]
}
const [detailState,detailInst]=useRequest<ProductVideoGroup>({
    defaultValue:{
        slug:'',
        title:'',
        parentTitle:'',
        childList:[],
        videoList:[]
    },
    request:async ()=>{
        return {
            id:1,
            slug:'test-video',
            title:'视频',
            pareintId:0,
            parentTitle:'fdafda',
            childList:[
                {
                    id:1,
                    title:'子分组1'
                },
                {
                    id:2,
                    title:'子分组2'
                },
                {
                    id:3,
                    title:'子分组3'
                },
                {
                    id:4,
                    title:'子分组4'
                },
                {
                    id:5,
                    title:'子分组5'
                },
                {
                    id:6,
                    title:'子分组6'
                },
                {
                    id:7,
                    title:'子分组7'
                },
            ],
            videoList:[
                {
                    id:1,
                    title:'视频1',
                    slug:'test-video-1'
                },
                {
                    id:2,
                    title:'视频2',
                    slug:'test-video-2'
                }
            ]
        }
    }
})
watch(()=>route.query.id,(newVal)=>{
    if(newVal){
        console.log(newVal)
       detailInst.request()
    }
})
const handleCreateVideo = () => {
    router.push({
        path: '/example/tdesign/video/product_video_groups/create'
    })
}
const handleCreateSubGroup = () => {
    router.push({
        path: './new',
        query:{
            parent_id:detailState.data?.id
        }
    })
}
const handleEdit = () => {
    
}
const handleDel = () => {
   const confirm=DialogPlugin.confirm({
    header:false,
    closeBtn:false,
    body:'确认删除该视频分组吗？',
    theme:'danger',
    confirmBtn:{
        content:'删除',
        theme:'danger'
    },
    onConfirm:()=>{
         confirm.setConfirmLoading(true)
         
    }
   })
}
const handleReturn = () => {
    router.replace({
        path: './index'
    })
}
const isArrayOrNotEmpty=(arr:any)=>{
    return Array.isArray(arr) && arr.length>0
}
// 跳转子分组详情
const handleToSubGroup=(item:ChildItem)=>{

    router.push({
        query:{
            id:item.id
        }
    })
}
// 跳转视频详情
const handleToVideo=(item:VideoItem)=>{
     window.open(`/example/tdesign/video/product_video_groups/sub_group?id=${item.id}`,'_blank')
}
</script>
<template>
    <MainLayout :loading="detailState.loading" :show-not-found="!!detailState.error"  layout='edit' show-lang title="产品视频分组详情" :breadcrumb-options="breadcrumbOptions">
  <template #operation>
      <t-space>
           <t-button theme="primary"  @click="handleCreateVideo">新增视频</t-button>
           <t-button theme="primary"  @click="handleCreateSubGroup">新增子分组</t-button>
           <t-button theme="primary"  @click="handleEdit">编辑</t-button>
          <t-button theme="danger"  @click="handleDel">删除</t-button>
          <t-button theme="default"  @click="handleReturn">返回</t-button>
      </t-space>
       </template>
       <div class="list" >
            <div class="flex h-15 items-center">
                <div class="flex-1 text-center text-base">分组标识</div>
                <div class="flex-1 text-center">{{ detailState.data?.slug }}</div>
            </div>
                <div class="flex h-15 items-center">
                <div class="flex-1 text-center text-base">分组标题</div>
                <div class="flex-1 text-center">{{ detailState.data?.title }}</div>
            </div>
                <div class="flex h-15 items-center">
                <div class="flex-1 text-center text-base">父级分组</div>
                <div class="flex-1 text-center">{{ detailState.data?.parentTitle??'-' }}</div>
            </div>
                <div class="flex items-start  pt-4">
                <div class="flex-1 text-center text-base">子分组列表</div>
                <div class="flex-1 text-center" >
                    <div v-if="isArrayOrNotEmpty(detailState.data.childList)">
                        <div v-for="item in detailState.data.childList" :key="item.id">
                           <t-link theme="primary" @click="handleToSubGroup(item)">{{ item.title }}</t-link>
                        </div>
                    </div>
                    <div v-else>
                    </div>
                </div>
            </div>
                  <div class="flex items-start  pt-4" >
                <div class="flex-1 text-center text-base">子视频分组</div>
                <div class="flex-1 text-center" >
                    <div v-if="isArrayOrNotEmpty(detailState.data.videoList)">
                        <div v-for="item in detailState.data.videoList" :key="item.id">
                           <t-link theme="primary" @click="handleToVideo(item)">{{ item.title }}</t-link>
                        </div>
                    </div>
                    <div v-else>
                    </div>
                </div>
            </div>
       </div>
    </MainLayout>
</template>
<style scoped>
.list>div{
    border-top: 1px solid #e5e5e5;
}
</style>