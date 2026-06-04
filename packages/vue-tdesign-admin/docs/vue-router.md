## Vue Router 使用教程

Vue Router 是 Vue.js 的官方路由管理器，用于构建单页应用（SPA）。


### 一、安装与配置

#### 1. 安装 Vue Router

```bash
npm install vue-router@4
# 或
yarn add vue-router@4
```

#### 2. 创建路由配置

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

// 定义路由规则
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView
  },
  {
    path: '/user/:id',
    name: 'user',
    component: () => import('../views/UserView.vue') // 路由懒加载
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // HTML5 模式
  routes
})

export default router
```

#### 3. 在 Vue 应用中注册

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

#### 4. 在根组件中使用路由视图

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <!-- 路由导航链接 -->
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
      <router-link :to="{ name: 'user', params: { id: 123 } }">用户123</router-link>
    </nav>
    
    <!-- 路由出口，匹配的组件会渲染在这里 -->
    <router-view />
  </div>
</template>
```


### 二、基础使用

#### 1. router-link 组件

```vue
<template>
  <div>
    <!-- 字符串路径 -->
    <router-link to="/">首页</router-link>
    
    <!-- 动态路径 -->
    <router-link :to="'/user/' + userId">用户</router-link>
    
    <!-- 对象形式 -->
    <router-link :to="{ path: '/about' }">关于</router-link>
    
    <!-- 命名路由 -->
    <router-link :to="{ name: 'user', params: { id: 123 } }">用户123</router-link>
    
    <!-- 带查询参数 -->
    <router-link :to="{ path: '/user', query: { page: 1, keyword: 'vue' } }">
      搜索
    </router-link>
    
    <!-- 激活状态的样式类 -->
    <router-link to="/" active-class="active" exact-active-class="exact-active">
      首页
    </router-link>
    
    <!-- 替换历史记录（不添加新记录） -->
    <router-link to="/about" replace>关于</router-link>
  </div>
</template>
```

#### 2. 编程式导航

```vue
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 字符串路径
const goToHome = () => {
  router.push('/')
}

// 对象形式
const goToAbout = () => {
  router.push({ path: '/about' })
}

// 命名路由
const goToUser = (id) => {
  router.push({ name: 'user', params: { id } })
}

// 带查询参数
const goToSearch = () => {
  router.push({ path: '/search', query: { keyword: 'vue' } })
}

// 替换当前历史记录
const replaceToAbout = () => {
  router.replace('/about')
}

// 前进/后退
const goBack = () => {
  router.back()
}

const goForward = () => {
  router.forward()
}

const goToStep = () => {
  router.go(2) // 前进两步
  router.go(-1) // 后退一步
}
</script>
```


### 三、动态路由与参数获取

#### 1. 定义动态路由

```javascript
// router/index.js
const routes = [
  {
    path: '/user/:id',
    name: 'user',
    component: UserView
  },
  {
    path: '/user/:id/post/:postId',
    name: 'user-post',
    component: UserPostView
  },
  {
    // 可选参数（带 ?）
    path: '/user/:id?',
    component: UserView
  }
]
```

#### 2. 获取路由参数

```vue
<!-- UserView.vue -->
<template>
  <div>
    <p>用户ID: {{ $route.params.id }}</p>
    <p>查询参数: {{ $route.query.keyword }}</p>
    <p>哈希值: {{ $route.hash }}</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 获取参数
console.log(route.params.id)    // 动态路由参数
console.log(route.query.page)   // 查询参数 ?page=1
console.log(route.hash)         // 哈希值 #section
console.log(route.path)         // 路径
console.log(route.fullPath)     // 完整路径（包含查询参数和哈希）
console.log(route.name)         // 路由名称

// 监听路由变化
import { watch } from 'vue'
watch(() => route.params.id, (newId, oldId) => {
  console.log('路由参数变化', newId)
})
</script>
```


### 四、嵌套路由

```javascript
// router/index.js
const routes = [
  {
    path: '/user/:id',
    component: UserLayout,
    children: [
      {
        // 当 /user/:id/profile 匹配成功
        path: 'profile',
        component: UserProfile
      },
      {
        // 当 /user/:id/posts 匹配成功
        path: 'posts',
        component: UserPosts
      },
      {
        // 默认子路由（访问 /user/:id 时显示）
        path: '',
        component: UserDefault
      }
    ]
  }
]
```

```vue
<!-- UserLayout.vue -->
<template>
  <div class="user-layout">
    <h2>用户中心</h2>
    <nav>
      <router-link :to="{ name: 'user-profile' }">个人资料</router-link>
      <router-link :to="{ name: 'user-posts' }">我的帖子</router-link>
    </nav>
    
    <!-- 子路由出口 -->
    <router-view />
  </div>
</template>
```


### 五、路由守卫

#### 1. 全局守卫

```javascript
// router/index.js
const router = createRouter({ ... })

// 全局前置守卫（常用）
router.beforeEach((to, from, next) => {
  // to: 目标路由
  // from: 来源路由
  // next: 决定路由是否跳转
  
  // 检查用户是否登录
  const isAuthenticated = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 未登录，跳转到登录页
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next() // 允许访问
  }
})

// 全局解析守卫
router.beforeResolve((to, from) => {
  // 在导航被确认之前，所有组件内守卫和异步路由组件被解析之后调用
})

// 全局后置钩子（没有 next）
router.afterEach((to, from) => {
  // 更新页面标题
  document.title = to.meta.title || '默认标题'
  // 发送埋点数据
  sendAnalytics(to.fullPath)
})
```

#### 2. 路由独享守卫

```javascript
const routes = [
  {
    path: '/admin',
    component: AdminView,
    beforeEnter: (to, from) => {
      // 返回 false 取消导航
      if (!isAdmin()) return false
      // 返回路径重定向
      if (!isLoggedIn()) return { name: 'login' }
    }
  }
]
```

#### 3. 组件内守卫

```vue
<script>
export default {
  // 组合式 API 写法
  setup() {
    onBeforeRouteLeave((to, from) => {
      // 离开当前路由时
      const answer = window.confirm('确定要离开吗？')
      if (!answer) return false
    })
    
    onBeforeRouteUpdate((to, from) => {
      // 路由更新时（同一组件，参数变化）
      console.log('路由更新')
    })
  },
  
  // Options API 写法
  beforeRouteEnter(to, from, next) {
    // 在渲染该组件前调用
    // 不能获取组件实例 this，因为组件还没创建
    next(vm => {
      // 可以访问组件实例
    })
  },
  beforeRouteUpdate(to, from) {
    // 路由改变但组件被复用时调用
    this.fetchData(to.params.id)
  },
  beforeRouteLeave(to, from) {
    // 离开当前路由时
    const answer = window.confirm('确定要离开吗？')
    if (!answer) return false
  }
}
</script>
```


### 六、路由元信息

```javascript
// router/index.js
const routes = [
  {
    path: '/admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      roles: ['admin', 'editor'],
      title: '管理后台',
      keepAlive: true
    }
  },
  {
    path: '/login',
    component: LoginView,
    meta: {
      title: '登录',
      hideNavbar: true
    }
  }
]

// 在守卫中使用元信息
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { name: 'login' }
  }
  
  // 更新页面标题
  document.title = to.meta.title || '默认标题'
})
```


### 七、路由懒加载

```javascript
// 两种写法
const routes = [
  {
    path: '/about',
    // 1. 箭头函数 + import
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/dashboard',
    // 2. 使用 webpack 的 chunk 命名
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/DashboardView.vue')
  }
]
```


### 八、滚动行为

```javascript
// router/index.js
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // savedPosition 是浏览器后退/前进时保存的位置
    if (savedPosition) {
      return savedPosition
    }
    
    // 始终滚动到顶部
    return { top: 0 }
    
    // 滚动到指定元素
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
  }
})
```


### 九、路由模式

```javascript
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// HTML5 模式（需要服务器配置支持）
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Hash 模式（使用 URL 哈希值，兼容性好）
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Memory 模式（不操作 URL，适合非浏览器环境）
const router = createRouter({
  history: createMemoryHistory(),
  routes
})
```


### 十、完整示例

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页', keepAlive: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/user/:id',
    component: () => import('../views/UserLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'user-profile',
        component: () => import('../views/UserProfile.vue')
      },
      {
        path: 'settings',
        name: 'user-settings',
        component: () => import('../views/UserSettings.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 全局守卫
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  
  if (to.name === 'login' && token) {
    return { name: 'home' }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title || 'Vue App'
})

export default router
```


### 常见问题处理

1. **重复路由跳转报错**：可以捕获错误或重写 push 方法
2. **动态路由参数变化但组件不更新**：使用 watch 监听路由变化
3. **路由切换后滚动位置**：配置 scrollBehavior
4. **路由权限控制**：使用路由守卫 + 动态路由添加

```javascript
// 解决重复路由跳转报错
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}
```