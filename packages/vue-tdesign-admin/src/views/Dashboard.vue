<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800">仪表盘</h2>
      
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">总用户数</p>
              <h3 class="text-2xl font-bold text-gray-800">1,234</h3>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              👥
            </div>
          </div>
          <div class="mt-4 text-sm text-green-600">
            <span class="font-medium">+12%</span> 较上月
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">今日访问量</p>
              <h3 class="text-2xl font-bold text-gray-800">567</h3>
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              📈
            </div>
          </div>
          <div class="mt-4 text-sm text-green-600">
            <span class="font-medium">+8%</span> 较昨日
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">系统状态</p>
              <h3 class="text-2xl font-bold text-gray-800">正常</h3>
            </div>
            <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              🟢
            </div>
          </div>
          <div class="mt-4 text-sm text-gray-500">
            运行时间: 120 天
          </div>
        </div>
      </div>
      
      <!-- 图表区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">用户增长趋势</h3>
          <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p class="text-gray-500">图表区域</p>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">系统性能</h3>
          <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p class="text-gray-500">图表区域</p>
          </div>
        </div>
      </div>
      
      <!-- 最近活动 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">最近活动</h3>
        <div class="space-y-4">
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
              👤
            </div>
            <div>
              <p class="text-gray-800">用户 <span class="font-medium">张三</span> 登录系统</p>
              <p class="text-sm text-gray-500">2024-01-29 10:30</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
              ➕
            </div>
            <div>
              <p class="text-gray-800">新增用户 <span class="font-medium">李四</span></p>
              <p class="text-sm text-gray-500">2024-01-29 09:15</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-4">
              🔧
            </div>
            <div>
              <p class="text-gray-800">系统更新完成</p>
              <p class="text-sm text-gray-500">2024-01-29 08:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
// Dashboard.vue
</script>

<style scoped>
/* 自定义样式 */
</style>