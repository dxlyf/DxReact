## 🎯 Pinia `defineStore` 完全指南

## 一、**基本概念**

Pinia 是 Vue 官方推荐的状态管理库，使用 `defineStore` 定义 store。它有两种定义方式：**选项式 API** 和 **组合式 API**。

## 📝 二、创建 Store 的多种方式

### 1. **选项式 API (类似 Vuex)**
最直观的方式，包含 state、getters、actions。

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // state: 定义数据
  state: () => ({
    count: 0,
    name: 'Counter',
    items: []
  }),
  
  // getters: 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
    
    // 使用 this 访问其他 getter
    doubleCountPlusOne(): number {
      return this.doubleCount + 1
    },
    
    // 返回函数，可以接收参数
    getItemById: (state) => {
      return (id) => state.items.find(item => item.id === id)
    }
  },
  
  // actions: 修改状态的方法（支持同步/异步）
  actions: {
    // 同步方法
    increment() {
      this.count++
    },
    
    // 异步方法
    async fetchItems() {
      try {
        const res = await fetch('/api/items')
        this.items = await res.json()
      } catch (error) {
        console.error('获取失败:', error)
      }
    },
    
    // 多个状态修改
    reset() {
      this.count = 0
      this.items = []
    },
    
    // 调用其他 action
    incrementAndFetch() {
      this.increment()
      this.fetchItems()
    }
  }
})
```

### 2. **组合式 API (类似 Vue Composition API)**
更灵活，可以使用组合式函数。

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // state：使用 ref 或 reactive
  const userInfo = ref(null)
  const token = ref('')
  const permissions = ref([])
  const loginTime = ref(null)
  
  // getters：使用 computed
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.name || '未登录')
  const hasPermission = computed(() => (perm) => permissions.value.includes(perm))
  
  // actions：普通函数
  async function login(credentials) {
    try {
      const res = await api.login(credentials)
      token.value = res.token
      userInfo.value = res.user
      permissions.value = res.permissions
      loginTime.value = Date.now()
      
      // 保存到 localStorage
      localStorage.setItem('token', res.token)
    } catch (error) {
      throw new Error('登录失败')
    }
  }
  
  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    loginTime.value = null
    localStorage.removeItem('token')
  }
  
  // 返回所有需要暴露的状态和方法
  return {
    // state
    userInfo,
    token,
    permissions,
    loginTime,
    
    // getters
    isLoggedIn,
    userName,
    hasPermission,
    
    // actions
    login,
    logout
  }
})
```

### 3. **TypeScript 完整示例**
```typescript
// stores/product.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface Category {
  id: number
  name: string
}

export const useProductStore = defineStore('product', () => {
  // state
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // getters
  const totalProducts = computed(() => products.value.length)
  
  const productsByCategory = computed(() => {
    return (categoryId: number) => 
      products.value.filter(p => p.categoryId === categoryId)
  })
  
  const outOfStockProducts = computed(() => 
    products.value.filter(p => p.stock === 0)
  )
  
  // actions
  async function fetchProducts() {
    loading.value = true
    error.value = null
    
    try {
      const res = await fetch('/api/products')
      products.value = await res.json()
    } catch (e) {
      error.value = '获取产品列表失败'
      console.error(e)
    } finally {
      loading.value = false
    }
  }
  
  async function addProduct(product: Omit<Product, 'id'>) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(product)
      })
      const newProduct = await res.json()
      products.value.push(newProduct)
    } catch (e) {
      error.value = '添加产品失败'
      throw e
    }
  }
  
  function updateStock(productId: number, quantity: number) {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      product.stock += quantity
    }
  }
  
  return {
    // state
    products,
    categories,
    loading,
    error,
    
    // getters
    totalProducts,
    productsByCategory,
    outOfStockProducts,
    
    // actions
    fetchProducts,
    addProduct,
    updateStock
  }
})
```

## 📊 三、在组件中使用 Store

### 1. **基础使用**
```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
import { useUserStore } from '@/stores/user'

// 使用 store
const counterStore = useCounterStore()
const userStore = useUserStore()

// 直接访问 state
console.log(counterStore.count)

// 调用 action
function handleIncrement() {
  counterStore.increment()
}

// 访问 getter
console.log(counterStore.doubleCount)

// 登录示例
async function handleLogin() {
  try {
    await userStore.login({
      username: 'admin',
      password: '123456'
    })
    console.log('登录成功')
  } catch (error) {
    console.log('登录失败')
  }
}
</script>

<template>
  <div>
    <p>Count: {{ counterStore.count }}</p>
    <p>Double: {{ counterStore.doubleCount }}</p>
    <button @click="counterStore.increment()">增加</button>
    <button @click="counterStore.fetchItems()">获取数据</button>
    
    <div v-if="userStore.isLoggedIn">
      欢迎 {{ userStore.userName }}
      <button @click="userStore.logout()">退出</button>
    </div>
  </div>
</template>
```

### 2. **解构使用（保持响应式）**
```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const counterStore = useCounterStore()

// ✅ 保持响应式的解构（只能解构 state 和 getters）
const { count, doubleCount, name } = storeToRefs(counterStore)

// actions 可以直接解构（本身就是函数）
const { increment, fetchItems } = counterStore

function handleClick() {
  increment()
  // count.value 也是响应式的
  console.log(count.value)
}
</script>

<template>
  <div>
    <!-- 使用解构后的变量 -->
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">增加</button>
  </div>
</template>
```

## 🎧 四、监听 Store 变化

### 1. **使用 `$subscribe` 监听 state 变化**
类似 Vue 的 watch，但专门用于 store。

```vue
<script setup>
import { useUserStore } from '@/stores/user'
import { useCounterStore } from '@/stores/counter'

const userStore = useUserStore()
const counterStore = useCounterStore()

// 监听整个 store 的变化
userStore.$subscribe((mutation, state) => {
  // mutation 包含变更信息
  console.log('Mutation type:', mutation.type)  // 'direct' | 'patch object' | 'patch function'
  console.log('Store ID:', mutation.storeId)    // 'user'
  console.log('Payload:', mutation.payload)      // 如果是 patch 方式，这里是传递的数据
  
  // 最新的 state
  console.log('New state:', state)
  
  // 保存到 localStorage
  localStorage.setItem('userState', JSON.stringify(state))
}, {
  detached: false,      // 默认 false，组件卸载时自动取消监听
  deep: true,           // 是否深度监听
  immediate: true,      // 是否立即执行
  flush: 'post'         // 'pre' | 'post' | 'sync'，类似 watch 的 flush
})

// 监听特定字段
import { watch } from 'vue'

watch(() => userStore.userInfo, (newVal, oldVal) => {
  console.log('用户信息变化:', newVal, oldVal)
}, { deep: true })

watch(() => counterStore.count, (newCount, oldCount) => {
  console.log(`计数从 ${oldCount} 变为 ${newCount}`)
})
</script>
```

### 2. **使用 `$onAction` 监听 actions**
监听所有 action 的执行。

```javascript
// 在任何组件或文件中
const unsubscribe = counterStore.$onAction(
  ({
    name,              // action 名称
    store,             // store 实例
    args,              // 传递给 action 的参数数组
    after,             // 钩子：action 成功/resolved 后执行
    onError            // 钩子：action 失败/rejected 后执行
  }) => {
    console.log(`Action "${name}" 被调用，参数:`, args)
    
    // action 成功完成后执行
    after((result) => {
      console.log(`Action "${name}" 完成，结果:`, result)
    })
    
    // action 失败时执行
    onError((error) => {
      console.error(`Action "${name}" 失败:`, error)
    })
  },
  true  // 是否立即监听，默认 false（组件卸载时自动移除）
)

// 手动取消监听
// unsubscribe()
```

### 3. **组合式监听示例**
```vue
<script setup>
import { useProductStore } from '@/stores/product'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { ElMessage } from 'element-plus'

const productStore = useProductStore()
const { products, loading, error } = storeToRefs(productStore)

// 监听加载状态
watch(loading, (isLoading) => {
  if (isLoading) {
    ElMessage.info('加载中...')
  }
})

// 监听错误
watch(error, (errMsg) => {
  if (errMsg) {
    ElMessage.error(errMsg)
  }
})

// 监听库存变化
watch(products, (newProducts, oldProducts) => {
  // 检查哪些产品库存变少了
  newProducts.forEach((product, index) => {
    const oldProduct = oldProducts?.[index]
    if (oldProduct && product.stock < oldProduct.stock) {
      console.warn(`产品 ${product.name} 库存减少！`)
    }
  })
}, { deep: true })

// 使用 $subscribe 持久化
productStore.$subscribe((mutation, state) => {
  // 自动保存到 IndexedDB 或后端
  saveToDatabase(state)
}, { deep: true })
</script>
```

## 🛠️ 五、高级用法

### 1. **Store 之间互相调用**
```javascript
// stores/cart.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'
import { useProductStore } from './product'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  
  actions: {
    async checkout() {
      const userStore = useUserStore()
      const productStore = useProductStore()
      
      if (!userStore.isLoggedIn) {
        throw new Error('请先登录')
      }
      
      // 检查库存
      for (const item of this.items) {
        const product = productStore.products.find(p => p.id === item.id)
        if (!product || product.stock < item.quantity) {
          throw new Error(`${item.name} 库存不足`)
        }
      }
      
      // 创建订单
      const order = {
        userId: userStore.userInfo.id,
        items: this.items,
        total: this.totalPrice
      }
      
      // 清空购物车
      this.items = []
      
      return order
    }
  },
  
  getters: {
    totalPrice: (state) => {
      return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }
  }
})
```

### 2. **Store 插件**
```javascript
// plugins/persist.js
export function persistPlugin({ store }) {
  // 从 localStorage 恢复状态
  const savedState = localStorage.getItem(store.$id)
  if (savedState) {
    store.$patch(JSON.parse(savedState))
  }
  
  // 订阅变化，保存到 localStorage
  store.$subscribe((mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

// main.js
import { createPinia } from 'pinia'
import { persistPlugin } from './plugins/persist'

const pinia = createPinia()
pinia.use(persistPlugin)
```

### 3. **重置 Store**
```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

// 重置到初始状态
function resetStore() {
  counterStore.$reset()
}

// 部分更新
function partialUpdate() {
  counterStore.$patch({
    count: 100,
    name: 'New Name'
  })
}

// 使用函数更新
function functionalUpdate() {
  counterStore.$patch((state) => {
    state.count++
    state.items.push({ id: Date.now() })
  })
}
</script>
```

## 📊 六、方法对比总结

| 方法 | 用途 | 特点 | 适用场景 |
|:---|:---|:---|:---|
| `$subscribe` | 监听 state 变化 | 可深度监听、可配置 | 持久化、调试、同步到后端 |
| `$onAction` | 监听 actions | 可获取参数和结果 | 日志、埋点、权限检查 |
| `watch` | 监听特定字段 | 精细控制 | 响应特定数据变化 |
| `$patch` | 批量更新 | 性能好 | 同时修改多个状态 |
| `$reset` | 重置状态 | 快速恢复 | 退出登录、重置表单 |

## 🎯 最佳实践

1. **使用 `storeToRefs` 保持响应式解构**
2. **在组件卸载时清理不需要的监听**
3. **使用插件系统处理横切关注点**
4. **合理使用 `$subscribe` 实现持久化**
5. **actions 中处理所有异步逻辑**