<template>
<div class="flex w-full min-h-screen">
  <!-- 侧边栏：sticky 容器，高度100% -->
    <div class="flex flex-col fixed h-screen w-[220px] top-0 bg-white z-20 ">
      <div class='h-15 flex-none border-b border-gray-100'>
        <div class="text-2xl font-bold box-border p-4">Logo</div>
      </div>
      <!-- 顶部导航区域（sticky 时可见） -->
      <div class="flex-1 shadow-sm flex flex-col p-4 overflow-y-auto">
        <div class="font-bold text-lg mb-4">导航菜单</div>
        <ul class="space-y-2">
          <li>
             <div class="p-2 rounded hover:bg-gray-100 rounded">仪表盘</div>
             <ul class="space-y-2 ml-4">
               <li class="p-2 hover:bg-gray-100 rounded">我的</li>
             </ul>
          </li>
          <li class="p-2 hover:bg-gray-100 rounded">设置</li>
          <li class="p-2 hover:bg-gray-100 rounded">用户管理</li>
          <li class="p-2 hover:bg-gray-100 rounded">报表</li>
        </ul>
      </div>
             <!-- 底部区域：mt-auto 推到底部 -->
      <div class="bg-gray-100 border-t  flex-none h-[50px]">
          <div class="text-sm text-gray-600">当前版本 v1.0.0</div>
          <div class="text-xs text-gray-400 mt-1">© 2024 公司名称</div>
        </div>
    </div>


  <!-- 主要内容区：撑满剩余高度 -->
  <div class="flex flex-1 flex-col min-w-0 ">
    <!-- header -->
  <div class="fixed top-0 shadow-sm  left-[220px] right-0 z-10 flex h-15 flex-none items-center bg-white">
  
    <div class="ml-20">
      <ul class="flex gap-4">
        <li><a class="cursor-pointer hover:text-blue-500">Home</a></li>
        <li><a class="cursor-pointer hover:text-blue-500">Products</a></li>
        <li><a class="cursor-pointer hover:text-blue-500">About</a></li>
      </ul>
    </div>
  </div>
    
    <!-- 右侧内容区 -->
    <div class="flex-1 flex flex-col p-4 ml-[220px] mt-15">
      <div class="h-full w-full bg-white p-4 rounded-md">
        <h1 class="text-2xl font-bold mb-4">主要内容区</h1>
        <p class="mb-4">滚动查看侧边栏 sticky 效果...</p>
        <!-- 更多内容 -->
      </div>
    </div>
  </div>
</div>
    </template>
    <script setup lang="ts">
</script>