在 Vue 3 中，获取 `createApp` 创建的实例 `app` 主要有以下几种方式，取决于你的应用场景：

## 🎯 **核心方法**

### 1. **直接获取（最常见）**
`createApp()` 的返回值就是 app 实例，直接保存即可：

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// ✅ 直接保存返回值
const app = createApp(App)

// 使用插件
app.use(router)
app.use(store)

// 全局配置
app.config.errorHandler = (err) => {
  console.error(err)
}

// 全局组件
app.component('MyComponent', {
  // ...
})

// 挂载应用
app.mount('#app')

// 导出供其他地方使用
export { app }
```

### 2. **在组件内获取当前 app 实例**
```vue
<script setup>
import { getCurrentInstance } from 'vue'

// 获取当前组件实例
const instance = getCurrentInstance()

// 从组件实例获取 app 实例
const app = instance.appContext.app

console.log(app) // createApp 创建的实例

// 使用 app 实例
app.config.globalProperties.$someGlobalMethod = () => {
  console.log('全局方法')
}
</script>
```

### 3. **通过插件或库注入**
```javascript
// 创建一个插件来提供 app 实例
export const AppInstancePlugin = {
  install(app) {
    // 将 app 实例挂载到全局属性
    app.config.globalProperties.$app = app
    
    // 也可以提供 provide
    app.provide('appInstance', app)
  }
}

// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { AppInstancePlugin } from './plugins'

const app = createApp(App)
app.use(AppInstancePlugin)
app.mount('#app')
```

在组件中使用：
```vue
<script setup>
import { inject } from 'vue'

// 方式1：通过 inject 获取
const app = inject('appInstance')

// 方式2：通过全局属性（Options API）
// this.$app

// 方式3：通过 getCurrentInstance（前面已介绍）
</script>
```

### 4. **模块导出/导入模式**
```javascript
// app.js - 专门管理 app 实例
import { createApp } from 'vue'
import App from './App.vue'

let app = null

export function createAndMountApp() {
  app = createApp(App)
  
  // 配置 app
  app.config.globalProperties.$env = import.meta.env
  
  // 挂载
  app.mount('#app')
  
  return app
}

export function getApp() {
  if (!app) {
    throw new Error('App not created yet. Call createAndMountApp first.')
  }
  return app
}

// 其他地方使用
import { getApp } from './app'

function someFunction() {
  const app = getApp()
  // 使用 app 实例
}
```

### 5. **单例模式（适用于大型应用）**
```typescript
// app-instance.ts
import { createApp, App as VueApp } from 'vue'
import AppRoot from './App.vue'

class AppInstance {
  private static instance: VueApp | null = null
  
  static create(): VueApp {
    if (!this.instance) {
      this.instance = createApp(AppRoot)
    }
    return this.instance
  }
  
  static get(): VueApp {
    if (!this.instance) {
      throw new Error('App must be created first')
    }
    return this.instance
  }
  
  static destroy() {
    if (this.instance) {
      this.instance.unmount()
      this.instance = null
    }
  }
}

export default AppInstance

// main.ts
import AppInstance from './app-instance'

const app = AppInstance.create()
app.mount('#app')

// 其他文件
import AppInstance from './app-instance'
const app = AppInstance.get() // 获取同一个实例
```

## 🔍 **实际应用场景**

### 场景1：在路由守卫中使用 app 实例
```javascript
// router/index.js
import { createRouter } from 'vue-router'
import { getApp } from '../main' // 假设导出了 app

const router = createRouter({
  // ...
})

router.beforeEach((to, from) => {
  const app = getApp()
  // 使用 app.config.globalProperties 上的方法
  const auth = app.config.globalProperties.$auth
  
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/login'
  }
})
```

### 场景2：在 Pinia store 中使用
```javascript
// stores/appStore.js
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    appVersion: '1.0.0'
  }),
  
  actions: {
    initApp(app) {
      // 保存 app 实例到 store
      this.$app = app
      
      // 使用 app 配置全局
      app.config.globalProperties.$appStore = this
    },
    
    getGlobalConfig() {
      return this.$app?.config
    }
  }
})

// main.js
import { useAppStore } from './stores/appStore'

const app = createApp(App)
const store = useAppStore()
store.initApp(app)
```

### 场景3：在测试环境中
```javascript
// __tests__/app.test.js
import { createApp } from 'vue'
import App from '../src/App.vue'

describe('App', () => {
  let app
  
  beforeEach(() => {
    app = createApp(App)
    // 测试用的配置
    app.config.globalProperties.$testMode = true
  })
  
  afterEach(() => {
    app.unmount()
  })
  
  test('should have test mode enabled', () => {
    expect(app.config.globalProperties.$testMode).toBe(true)
  })
})
```

## 📊 **方法对比**

| 方式 | 优点 | 缺点 | 适用场景 |
|:---|:---|:---|:---|
| 直接保存 | 简单直接，类型支持好 | 需要管理导出 | 大多数应用 |
| `getCurrentInstance` | 组件内随时可用 | 只能在 setup 中使用 | 组件内部需要 app |
| Plugin/Provide | 依赖注入，解耦 | 需要额外代码 | 需要跨组件共享 |
| 单例模式 | 全局唯一，可控 | 可能增加复杂度 | 大型应用，微前端 |
| 模块导出 | 清晰，按需导入 | 需要处理未初始化 | 模块化应用 |

## 💡 **最佳实践建议**

1. **简单应用**：直接保存 app 实例并导出
2. **中型应用**：使用 Plugin + Provide 方式
3. **大型应用/微前端**：使用单例模式或专门的 app 管理模块
4. **组件内部**：优先使用 `inject` 而不是 `getCurrentInstance`

```javascript
// 推荐的做法：组合使用
// app.js
export let app

export function createVueApp() {
  app = createApp(App)
  return app
}

// main.js
import { createVueApp } from './app'
const app = createVueApp()
app.mount('#app')
```

这样既保持了简单性，又提供了足够的灵活性！