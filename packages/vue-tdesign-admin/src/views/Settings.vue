<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800">设置</h2>
      
      <!-- 设置选项卡 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px space-x-8">
            <button 
              class="px-4 py-4 border-b-2 font-medium text-sm" 
              :class="{
                'border-blue-500 text-blue-600': activeTab === 'basic',
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': activeTab !== 'basic'
              }"
              @click="activeTab = 'basic'"
            >
              基本设置
            </button>
            <button 
              class="px-4 py-4 border-b-2 font-medium text-sm" 
              :class="{
                'border-blue-500 text-blue-600': activeTab === 'security',
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': activeTab !== 'security'
              }"
              @click="activeTab = 'security'"
            >
              安全设置
            </button>
            <button 
              class="px-4 py-4 border-b-2 font-medium text-sm" 
              :class="{
                'border-blue-500 text-blue-600': activeTab === 'notifications',
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': activeTab !== 'notifications'
              }"
              @click="activeTab = 'notifications'"
            >
              通知设置
            </button>
          </nav>
        </div>
        
        <!-- 设置内容 -->
        <div class="p-6">
          <!-- 基本设置 -->
          <div v-if="activeTab === 'basic'" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                系统名称
              </label>
              <input 
                type="text" 
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入系统名称"
                value="后台管理系统"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                系统描述
              </label>
              <textarea 
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入系统描述"
                rows="3"
              >这是一个基于 Vue 3 + TypeScript + TDesign 的后台管理系统</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                系统语言
              </label>
              <select class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                时区设置
              </label>
              <select class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                <option value="UTC">协调世界时 (UTC)</option>
              </select>
            </div>
          </div>
          
          <!-- 安全设置 -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                密码强度要求
              </label>
              <select class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">低 (6位以上)</option>
                <option value="medium" selected>中 (8位以上，包含字母和数字)</option>
                <option value="high">高 (10位以上，包含字母、数字和特殊字符)</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                密码过期时间
              </label>
              <select class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="30">30天</option>
                <option value="60">60天</option>
                <option value="90" selected>90天</option>
                <option value="180">180天</option>
                <option value="365">365天</option>
              </select>
            </div>
            
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="two-factor" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked
              >
              <label for="two-factor" class="ml-2 block text-sm text-gray-700">
                启用双因素认证
              </label>
            </div>
          </div>
          
          <!-- 通知设置 -->
          <div v-if="activeTab === 'notifications'" class="space-y-6">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="email-notifications" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked
              >
              <label for="email-notifications" class="ml-2 block text-sm text-gray-700">
                启用邮件通知
              </label>
            </div>
            
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="sms-notifications" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <label for="sms-notifications" class="ml-2 block text-sm text-gray-700">
                启用短信通知
              </label>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                通知邮箱
              </label>
              <input 
                type="email" 
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入通知邮箱"
                value="admin@example.com"
              >
            </div>
          </div>
          
          <!-- 保存按钮 -->
          <div class="mt-8 flex justify-end">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
// Settings.vue
import { ref } from 'vue'

const activeTab = ref('basic')
</script>

<style scoped>
/* 自定义样式 */
</style>