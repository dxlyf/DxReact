<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">用户管理</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          新增用户
        </button>
      </div>
      
      <!-- 搜索和筛选 -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input 
              type="text" 
              placeholder="搜索用户..." 
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="flex gap-4">
            <select class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">所有角色</option>
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
            <select class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">禁用</option>
            </select>
            <button class="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              筛选
            </button>
          </div>
        </div>
      </div>
      
      <!-- 用户列表 -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                邮箱
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ user.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-blue-100 text-blue-800': user.role === 'admin',
                  'bg-gray-100 text-gray-800': user.role === 'user'
                }">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-green-100 text-green-800': user.status === 'active',
                  'bg-red-100 text-red-800': user.status === 'inactive'
                }">
                  {{ user.status === 'active' ? '活跃' : '禁用' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-3">编辑</button>
                <button class="text-red-600 hover:text-red-900">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页 -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="text-sm text-gray-500">
            显示 1 至 10 条，共 {{ totalUsers }} 条
          </div>
          <div class="flex items-center space-x-2">
            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50" :disabled="currentPage === 1">
              上一页
            </button>
            <button v-for="page in totalPages" :key="page" class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50" :class="{
              'bg-blue-100 border-blue-500 text-blue-600': currentPage === page
            }">
              {{ page }}
            </button>
            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50" :disabled="currentPage === totalPages">
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
// Users.vue

// 模拟用户数据
const users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: 'user', status: 'active' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: 'user', status: 'inactive' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'user', status: 'active' },
  { id: 5, name: '钱七', email: 'qianqi@example.com', role: 'user', status: 'active' }
]

const totalUsers = 50
const currentPage = 1
const totalPages = Math.ceil(totalUsers / 10)
</script>

<style scoped>
/* 自定义样式 */
</style>