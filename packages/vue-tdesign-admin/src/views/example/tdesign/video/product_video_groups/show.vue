<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { useRouter } from 'vue-router'
const router=useRouter()
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
const handleCreateVideo = () => {
    router.push({
        path: '/example/tdesign/video/product_video_groups/create'
    })
}
const handleCreateSubGroup = () => {
    router.push({
        path: '/example/tdesign/video/product_video_groups/sub_group'
    })
}
const handleEdit = () => {
    
}
const handleDel = () => {
   
}
const handleReturn = () => {
    router.replace({
        path: './index'
    })
}
</script>
<template>
    <MainLayout layout='edit' show-lang title="产品视频分组详情" :breadcrumb-options="breadcrumbOptions">
  <template #operation>
      <t-space>
           <t-button theme="primary"  @click="handleCreateVideo">创建视频</t-button>
           <t-button theme="primary"  @click="handleCreateSubGroup">创建子分组</t-button>
           <t-button theme="primary"  @click="handleEdit">编辑</t-button>
          <t-button theme="danger"  @click="handleDel">删除</t-button>
          <t-button theme="default"  @click="handleReturn">返回</t-button>
      </t-space>
       </template>
    </MainLayout>
</template>
