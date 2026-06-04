## Pinia 使用教程

Pinia 是 Vue 的官方状态管理库，可以看作是 Vuex 的替代品，API 更简洁，TypeScript 支持更好。


### 一、安装与配置

#### 1. 安装 Pinia

```bash
npm install pinia
# 或
yarn add pinia
```

#### 2. 创建 Pinia 实例并挂载到 Vue 应用

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```


### 二、定义 Store

Pinia 提供两种定义 Store 的方式：**Options Store** 和 **Setup Store**。

#### 方式一：Options Store（类似 Vuex 语法）

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0,
    name: 'Pinia'
  }),
  
  // 计算属性（相当于 Vuex 的 getters）
  getters: {
    doubleCount: (state) => state.count * 2,
    // 使用 this 访问其他 getter
    message: (state) => `${state.name}: ${state.count}`
  },
  
  // 操作方法（相当于 Vuex 的 actions，mutations 已被合并）
  actions: {
    increment() {
      this.count++
    },
    incrementBy(amount) {
      this.count += amount
    },
    async fetchCount() {
      const res = await fetch('/api/count')
      this.count = await res.json()
    }
  }
})
```

#### 方式二：Setup Store（推荐，Composition API 风格）

```javascript
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // state → ref
  const count = ref(0)
  const name = ref('Pinia')
  
  // getters → computed
  const doubleCount = computed(() => count.value * 2)
  const message = computed(() => `${name.value}: ${count.value}`)
  
  // actions → function
  function increment() {
    count.value++
  }
  
  function incrementBy(amount) {
    count.value += amount
  }
  
  return { count, name, doubleCount, message, increment, incrementBy }
})
```


### 三、在组件中使用 Store

#### 基本使用

```vue
<template>
  <div>
    <!-- 直接使用 store 实例的属性 -->
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.doubleCount }}</p>
    <button @click="counter.increment">+1</button>
    <button @click="counter.incrementBy(5)">+5</button>
  </div>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

// 调用 useStore 函数获取 store 实例
const counter = useCounterStore()

// 可以直接修改 state（Pinia 允许直接赋值）
counter.count = 10
</script>
```

#### 保持响应式解构（storeToRefs）

直接解构 store 会失去响应式，需要使用 `storeToRefs`：

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// ✅ 使用 storeToRefs 保持响应式
const { count, doubleCount } = storeToRefs(counter)

// ❌ 错误：直接解构会失去响应式
// const { count, doubleCount } = counter

// actions 可以直接解构，它们本身就是函数
const { increment } = counter
</script>
```


### 四、批量更新（$patch）

```javascript
const counter = useCounterStore()

// 批量更新多个 state
counter.$patch({
  count: counter.count + 1,
  name: 'New Name'
})

// 或使用函数形式（适合复杂逻辑）
counter.$patch((state) => {
  state.count++
  state.name = 'New Name'
})
```


### 五、重置状态（$reset）

```javascript
const counter = useCounterStore()

// 将 store 重置为初始状态
counter.$reset()
```


### 六、在另一个 Store 中访问 Store（Store 嵌套）

```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const name = ref('张三')
  return { name }
})

// stores/order.js
import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useOrderStore = defineStore('order', () => {
  const userStore = useUserStore()  // 访问其他 store
  
  const greeting = computed(() => `Hello ${userStore.name}`)
  
  return { greeting }
})
```


### 七、状态持久化

Pinia 本身不提供持久化功能，需要配合插件使用：

```bash
npm install pinia-plugin-persistedstate
```

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  persist: true  // 开启持久化
  // 或配置详细选项
  // persist: {
  //   key: 'counter-store',
  //   storage: localStorage, // 默认 sessionStorage
  //   paths: ['count']       // 只持久化指定字段
  // }
})
```


### 八、Options API 中使用（辅助函数）

如果你还在使用 Options API，Pinia 也提供了辅助函数：

```vue
<script>
import { mapState, mapActions } from 'pinia'
import { useCounterStore } from '@/stores/counter'

export default {
  computed: {
    // 映射 state 和 getters
    ...mapState(useCounterStore, ['count', 'doubleCount'])
  },
  methods: {
    // 映射 actions
    ...mapActions(useCounterStore, ['increment'])
  }
}
</script>
```


### 九、完整示例：Todo 管理

```javascript
// stores/todo.js
import { defineStore } from 'pinia'

export const useTodoStore = defineStore('todo', {
  state: () => ({
    todos: [],
    nextId: 1,
    filter: 'all'  // 'all' | 'completed' | 'uncompleted'
  }),
  
  getters: {
    completedTodos: (state) => state.todos.filter(t => t.completed),
    uncompletedTodos: (state) => state.todos.filter(t => !t.completed),
    filteredTodos(state) {
      if (state.filter === 'completed') return this.completedTodos
      if (state.filter === 'uncompleted') return this.uncompletedTodos
      return state.todos
    }
  },
  
  actions: {
    addTodo(text) {
      this.todos.push({
        id: this.nextId++,
        text,
        completed: false
      })
    },
    toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) todo.completed = !todo.completed
    },
    removeTodo(id) {
      this.todos = this.todos.filter(t => t.id !== id)
    },
    setFilter(filter) {
      this.filter = filter
    }
  }
})
```

组件中使用：

```vue
<template>
  <div>
    <input v-model="newTodo" @keyup.enter="addTodo" placeholder="添加待办" />
    
    <div class="filters">
      <button @click="todoStore.setFilter('all')">全部</button>
      <button @click="todoStore.setFilter('completed')">已完成</button>
      <button @click="todoStore.setFilter('uncompleted')">未完成</button>
    </div>
    
    <ul>
      <li v-for="todo in todoStore.filteredTodos" :key="todo.id">
        <input type="checkbox" v-model="todo.completed" />
        <span :class="{ done: todo.completed }">{{ todo.text }}</span>
        <button @click="todoStore.removeTodo(todo.id)">删除</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()
const newTodo = ref('')

const addTodo = () => {
  if (newTodo.value.trim()) {
    todoStore.addTodo(newTodo.value)
    newTodo.value = ''
  }
}
</script>
```


### Pinia vs Vuex 主要区别

| 特性 | Pinia | Vuex |
|------|-------|------|
| mutations | ❌ 已移除 | ✅ 存在 |
| 模块化 | 扁平化，每个 store 独立 | 嵌套 modules |
| TypeScript | 原生支持，类型推导优秀 | 需要额外配置 |
| 体积 | 更轻量（~1KB） | 较大 |
| 代码量 | 更简洁 | 更冗长 |

> **注意**：Pinia 适用于 Vue 3，官方现已推荐 Pinia 作为默认状态管理方案，取代 Vuex。