## Vuex 使用教程

### 1. 安装 Vuex

```bash
npm install vuex@next --save
# 或
yarn add vuex@next
```

### 2. 创建 Store

```javascript
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  // 状态数据
  state: {
    count: 0,
    user: {
      name: '张三',
      age: 18
    }
  },
  
  // 计算属性（派生状态）
  getters: {
    doubleCount: (state) => state.count * 2,
    adultUser: (state) => state.user.age >= 18
  },
  
  // 同步修改状态的方法
  mutations: {
    INCREMENT(state, payload) {
      state.count += payload
    },
    SET_USER_NAME(state, name) {
      state.user.name = name
    }
  },
  
  // 异步操作或复杂逻辑
  actions: {
    incrementAsync({ commit }, payload) {
      setTimeout(() => {
        commit('INCREMENT', payload)
      }, 1000)
    },
    fetchUser({ commit }) {
      return axios.get('/api/user').then(res => {
        commit('SET_USER_NAME', res.data.name)
      })
    }
  },
  
  // 模块化
  modules: {
    // 可以拆分成多个模块
  }
})
```

### 3. 在 Vue 中使用

**main.js 注册：**
```javascript
import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

const app = createApp(App)
app.use(store)
app.mount('#app')
```

**组件中使用：**
```vue
<template>
  <div>
    <!-- 直接显示 state -->
    <p>Count: {{ $store.state.count }}</p>
    
    <!-- 使用 getters -->
    <p>Double Count: {{ $store.getters.doubleCount }}</p>
    
    <!-- 使用 mutations -->
    <button @click="$store.commit('INCREMENT', 5)">+5</button>
    
    <!-- 使用 actions -->
    <button @click="$store.dispatch('incrementAsync', 10)">异步+10</button>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()
    
    // 响应式访问 state
    const count = computed(() => store.state.count)
    const doubleCount = computed(() => store.getters.doubleCount)
    
    // 方法
    const increment = () => {
      store.commit('INCREMENT', 1)
    }
    
    const asyncIncrement = () => {
      store.dispatch('incrementAsync', 1)
    }
    
    return {
      count,
      doubleCount,
      increment,
      asyncIncrement
    }
  }
}
</script>
```

### 4. 辅助函数（Options API）

```vue
<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    // 映射 state
    ...mapState(['count', 'user']),
    
    // 映射 getters
    ...mapGetters(['doubleCount', 'adultUser']),
    
    // 自定义命名
    ...mapState({
      myCount: state => state.count,
      userName: state => state.user.name
    })
  },
  
  methods: {
    // 映射 mutations
    ...mapMutations(['INCREMENT', 'SET_USER_NAME']),
    
    // 映射 actions
    ...mapActions(['incrementAsync', 'fetchUser']),
    
    // 使用
    handleClick() {
      this.INCREMENT(5)
      this.incrementAsync(10)
    }
  }
}
</script>
```

### 5. 模块化（Module）

```javascript
// store/modules/user.js
export default {
  namespaced: true, // 启用命名空间
  state: {
    name: '张三',
    age: 18
  },
  getters: {
    adult: state => state.age >= 18
  },
  mutations: {
    SET_NAME(state, name) {
      state.name = name
    }
  },
  actions: {
    updateName({ commit }, name) {
      commit('SET_NAME', name)
    }
  }
}

// store/index.js
import userModule from './modules/user'

export default createStore({
  modules: {
    user: userModule
  }
})

// 使用模块
// state: $store.state.user.name
// getters: $store.getters['user/adult']
// commit: $store.commit('user/SET_NAME', '李四')
// dispatch: $store.dispatch('user/updateName', '李四')
```

### 6. 辅助函数处理模块

```vue
<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    // 模块的 state
    ...mapState('user', ['name', 'age']),
    
    // 模块的 getters
    ...mapGetters('user', ['adult'])
  },
  
  methods: {
    ...mapMutations('user', ['SET_NAME'])
  }
}
</script>
```

### 7. 项目结构建议

```
src/
├── store/
│   ├── index.js          # 组装模块并导出 store
│   ├── modules/          # 模块文件夹
│   │   ├── user.js       # 用户模块
│   │   ├── cart.js       # 购物车模块
│   │   └── products.js   # 商品模块
│   └── types.js          # mutation 类型常量（可选）
```

### 注意事项

1. **Vuex 4.x** 用于 Vue 3，**Vuex 3.x** 用于 Vue 2
2. **mutations 必须同步**，actions 可以异步
3. 大型应用推荐使用**模块化**组织代码
4. Vue 3 更推荐使用 **Pinia**（更简单、更轻量的状态管理方案）

> 💡 **提示**：对于新项目，Vue 官方现在推荐使用 **Pinia** 替代 Vuex，它更简单且支持 Composition API 更好。


## Vuex 注册模块的完整指南

Vuex 通过模块化（Module）来组织代码，避免单个 store 文件过于臃肿。以下是几种注册模块的方式：

### 一、基础模块注册

#### 1. 创建独立模块文件

```javascript
// store/modules/user.js
export default {
  // 启用命名空间（强烈推荐）
  namespaced: true,
  
  state: () => ({
    name: '张三',
    age: 18,
    email: 'zhangsan@example.com'
  }),
  
  getters: {
    // 模块内的 getter
    userInfo: (state) => `${state.name} (${state.age}岁)`,
    isAdult: (state) => state.age >= 18
  },
  
  mutations: {
    SET_NAME(state, name) {
      state.name = name
    },
    SET_AGE(state, age) {
      state.age = age
    }
  },
  
  actions: {
    updateName({ commit }, name) {
      setTimeout(() => {
        commit('SET_NAME', name)
      }, 1000)
    },
    async fetchUser({ commit }) {
      const res = await fetch('/api/user')
      const data = await res.json()
      commit('SET_NAME', data.name)
    }
  }
}
```

#### 2. 在主 store 中注册模块

```javascript
// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import cart from './modules/cart'

export default createStore({
  // 全局 state
  state: {
    appName: 'My App'
  },
  
  // 全局 mutations
  mutations: {
    SET_APP_NAME(state, name) {
      state.appName = name
    }
  },
  
  // 注册模块
  modules: {
    user: user,      // user 模块
    cart: cart,      // cart 模块
    // 或简写
    // user,
    // cart
  }
})
```

### 二、模块的访问方式

#### 1. 在组件中使用模块

```vue
<template>
  <div>
    <!-- 访问模块 state -->
    <p>用户名: {{ $store.state.user.name }}</p>
    <p>年龄: {{ $store.state.user.age }}</p>
    
    <!-- 访问模块 getters -->
    <p>用户信息: {{ $store.getters['user/userInfo'] }}</p>
    <p>是否成年: {{ $store.getters['user/isAdult'] }}</p>
    
    <!-- 提交模块 mutations -->
    <button @click="$store.commit('user/SET_NAME', '李四')">
      修改姓名
    </button>
    
    <!-- 分发模块 actions -->
    <button @click="$store.dispatch('user/updateName', '王五')">
      异步修改
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

// 访问模块 state
const userName = computed(() => store.state.user.name)

// 访问模块 getters
const userInfo = computed(() => store.getters['user/userInfo'])

// 提交模块 mutations
const setName = () => {
  store.commit('user/SET_NAME', '赵六')
}

// 分发模块 actions
const updateNameAsync = () => {
  store.dispatch('user/updateName', '孙七')
}
</script>
```

### 三、使用辅助函数访问模块

#### 1. 基础辅助函数用法

```vue
<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    // 方式一：直接传入模块名
    ...mapState('user', ['name', 'age']),
    ...mapGetters('user', ['userInfo', 'isAdult']),
    
    // 方式二：使用对象形式（可以重命名）
    ...mapState('user', {
      userName: state => state.name,
      userAge: state => state.age
    }),
    
    // 方式三：同时使用全局和模块
    ...mapState({
      appName: state => state.appName,  // 全局
      userName: state => state.user.name // 模块
    })
  },
  
  methods: {
    ...mapMutations('user', ['SET_NAME', 'SET_AGE']),
    ...mapActions('user', ['updateName', 'fetchUser']),
    
    handleClick() {
      this.SET_NAME('小明')
      this.updateName('小红')
    }
  }
}
</script>
```

#### 2. 使用 createNamespacedHelpers

```vue
<script>
import { createNamespacedHelpers } from 'vuex'

const { mapState, mapGetters, mapMutations, mapActions } = createNamespacedHelpers('user')

export default {
  computed: {
    // 不需要再传入模块名
    ...mapState(['name', 'age']),
    ...mapGetters(['userInfo', 'isAdult'])
  },
  
  methods: {
    ...mapMutations(['SET_NAME', 'SET_AGE']),
    ...mapActions(['updateName', 'fetchUser'])
  }
}
</script>
```

### 四、动态注册模块

在应用运行时动态注册模块：

```javascript
// 组件内动态注册
<script setup>
import { useStore } from 'vuex'

const store = useStore()

// 检查模块是否已注册
if (!store.hasModule('dynamicModule')) {
  // 动态注册模块
  store.registerModule('dynamicModule', {
    namespaced: true,
    state: () => ({
      data: null
    }),
    mutations: {
      SET_DATA(state, data) {
        state.data = data
      }
    },
    actions: {
      fetchData({ commit }) {
        // 获取数据逻辑
        commit('SET_DATA', { id: 1 })
      }
    }
  })
}

// 使用动态模块
store.dispatch('dynamicModule/fetchData')

// 卸载模块（可选）
// store.unregisterModule('dynamicModule')
</script>
```

### 五、模块嵌套

模块可以无限嵌套：

```javascript
// store/modules/user/profile.js
export default {
  namespaced: true,
  state: () => ({
    avatar: '',
    bio: ''
  }),
  mutations: {
    SET_AVATAR(state, avatar) {
      state.avatar = avatar
    }
  }
}

// store/modules/user/index.js
import profile from './profile'

export default {
  namespaced: true,
  state: () => ({
    name: '',
    age: 0
  }),
  modules: {
    profile: profile
  }
}

// 主 store
import user from './modules/user'

export default createStore({
  modules: {
    user
  }
})

// 访问嵌套模块的 state
// $store.state.user.profile.avatar
// 提交嵌套模块的 mutation
// $store.commit('user/profile/SET_AVATAR', url)
```

### 六、模块重用

创建可复用的模块工厂函数：

```javascript
// store/modules/list.js
export default function createListModule(namespace) {
  return {
    namespaced: true,
    state: () => ({
      items: [],
      loading: false
    }),
    getters: {
      itemCount: (state) => state.items.length
    },
    mutations: {
      SET_ITEMS(state, items) {
        state.items = items
      },
      SET_LOADING(state, loading) {
        state.loading = loading
      }
    },
    actions: {
      async fetchItems({ commit }) {
        commit('SET_LOADING', true)
        const items = await fetch(`/api/${namespace}`)
        commit('SET_ITEMS', items)
        commit('SET_LOADING', false)
      }
    }
  }
}

// 主 store 中使用
import createListModule from './modules/list'

export default createStore({
  modules: {
    users: createListModule('users'),
    products: createListModule('products'),
    orders: createListModule('orders')
  }
})
```

### 七、模块中的根状态访问

在模块中访问根状态：

```javascript
// store/modules/user.js
export default {
  namespaced: true,
  
  getters: {
    // 使用 rootState 和 rootGetters
    fullInfo: (state, getters, rootState, rootGetters) => {
      return {
        ...state,
        appName: rootState.appName,
        globalConfig: rootGetters['config/settings']
      }
    }
  },
  
  actions: {
    // 使用 context 对象
    checkPermission({ state, commit, rootState }) {
      if (rootState.user.isAdmin) {
        commit('SET_ADMIN', true)
      }
    },
    
    // 在 actions 中调用全局 action
    updateGlobalData({ dispatch }) {
      dispatch('globalAction', null, { root: true })
    }
  },
  
  mutations: {
    // 也可以访问根状态，但不推荐
    SOME_MUTATION(state, payload) {
      // 第三个参数是 rootState
    }
  }
}
```

### 八、完整项目结构示例

```
src/
├── store/
│   ├── index.js              # 主 store，注册所有模块
│   ├── modules/
│   │   ├── user.js           # 用户模块
│   │   ├── cart.js           # 购物车模块
│   │   ├── products.js       # 商品模块
│   │   └── orders.js         # 订单模块
│   └── plugins/
│       └── persistence.js    # 持久化插件
```

```javascript
// store/modules/cart.js
export default {
  namespaced: true,
  state: () => ({
    items: []
  }),
  getters: {
    totalPrice: (state) => {
      return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    itemCount: (state) => state.items.length
  },
  mutations: {
    ADD_ITEM(state, item) {
      const existing = state.items.find(i => i.id === item.id)
      if (existing) {
        existing.quantity++
      } else {
        state.items.push({ ...item, quantity: 1 })
      }
    },
    REMOVE_ITEM(state, itemId) {
      state.items = state.items.filter(item => item.id !== itemId)
    }
  },
  actions: {
    addToCart({ commit }, product) {
      commit('ADD_ITEM', product)
    }
  }
}
```

```javascript
// store/index.js
import { createStore } from 'vuex'
import user from './modules/user'
import cart from './modules/cart'
import products from './modules/products'

export default createStore({
  state: {
    version: '1.0.0'
  },
  
  modules: {
    user,
    cart,
    products
  },
  
  strict: process.env.NODE_ENV !== 'production' // 开发环境启用严格模式
})
```

### 关键要点

1. **必须启用 `namespaced: true`**：避免不同模块的 mutation/action 命名冲突
2. **模块内部使用函数声明 state**：`state: () => ({})` 避免模块重复时的引用问题
3. **动态注册**：大型应用可以按需动态注册模块
4. **模块通信**：跨模块通信使用根 dispatch/commit 或通过 rootState/rootGetters

这样组织可以让 Vuex 代码更清晰、可维护性更强！


## Vuex 异步方法与调用其他 Actions 的完整指南

### 一、Vuex 中定义异步方法（Actions）

**重要概念**：Vuex 中 `mutations` 必须是同步的，`actions` 可以包含异步操作。

```javascript
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null,
    posts: [],
    loading: false
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    SET_POSTS(state, posts) {
      state.posts = posts
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  
  actions: {
    // 1. 基础异步操作
    async fetchUser({ commit }, userId) {
      try {
        commit('SET_LOADING', true)
        const response = await fetch(`/api/users/${userId}`)
        const user = await response.json()
        commit('SET_USER', user)
      } catch (error) {
        console.error('获取用户失败:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    // 2. 使用 Promise 写法
    fetchPosts({ commit }) {
      commit('SET_LOADING', true)
      return new Promise((resolve, reject) => {
        fetch('/api/posts')
          .then(res => res.json())
          .then(posts => {
            commit('SET_POSTS', posts)
            commit('SET_LOADING', false)
            resolve(posts)
          })
          .catch(error => {
            commit('SET_LOADING', false)
            reject(error)
          })
      })
    },
    
    // 3. 带延迟的异步操作
    async delayedUpdate({ commit }, payload) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      commit('SET_USER', payload)
      return payload
    }
  }
})
```

### 二、在组件中调用异步 Actions

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <p>{{ user?.name }}</p>
      <button @click="handleFetchUser">获取用户</button>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import { ref } from 'vue'

const store = useStore()
const loading = ref(false)

// 方式1：使用 dispatch
const handleFetchUser = async () => {
  try {
    await store.dispatch('fetchUser', 123)
    console.log('用户获取成功')
  } catch (error) {
    console.error('获取失败', error)
  }
}

// 方式2：使用辅助函数
import { mapActions } from 'vuex'

// 方式3：获取返回值
const handleFetchPosts = async () => {
  const posts = await store.dispatch('fetchPosts')
  console.log('获取到的帖子:', posts)
}

// 方式4：多个异步操作并行
const handleMultipleActions = async () => {
  const [user, posts] = await Promise.all([
    store.dispatch('fetchUser', 123),
    store.dispatch('fetchPosts')
  ])
  console.log('用户和帖子都加载完成')
}
</script>
```

### 三、Action 调用其他 Actions

#### 1. 在同一个模块内调用其他 Actions

```javascript
// store/index.js
export default createStore({
  state: {
    user: null,
    posts: [],
    comments: []
  },
  
  mutations: { /* ... */ },
  
  actions: {
    // 基础 action
    async fetchUser({ commit }, userId) {
      const res = await fetch(`/api/users/${userId}`)
      const user = await res.json()
      commit('SET_USER', user)
      return user
    },
    
    // 调用其他 action - 方式1：直接调用
    async fetchUserWithPosts({ dispatch, commit }, userId) {
      // 先获取用户
      const user = await dispatch('fetchUser', userId)
      
      // 再获取用户的帖子
      const posts = await dispatch('fetchPostsByUser', user.id)
      
      return { user, posts }
    },
    
    // 方式2：顺序调用
    async fetchAllUserData({ dispatch }) {
      await dispatch('fetchUser', 123)
      await dispatch('fetchUserPosts')
      await dispatch('fetchUserComments')
      console.log('所有数据加载完成')
    },
    
    // 方式3：并行调用
    async fetchParallelData({ dispatch }) {
      const results = await Promise.all([
        dispatch('fetchUser', 123),
        dispatch('fetchPosts'),
        dispatch('fetchComments')
      ])
      
      return {
        user: results[0],
        posts: results[1],
        comments: results[2]
      }
    },
    
    // 方式4：条件调用
    async fetchConditionalData({ dispatch, state }, userId) {
      await dispatch('fetchUser', userId)
      
      // 根据用户状态决定是否获取额外数据
      if (state.user.isAdmin) {
        await dispatch('fetchAdminData')
      }
      
      if (state.user.hasPosts) {
        await dispatch('fetchUserPosts')
      }
    },
    
    // 辅助 action
    async fetchPostsByUser({ commit }, userId) {
      const res = await fetch(`/api/users/${userId}/posts`)
      const posts = await res.json()
      commit('SET_POSTS', posts)
      return posts
    },
    
    fetchUserPosts({ dispatch }) {
      // 从 state 中获取当前用户 ID
      return dispatch('fetchPostsByUser', this.state.user.id)
    },
    
    fetchComments({ commit }) {
      return fetch('/api/comments')
        .then(res => res.json())
        .then(comments => commit('SET_COMMENTS', comments))
    }
  }
})
```

#### 2. 跨模块调用 Actions（命名空间模块）

```javascript
// store/modules/user.js
export default {
  namespaced: true,
  
  state: {
    info: null
  },
  
  mutations: {
    SET_INFO(state, info) {
      state.info = info
    }
  },
  
  actions: {
    async fetchUser({ commit }, id) {
      const res = await fetch(`/api/users/${id}`)
      const user = await res.json()
      commit('SET_INFO', user)
      return user
    },
    
    // 调用其他模块的 action
    async fetchUserWithOrders({ dispatch, commit }, userId) {
      // 调用本模块的 action
      const user = await dispatch('fetchUser', userId)
      
      // 调用 orders 模块的 action（跨模块）
      const orders = await dispatch('orders/fetchUserOrders', userId, { root: true })
      
      // 调用 cart 模块的 action
      await dispatch('cart/clearCart', null, { root: true })
      
      return { user, orders }
    },
    
    // 调用全局 action
    triggerGlobalAction({ dispatch }) {
      dispatch('globalLoading/showLoading', null, { root: true })
    }
  }
}

// store/modules/orders.js
export default {
  namespaced: true,
  
  actions: {
    async fetchUserOrders({ commit }, userId) {
      const res = await fetch(`/api/users/${userId}/orders`)
      const orders = await res.json()
      return orders
    }
  }
}

// store/index.js
import user from './modules/user'
import orders from './modules/orders'

export default createStore({
  modules: {
    user,
    orders
  }
})
```

### 四、复杂的异步流程控制

```javascript
// store/index.js
export default createStore({
  state: {
    uploadProgress: 0,
    uploadStatus: 'idle' // idle, uploading, success, error
  },
  
  mutations: {
    SET_UPLOAD_PROGRESS(state, progress) {
      state.uploadProgress = progress
    },
    SET_UPLOAD_STATUS(state, status) {
      state.uploadStatus = status
    }
  },
  
  actions: {
    // 1. 带进度报告的上传
    async uploadFile({ commit, dispatch }, file) {
      commit('SET_UPLOAD_STATUS', 'uploading')
      commit('SET_UPLOAD_PROGRESS', 0)
      
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            commit('SET_UPLOAD_PROGRESS', progress)
          }
        })
        
        const result = await response.json()
        commit('SET_UPLOAD_STATUS', 'success')
        
        // 上传成功后调用其他 action
        await dispatch('processUploadedFile', result.fileId)
        
        return result
      } catch (error) {
        commit('SET_UPLOAD_STATUS', 'error')
        throw error
      }
    },
    
    // 2. 重试机制
    async fetchWithRetry({ dispatch }, { action, payload, maxRetries = 3 }) {
      let lastError
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const result = await dispatch(action, payload)
          return result
        } catch (error) {
          lastError = error
          console.log(`第 ${i + 1} 次重试`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        }
      }
      
      throw lastError
    },
    
    // 3. 轮询请求
    startPolling({ dispatch, commit }, { action, interval = 3000 }) {
      let isRunning = true
      
      const poll = async () => {
        while (isRunning) {
          await dispatch(action)
          await new Promise(resolve => setTimeout(resolve, interval))
        }
      }
      
      poll()
      
      // 返回停止函数
      return () => {
        isRunning = false
      }
    },
    
    // 4. 组合多个异步操作（依赖关系）
    async initializeApp({ dispatch }) {
      // 并行获取基础数据
      const [config, user] = await Promise.all([
        dispatch('fetchConfig'),
        dispatch('fetchCurrentUser')
      ])
      
      // 根据配置和用户信息获取后续数据
      if (user.isLoggedIn) {
        await Promise.all([
          dispatch('fetchUserPosts'),
          dispatch('fetchNotifications'),
          dispatch('cart/fetchCart', null, { root: true })
        ])
      }
      
      if (config.features.enableAnalytics) {
        await dispatch('analytics/init', null, { root: true })
      }
      
      return '应用初始化完成'
    },
    
    // 5. 使用 action 组合实现缓存
    async fetchWithCache({ dispatch, state }, { key, action, ttl = 60000 }) {
      const cache = state.cache || {}
      const now = Date.now()
      
      if (cache[key] && (now - cache[key].timestamp) < ttl) {
        return cache[key].data
      }
      
      const data = await dispatch(action)
      
      // 更新缓存
      dispatch('updateCache', { key, data, timestamp: now }, { root: true })
      
      return data
    }
  }
})
```

### 五、在组件中优雅地处理异步操作

```vue
<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="loading" class="loader">加载中...</div>
    
    <!-- 错误处理 -->
    <div v-if="error" class="error">
      错误: {{ error.message }}
      <button @click="retry">重试</button>
    </div>
    
    <!-- 数据展示 -->
    <div v-else-if="data">
      {{ data }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const loading = ref(false)
const error = ref(null)
const data = ref(null)

// 封装 action 调用
const callAction = async (action, payload) => {
  loading.value = true
  error.value = null
  
  try {
    const result = await store.dispatch(action, payload)
    data.value = result
    return result
  } catch (err) {
    error.value = err
    throw err
  } finally {
    loading.value = false
  }
}

// 使用
const fetchData = () => {
  callAction('fetchUser', 123)
}

const retry = () => {
  fetchData()
}

// 自动加载
fetchData()

// 监听 action 完成
store.subscribeAction({
  before: (action) => {
    console.log(`开始执行: ${action.type}`)
  },
  after: (action, state) => {
    console.log(`完成执行: ${action.type}`)
    if (action.type === 'fetchUser') {
      console.log('用户数据已更新')
    }
  }
})
</script>
```

### 六、最佳实践总结

1. **Actions 总是返回 Promise**：便于组件中等待和链式调用
2. **错误处理**：在 action 内部捕获错误并适当处理
3. **加载状态**：使用专门的 mutation 管理 loading 状态
4. **跨模块调用**：使用 `{ root: true }` 参数
5. **避免深层嵌套**：将复杂逻辑拆分为多个小的 action
6. **使用常量**：定义 action 类型常量避免拼写错误

```javascript
// action-types.js
export const FETCH_USER = 'fetchUser'
export const FETCH_POSTS = 'fetchPosts'

// store/index.js
import * as types from './action-types'

actions: {
  [types.FETCH_USER]: async ({ commit }, id) => {
    // ...
  }
}
```

这样组织代码可以让异步流程更清晰、可维护性更强！