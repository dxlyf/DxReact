Vue Router 是 Vue.js 官方的路由管理器，专门用于构建单页面应用（SPA）。在 Vue 3 中，我们使用的是 **Vue Router 4**，它与 Vue 3 的组合式 API 完美集成，提供了一套全新的、更灵活的使用方式。

下面我将从安装配置到核心功能，为你详细介绍它的使用方法。

## 📦 一、安装与基础配置

首先，在你的 Vue 3 项目中安装 Vue Router 4：

```bash
npm install vue-router@4
# 或
yarn add vue-router@4
```

### 1. 创建路由实例
在 `src` 目录下创建一个 `router/index.js` 文件，这是定义应用路由的“地图”：

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

// 1. 定义路由映射表
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home  // 直接引入组件
  },
  {
    path: '/about',
    name: 'About',
    // 2. 懒加载方式：当路由被访问时才加载对应组件
    component: () => import('@/views/About.vue')
  },
  {
    path: '/user/:id',  // 动态路由参数
    name: 'User',
    component: () => import('@/views/User.vue'),
    props: true  // 将路由参数作为 props 传递给组件
  }
]

// 3. 创建 router 实例
const router = createRouter({
  history: createWebHistory(),  // HTML5 模式，去除 URL 中的 #
  routes,                       // 路由映射表
  scrollBehavior(to, from, savedPosition) {
    // 4. 控制页面滚动行为
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
```

### 2. 在 main.js 中注册
将路由插件安装到 Vue 应用中：

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)  // 注册路由插件
app.mount('#app')
```

## 🧭 二、核心组件与导航

### 1. 声明式导航：`<router-link>`
在模板中，使用 `<router-link>` 创建导航链接，它会渲染为 `<a>` 标签，并自动处理高亮样式：

```vue
<template>
  <nav>
    <!-- 基础用法：字符串路径 -->
    <router-link to="/">首页</router-link>
    
    <!-- 命名路由：通过 name 和 params 跳转 -->
    <router-link :to="{ name: 'User', params: { id: 123 } }">
      用户中心
    </router-link>
    
    <!-- 带查询参数的跳转 -->
    <router-link :to="{ path: '/about', query: { tab: 'history' } }">
      关于我们
    </router-link>
    
    <!-- 活动类名定制：当前路由匹配时添加 active 类 -->
    <router-link to="/" active-class="active">首页</router-link>
  </nav>
</template>
```

### 2. 路由出口：`<router-view>`
在 `App.vue` 或父组件中，使用 `<router-view>` 来渲染当前路由匹配的组件：

```vue
<template>
  <div id="app">
    <!-- 全局导航 -->
    <NavBar />
    
    <!-- 路由组件渲染的位置 -->
    <router-view v-slot="{ Component }">
      <!-- 添加过渡动画 -->
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
```

## 🚀 三、组合式 API 中的路由用法（Vue 3 核心）

Vue Router 4 提供了两个重要的组合式函数，让你可以在 `setup` 中轻松访问路由：

```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { watch } from 'vue'

// 1. 获取路由实例（用于编程式导航）
const router = useRouter()

// 2. 获取当前路由对象（包含参数、查询等信息）
const route = useRoute()

// 3. 编程式导航示例
const goToAbout = () => {
  router.push('/about')
}

const goToUser = (userId) => {
  router.push({
    name: 'User',
    params: { id: userId },
    query: { from: 'list' }
  })
}

const goBack = () => {
  router.go(-1)
}

// 4. 监听路由参数变化（替代 Vue 2 的 watch $route）
watch(
  () => route.params.id,
  (newId, oldId) => {
    console.log('用户 ID 变化了', newId)
    // 重新获取数据
    fetchUserData(newId)
  }
)

// 5. 获取当前参数
console.log('当前用户ID:', route.params.id)
console.log('查询参数:', route.query)
</script>
```

## 🛡️ 四、导航守卫（路由权限控制）

导航守卫是 Vue Router 最强大的功能之一，用于在路由跳转时进行权限验证、数据预取等操作。

### 1. 全局前置守卫
最常用的守卫，适合做登录验证：

```javascript
// router/index.js

// 定义无需登录的白名单
const whiteList = ['/login', '/register', '/about']

router.beforeEach((to, from, next) => {
  // to: 将要进入的路由对象
  // from: 当前导航正要离开的路由
  // next: 必须调用的函数，决定导航行为
  
  const token = localStorage.getItem('token')
  
  // 如果访问的是登录页且已经登录，直接跳转到首页
  if (to.path === '/login' && token) {
    return next('/')
  }
  
  // 检查是否需要登录权限
  if (to.meta.requiresAuth && !token) {
    // 未登录，重定向到登录页，并带上跳转前的路径
    return next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  
  // 其他情况，放行
  next()
})
```

### 2. 在路由配置中设置元信息
结合 `meta` 字段，实现灵活的权限控制：

```javascript
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { 
      requiresAuth: true,        // 需要登录
      roles: ['admin', 'editor']  // 仅限特定角色
    }
  },
  {
    path: '/profile',
    component: UserProfile,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: Login,
    meta: { guest: true }  // 仅未登录用户可访问
  }
]
```

### 3. 路由独享守卫
在单个路由配置中定义的守卫：

```javascript
const routes = [
  {
    path: '/admin',
    component: AdminPanel,
    beforeEnter: (to, from, next) => {
      // 仅管理员可访问
      if (userRole !== 'admin') {
        next('/403')
      } else {
        next()
      }
    }
  }
]
```

### 4. 组件内守卫
在组件内部定义的守卫：

```vue
<script>
export default {
  beforeRouteEnter(to, from, next) {
    // 在渲染该组件的对应路由被验证前调用
    // 此时组件实例还没被创建，不能访问 this
    next(vm => {
      // 通过 vm 访问组件实例
      vm.loadData()
    })
  },
  beforeRouteUpdate(to, from, next) {
    // 在当前路由改变，但组件被复用时调用
    // 例如：从 /user/1 到 /user/2
    this.userId = to.params.id
    next()
  },
  beforeRouteLeave(to, from, next) {
    // 导航离开该组件的对应路由时调用
    const answer = window.confirm('确定要离开吗？')
    if (answer) {
      next()
    } else {
      next(false)  // 取消导航
    }
  }
}
</script>
```

## 🔄 五、动态路由与嵌套路由

### 1. 动态路由匹配
用于处理不同 ID 的用户页面等场景：

```javascript
const routes = [
  {
    path: '/post/:id',  // 匹配 /post/1, /post/abc 等
    component: PostDetail,
    props: true  // 将 params 作为 props 传递给组件
  },
  {
    path: '/search/:keyword?',  // ? 表示可选参数
    component: SearchResults
  }
]
```

在组件中接收参数：

```vue
<script setup>
const props = defineProps({
  id: {  // 因为开启了 props: true，参数会作为 props 传入
    type: [String, Number],
    required: true
  }
})
</script>
```

### 2. 嵌套路由
实现页面内的多级导航，如后台管理系统的侧边栏+主内容区：

```javascript
const routes = [
  {
    path: '/dashboard',
    component: DashboardLayout,  // 包含 <router-view> 的布局组件
    children: [
      // 默认子路由：访问 /dashboard 时渲染 Overview
      { path: '', component: Overview },
      { path: 'analytics', component: Analytics },
      { path: 'settings', component: Settings }
    ]
  }
]
```

对应的布局组件：

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <Sidebar />
    <main>
      <router-view />  <!-- 子路由组件将在这里渲染 -->
    </main>
  </div>
</template>
```

## ⚙️ 六、高级技巧与最佳实践

### 1. 路由元信息与动态标题
结合导航守卫动态设置页面标题：

```javascript
// router/index.js
const routes = [
  {
    path: '/home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/about',
    component: About,
    meta: { title: '关于我们' }
  }
]

router.beforeEach((to, from, next) => {
  // 设置页面标题
  const title = to.meta.title
  if (title) {
    document.title = `${title} - MyApp`
  }
  next()
})
```

### 2. 缓存路由组件
使用 `<keep-alive>` 缓存路由组件，避免重复渲染：

```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['Home', 'ProductList']">  <!-- 只缓存指定组件 -->
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

### 3. 部署时的 History 模式配置
如果使用 `history` 模式，部署到生产环境时需要配置服务器，确保所有路由都指向 `index.html`。

**Nginx 配置示例**：
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 4. 路由懒加载的性能优化
始终使用动态导入（`() => import()`）实现路由懒加载，这会将每个路由的组件打包成独立的 chunk，减少首屏加载时间。

## 📚 总结

| 功能 | 关键API/组件 | 使用场景 |
|:---|:---|:---|
| 基础导航 | `<router-link>` | 模板中的导航链接 |
| 渲染位置 | `<router-view>` | 组件渲染出口 |
| 编程式导航 | `useRouter()` | 按钮点击、登录成功后跳转 |
| 路由参数 | `useRoute()` | 获取 URL 参数、查询字符串 |
| 权限控制 | `router.beforeEach` | 登录验证、角色权限 |
| 代码分割 | `() => import()` | 性能优化、按需加载 |

Vue Router 4 的设计非常灵活，既能满足小型项目的简单需求，也能支撑大型企业级应用的复杂路由场景。从组合式 API 的 `useRouter` 到强大的导航守卫体系，它为 Vue 3 应用提供了完整的路由解决方案。