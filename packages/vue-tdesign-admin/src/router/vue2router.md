## 🎯 Vue 3 风格封装 Vue 2 Router

这是一个很好的需求！可以在 Vue 2 项目中**模拟 Vue 3 的 `useRoute` 和 `useRouter` 组合式 API**，让代码更现代化。

## 📦 完整封装实现

### 方案一：基础封装（推荐）

```javascript
// composables/useRoute.js (Vue 2 版本)
import { ref, computed, onBeforeUnmount } from '@vue/composition-api'
// 或者使用 vue-demi 兼容 Vue 2 和 Vue 3
// import { ref, computed, onBeforeUnmount } from 'vue-demi'

/**
 * Vue 2 中模拟 Vue 3 的 useRouter
 */
export function useRouter() {
  // 从 Vue 实例中获取 router
  const vm = getCurrentInstance()?.proxy
  const router = vm?.$router
  
  if (!router) {
    throw new Error('useRouter 必须在 Vue 组件中调用')
  }
  
  // 返回 router 实例，保持 API 一致
  return router
}

/**
 * Vue 2 中模拟 Vue 3 的 useRoute
 */
export function useRoute() {
  const vm = getCurrentInstance()?.proxy
  const route = vm?.$route
  
  if (!route) {
    throw new Error('useRoute 必须在 Vue 组件中调用')
  }
  
  // 创建响应式 route 对象
  const currentRoute = ref(route)
  
  // 监听路由变化
  const unwatch = vm?.$watch('$route', (newRoute) => {
    currentRoute.value = newRoute
  })
  
  // 组件卸载时清理
  if (onBeforeUnmount) {
    onBeforeUnmount(() => {
      if (unwatch) unwatch()
    })
  }
  
  // 返回响应式 route 对象
  return currentRoute
}
```

### 方案二：完整版（包含类型和更多功能）

```javascript
// composables/useVue2Router.js
import { ref, computed, reactive, onBeforeUnmount } from '@vue/composition-api'

/**
 * 创建响应式的 route 对象
 */
function createReactiveRoute(route) {
  // 创建响应式数据
  const state = reactive({
    path: route.path,
    name: route.name,
    params: route.params,
    query: route.query,
    hash: route.hash,
    fullPath: route.fullPath,
    matched: route.matched,
    meta: route.meta,
    redirectedFrom: route.redirectedFrom
  })
  
  // 更新方法
  const update = (newRoute) => {
    state.path = newRoute.path
    state.name = newRoute.name
    state.params = newRoute.params
    state.query = newRoute.query
    state.hash = newRoute.hash
    state.fullPath = newRoute.fullPath
    state.matched = newRoute.matched
    state.meta = newRoute.meta
    state.redirectedFrom = newRoute.redirectedFrom
  }
  
  return {
    state,
    update
  }
}

/**
 * useRouter - 返回 router 实例
 */
export function useRouter() {
  const vm = getCurrentInstance()?.proxy
  
  if (!vm || !vm.$router) {
    throw new Error('useRouter 必须在 Vue 2 组件中调用，且确保已安装 Vue Router')
  }
  
  // 返回原生 router，但包装一下保持 API 一致
  const router = vm.$router
  
  // 添加兼容方法
  const push = (to) => {
    if (typeof to === 'string') {
      return router.push(to)
    }
    // 处理对象格式
    return router.push(to)
  }
  
  const replace = (to) => {
    if (typeof to === 'string') {
      return router.replace(to)
    }
    return router.replace(to)
  }
  
  return {
    push,
    replace,
    go: router.go.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    beforeEach: router.beforeEach.bind(router),
    afterEach: router.afterEach.bind(router),
    resolve: router.resolve.bind(router),
    get currentRoute() {
      return router.currentRoute
    }
  }
}

/**
 * useRoute - 返回响应式的 route 对象
 */
export function useRoute() {
  const vm = getCurrentInstance()?.proxy
  
  if (!vm || !vm.$route) {
    throw new Error('useRoute 必须在 Vue 2 组件中调用')
  }
  
  // 创建响应式 route
  const routeRef = ref(vm.$route)
  const reactiveRoute = createReactiveRoute(vm.$route)
  
  // 监听路由变化
  let unwatch = null
  
  if (vm.$watch) {
    unwatch = vm.$watch('$route', (newRoute) => {
      routeRef.value = newRoute
      reactiveRoute.update(newRoute)
    }, { immediate: false, deep: true })
  }
  
  // 组件卸载时清理
  onBeforeUnmount(() => {
    if (unwatch) {
      unwatch()
    }
  })
  
  // 返回响应式 route，API 与 Vue 3 保持一致
  return {
    get path() {
      return routeRef.value?.path || reactiveRoute.state.path
    },
    get name() {
      return routeRef.value?.name || reactiveRoute.state.name
    },
    get params() {
      return routeRef.value?.params || reactiveRoute.state.params
    },
    get query() {
      return routeRef.value?.query || reactiveRoute.state.query
    },
    get hash() {
      return routeRef.value?.hash || reactiveRoute.state.hash
    },
    get fullPath() {
      return routeRef.value?.fullPath || reactiveRoute.state.fullPath
    },
    get matched() {
      return routeRef.value?.matched || reactiveRoute.state.matched
    },
    get meta() {
      return routeRef.value?.meta || reactiveRoute.state.meta
    },
    // 提供原始对象
    get value() {
      return routeRef.value
    }
  }
}

/**
 * 获取路由参数（组合式函数）
 */
export function useRouteParams(paramName) {
  const route = useRoute()
  
  return computed({
    get: () => route.params[paramName],
    set: (value) => {
      const router = useRouter()
      router.replace({
        ...route.value,
        params: {
          ...route.params,
          [paramName]: value
        }
      })
    }
  })
}

/**
 * 获取路由查询参数
 */
export function useRouteQuery(queryName) {
  const route = useRoute()
  
  return computed({
    get: () => route.query[queryName],
    set: (value) => {
      const router = useRouter()
      router.replace({
        ...route.value,
        query: {
          ...route.query,
          [queryName]: value
        }
      })
    }
  })
}
```

### 方案三：使用 vue-demi 实现跨版本兼容

```javascript
// composables/useVueRouter.js
import { ref, computed, onBeforeUnmount } from 'vue-demi'

/**
 * 跨版本兼容的 useRouter
 */
export function useRouter() {
  // 检测 Vue 版本
  const isVue3 = typeof window !== 'undefined' && 
    window.__VUE__ && 
    window.__VUE__.version?.startsWith('3')
  
  if (isVue3) {
    // Vue 3 直接使用官方 API
    const { useRouter: useVue3Router } = require('vue-router')
    return useVue3Router()
  }
  
  // Vue 2 使用兼容实现
  const vm = getCurrentInstance()?.proxy
  const router = vm?.$router
  
  if (!router) {
    throw new Error('useRouter 必须在组件中调用')
  }
  
  // 包装 router 方法
  const push = (to) => {
    if (typeof to === 'string') {
      return router.push(to)
    }
    return router.push(to)
  }
  
  const replace = (to) => {
    if (typeof to === 'string') {
      return router.replace(to)
    }
    return router.replace(to)
  }
  
  return {
    push,
    replace,
    go: router.go.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    beforeEach: router.beforeEach.bind(router),
    afterEach: router.afterEach.bind(router),
    resolve: router.resolve.bind(router),
    get currentRoute() {
      return router.currentRoute
    }
  }
}

/**
 * 跨版本兼容的 useRoute
 */
export function useRoute() {
  const isVue3 = typeof window !== 'undefined' && 
    window.__VUE__ && 
    window.__VUE__.version?.startsWith('3')
  
  if (isVue3) {
    const { useRoute: useVue3Route } = require('vue-router')
    return useVue3Route()
  }
  
  // Vue 2 实现
  const vm = getCurrentInstance()?.proxy
  const route = ref(vm?.$route)
  
  let unwatch = null
  if (vm?.$watch) {
    unwatch = vm.$watch('$route', (newRoute) => {
      route.value = newRoute
    })
  }
  
  onBeforeUnmount(() => {
    if (unwatch) unwatch()
  })
  
  // 返回响应式 route
  return computed(() => route.value)
}
```

## 📝 使用示例

### 在 Vue 2 组件中使用

```vue
<template>
  <div class="user-profile">
    <h1>用户: {{ route.params.id }}</h1>
    <p>当前路径: {{ route.fullPath }}</p>
    <p>查询参数: {{ route.query }}</p>
    
    <button @click="goBack">返回</button>
    <button @click="goToEdit">编辑</button>
  </div>
</template>

<script>
import { defineComponent, watchEffect } from '@vue/composition-api'
import { useRoute, useRouter, useRouteParams } from '@/composables/useRoute'

export default defineComponent({
  setup() {
    // 使用 Vue 3 风格的路由 API
    const route = useRoute()
    const router = useRouter()
    
    // 获取路由参数
    const userId = useRouteParams('id')
    
    // 监听路由变化
    watchEffect(() => {
      console.log('路由变化:', route.path)
      console.log('用户ID:', userId.value)
    })
    
    // 方法
    const goBack = () => {
      router.back()
    }
    
    const goToEdit = () => {
      router.push({
        name: 'UserEdit',
        params: { id: route.params.id }
      })
    }
    
    return {
      route,
      userId,
      goBack,
      goToEdit
    }
  }
})
</script>
```

### 在 Vue 2 的 Options API 中使用

```vue
<script>
import { defineComponent } from 'vue'
import { useRoute, useRouter } from '@/composables/useRoute'

export default defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    return {
      route,
      router
    }
  },
  mounted() {
    // 使用 setup 返回的数据
    console.log('当前路由:', this.route.fullPath)
  },
  methods: {
    handleClick() {
      this.router.push('/about')
    }
  }
})
</script>
```

## 🎯 高级用法：封装成插件

```javascript
// plugins/vue2RouterComposition.js
import { ref, computed, onBeforeUnmount } from '@vue/composition-api'

export default {
  install(Vue, options = {}) {
    // 提供全局的 useRoute 和 useRouter
    Vue.prototype.$useRoute = function() {
      const route = ref(this.$route)
      
      const unwatch = this.$watch('$route', (newRoute) => {
        route.value = newRoute
      })
      
      // 组件卸载时清理
      const vm = this
      const originalUnmounted = vm.$options.beforeDestroy
      vm.$options.beforeDestroy = function() {
        if (unwatch) unwatch()
        if (originalUnmounted) originalUnmounted.call(this)
      }
      
      return route
    }
    
    Vue.prototype.$useRouter = function() {
      return this.$router
    }
  }
}
```

## 📊 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|:---|:---|:---|:---|
| 基础封装 | 简单轻量 | 功能较少 | 简单项目 |
| 完整版 | API 一致，功能完整 | 代码较多 | 大型项目 |
| vue-demi | 跨版本兼容 | 需要额外依赖 | 跨版本库 |
| 插件化 | 全局可用 | 侵入性 | 全项目统一 |

## 💡 最佳实践

```javascript
// 创建统一的导出文件
// composables/index.js
export { useRoute, useRouter } from './useVue2Router'

// 在组件中使用
import { useRoute, useRouter } from '@/composables'

// API 与 Vue 3 完全一致
const route = useRoute()
const router = useRouter()

// 完全兼容 Vue 3 的写法
watchEffect(() => {
  console.log('路由参数:', route.params.id)
})

router.push({ name: 'Home' })
```

这样封装的优点是：
1. **API 与 Vue 3 完全一致**，方便未来升级
2. **响应式**，路由变化会自动触发视图更新
3. **类型安全**，可以配合 TypeScript 使用
4. **解耦**，不依赖具体的路由实现