## 🎯 Vue 3 组件系统完全指南

Vue 3 的组件系统是整个框架的核心，下面从**组件定义**、**组件通信**、**生命周期**、**动态组件**、**异步组件**到**高级特性**，全面介绍组件的使用方法。

---

## 📦 一、组件的定义方式

### 1.1 **单文件组件 (SFC - Single File Component)** - 最常用
```vue
<!-- Button.vue -->
<template>
  <button 
    class="btn" 
    :class="[`btn-${type}`, { 'btn-large': large }]"
    @click="handleClick"
  >
    <slot name="icon"></slot>
    <span><slot>默认按钮</slot></span>
  </button>
</template>

<script setup>
// 使用 defineProps 声明接收的属性
const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'danger'].includes(value)
  },
  large: Boolean,
  disabled: Boolean
})

// 使用 defineEmits 声明事件
const emit = defineEmits(['click', 'custom-event'])

const handleClick = (event) => {
  if (props.disabled) return
  emit('click', event)
  emit('custom-event', { timestamp: Date.now() })
}

// 使用 defineExpose 暴露属性和方法给父组件
defineExpose({
  focus: () => {
    console.log('按钮获得焦点')
  }
})
</script>

<style scoped>
.btn { /* 样式作用域仅限于当前组件 */ }
.btn-primary { background: blue; }
</style>
```

### 1.2 **普通 JavaScript 对象组件**
```javascript
// options.js
export default {
  name: 'OptionsComponent',
  props: ['title', 'content'],
  data() {
    return {
      count: 0
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  mounted() {
    console.log('组件已挂载')
  }
}
```

### 1.3 **函数式组件 (Functional Component)**
```javascript
// 使用普通函数定义纯展示组件
import { h } from 'vue'

const FunctionalButton = (props, { slots, emit, attrs }) => {
  return h('button', {
    class: ['btn', props.type],
    onClick: () => emit('click')
  }, slots.default ? slots.default() : '按钮')
}

FunctionalButton.props = ['type']
FunctionalButton.emits = ['click']
```

### 1.4 **使用 defineComponent 获得类型推导**
```typescript
import { defineComponent, PropType } from 'vue'

interface User {
  name: string
  age: number
}

export default defineComponent({
  name: 'UserCard',
  props: {
    user: {
      type: Object as PropType<User>,
      required: true
    }
  },
  setup(props) {
    // props.user 有完整的类型提示
    return () => (
      <div>
        <h3>{props.user.name}</h3>
        <p>{props.user.age}岁</p>
      </div>
    )
  }
})
```

---

## 🔄 二、组件的注册方式

### 2.1 **全局注册**
```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import Button from './components/Button.vue'
import Input from './components/Input.vue'

const app = createApp(App)

// 单个注册
app.component('BaseButton', Button)

// 批量注册
import * as components from './components'
Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})

app.mount('#app')
```

### 2.2 **局部注册**
```vue
<script setup>
// 直接导入即可使用（自动局部注册）
import Button from './Button.vue'
import Card from './Card.vue'

// 也可以注册别名
import BaseButton from './Button.vue'
import BaseCard from './Card.vue'
</script>

<template>
  <BaseButton>按钮</BaseButton>
  <BaseCard>
    <template #header>标题</template>
    内容
  </BaseCard>
</template>
```

---

## 📞 三、组件通信方式（8种）

### 3.1 **Props - 父传子**
```vue
<!-- 父组件 -->
<template>
  <Child 
    title="标题"                    <!-- 静态传值 -->
    :count="count"                 <!-- 动态传值 -->
    :user="{ name: '张三' }"       <!-- 对象传值 -->
    @update="handleUpdate"         <!-- 监听子组件事件 -->
  />
</template>

<!-- 子组件 -->
<script setup>
// 定义 props
const props = defineProps({
  title: String,
  count: {
    type: Number,
    default: 0
  },
  user: {
    type: Object,
    required: true,
    validator: (value) => value.name
  }
})

// 定义 emits
const emit = defineEmits(['update'])

const updateData = () => {
  emit('update', { id: 1, value: '新数据' })
}
</script>
```

### 3.2 **v-model 双向绑定**
```vue
<!-- 父组件 -->
<template>
  <!-- v-model 语法糖 -->
  <Child v-model="searchText" />
  
  <!-- 多个 v-model 绑定 -->
  <UserForm 
    v-model:name="userName"
    v-model:email="userEmail"
  />
</template>

<!-- 子组件 -->
<script setup>
// 默认 v-model
const model = defineModel()  // Vue 3.4+
// 相当于：
// const props = defineProps(['modelValue'])
// const emit = defineEmits(['update:modelValue'])

// 多个 v-model
const name = defineModel('name')
const email = defineModel('email')

// 带选项的 v-model
const count = defineModel('count', {
  type: Number,
  default: 0,
  local: true  // 本地改变不触发更新事件
})
</script>

<template>
  <input v-model="model" />
  <input :value="name" @input="name = $event.target.value" />
</template>
```

### 3.3 **$emit / 事件 - 子传父**
```vue
<!-- 子组件 -->
<script setup>
const emit = defineEmits(['search', 'reset'])

// 带参数的事件
const handleSearch = (keyword) => {
  emit('search', keyword, { page: 1 })
}

// 无参数事件
const handleReset = () => {
  emit('reset')
}

// 返回 Promise 的事件
const handleAsync = async () => {
  return await new Promise(resolve => {
    setTimeout(() => {
      emit('async-event', '完成')
      resolve('success')
    }, 1000)
  })
}
</script>
```

### 3.4 **$parent / $root / ref - 直接访问**
```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue'
import Child from './Child.vue'

// 通过 ref 访问子组件
const childRef = ref(null)

const callChildMethod = () => {
  childRef.value.someMethod()
  console.log(childRef.value.someData)
}

// 通过 expose 控制暴露的内容
defineExpose({
  parentMethod: () => console.log('父组件方法')
})
</script>

<template>
  <Child ref="childRef" />
</template>
```

### 3.5 **provide / inject - 跨层级通信**
```vue
<!-- 祖先组件 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')
const user = ref({ name: '张三' })

// 提供响应式数据
provide('theme', theme)
provide('user', user)

// 提供方法
provide('updateTheme', (newTheme) => {
  theme.value = newTheme
})
</script>

<!-- 后代组件 -->
<script setup>
import { inject } from 'vue'

// 注入数据
const theme = inject('theme')
const user = inject('user')
const updateTheme = inject('updateTheme')

// 设置默认值
const config = inject('config', { theme: 'light' })

// 使用 Symbol 作为 key 避免冲突
const TOKEN = Symbol()
provide(TOKEN, 'secret-token')
const token = inject(TOKEN)
</script>
```

### 3.6 **插槽 (Slots) - 内容分发**
```vue
<!-- 子组件 Card.vue -->
<template>
  <div class="card">
    <!-- 具名插槽 -->
    <header v-if="$slots.header">
      <slot name="header">默认标题</slot>
    </header>
    
    <!-- 默认插槽 -->
    <main>
      <slot></slot>
    </main>
    
    <!-- 作用域插槽：向父组件传递数据 -->
    <footer>
      <slot name="footer" :data="footerData" :actions="actions">
        默认底部
      </slot>
    </footer>
  </div>
</template>

<!-- 父组件 -->
<template>
  <Card>
    <!-- 默认插槽 -->
    <p>卡片内容</p>
    
    <!-- 具名插槽 -->
    <template #header>
      <h2>自定义标题</h2>
    </template>
    
    <!-- 作用域插槽 -->
    <template #footer="{ data, actions }">
      <span>共 {{ data.total }} 条</span>
      <button @click="actions.save">保存</button>
    </template>
    
    <!-- 动态插槽名 -->
    <template #[dynamicSlotName]>
      动态内容
    </template>
  </Card>
</template>
```

### 3.7 **mitt / Event Bus - 全局事件总线**
```javascript
// eventBus.js
import mitt from 'mitt'
export const emitter = mitt()

// 组件 A
import { emitter } from './eventBus'
emitter.emit('user-login', { id: 1, name: '张三' })

// 组件 B
import { emitter } from './eventBus'
emitter.on('user-login', (user) => {
  console.log('用户登录:', user)
})

// 清理监听
emitter.off('user-login')
emitter.all.clear() // 清理所有
```

### 3.8 **Pinia / Vuex - 状态管理**
```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    age: null
  }),
  actions: {
    updateUser(user) {
      this.$patch(user)
    }
  }
})

// 任意组件
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
userStore.updateUser({ name: '李四' })
```

---

## 🔄 四、动态组件

### 4.1 **基本用法**
```vue
<template>
  <div>
    <!-- 动态切换组件 -->
    <component 
      :is="currentComponent" 
      :props="componentProps"
      @event="handleEvent"
    />
    
    <!-- 按钮切换 -->
    <button @click="currentComponent = 'ComponentA'">组件A</button>
    <button @click="currentComponent = 'ComponentB'">组件B</button>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

const currentComponent = shallowRef(ComponentA) // 或使用字符串注册名
const componentProps = ref({ title: '动态组件' })
</script>
```

### 4.2 **使用 keep-alive 缓存**
```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['Home', 'About']" :max="10">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

---

## ⏱️ 五、异步组件

### 5.1 **基础用法**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 简单用法
const AsyncComp = defineAsyncComponent(() =>
  import('./components/MyComponent.vue')
)

// 完整配置
const AsyncCompWithOptions = defineAsyncComponent({
  // 加载函数
  loader: () => import('./components/MyComponent.vue'),
  
  // 加载中显示的组件
  loadingComponent: LoadingComponent,
  
  // 加载失败显示的组件
  errorComponent: ErrorComponent,
  
  // 延迟显示 loading 的时间（默认 200ms）
  delay: 200,
  
  // 超时时间，默认 Infinity
  timeout: 3000,
  
  // 是否可重试
  suspensible: false,
  
  /**
   * @param {Error} error 错误信息
   * @param {number} retry 重试次数
   * @param {Function} fail 失败
   * @param {number} attempts 允许重试的最大次数
   */
  onError(error, retry, fail, attempts) {
    if (error.message.match(/fetch/) && attempts <= 3) {
      // 如果是网络错误，重试最多 3 次
      retry()
    } else {
      // 其他错误直接失败
      fail()
    }
  }
})
</script>

<template>
  <Suspense>
    <template #default>
      <AsyncComp />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>
```

### 5.2 **结合路由使用**
```javascript
// router/index.js
const routes = [
  {
    path: '/user/:id',
    component: () => import('@/views/User.vue'),
    // 路由级别的异步组件
    beforeEnter: (to, from, next) => {
      // 预加载组件
      const component = import('@/views/User.vue')
      next()
    }
  }
]
```

---

## 🎨 六、高阶组件 (HOC) 与组合式函数

### 6.1 **HOC 模式**
```vue
<!-- withLoading.js - HOC 工厂函数 -->
import { defineComponent, h, ref } from 'vue'

export function withLoading(WrappedComponent) {
  return defineComponent({
    name: 'WithLoading',
    props: WrappedComponent.props,
    setup(props, { slots, attrs, emit }) {
      const loading = ref(false)
      
      const wrappedProps = {
        ...props,
        loading: loading.value,
        onStart: () => loading.value = true,
        onFinish: () => loading.value = false
      }
      
      return () => h(WrappedComponent, wrappedProps, slots)
    }
  })
}

// 使用
const UserListWithLoading = withLoading(UserList)
```

### 6.2 **组合式函数 (Composables)**
```javascript
// composables/useFetch.js
import { ref, onMounted } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(true)

  const fetchData = async () => {
    try {
      loading.value = true
      const response = await fetch(url)
      data.value = await response.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchData)

  return { data, error, loading, refresh: fetchData }
}

// 在组件中使用
<script setup>
import { useFetch } from './composables/useFetch'

const { data, loading, error, refresh } = useFetch('/api/users')
</script>
```

---

## 🔗 七、递归组件

```vue
<!-- Tree.vue -->
<template>
  <div class="tree-node">
    <div class="node-content" @click="toggle">
      <span>{{ node.label }}</span>
      <span v-if="node.children">[{{ expanded ? '-' : '+' }}]</span>
    </div>
    
    <div v-if="expanded && node.children" class="children">
      <Tree
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 组件递归调用自身，需要指定 name
defineOptions({
  name: 'Tree'
})

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const expanded = ref(false)
const toggle = () => {
  if (props.node.children) {
    expanded.value = !expanded.value
  }
}
</script>
```

---

## 🎯 八、Teleport - 传送门

```vue
<!-- Modal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header">默认标题</slot>
          </div>
          
          <div class="modal-body">
            <slot>默认内容</slot>
          </div>
          
          <div class="modal-footer">
            <slot name="footer">
              <button @click="$emit('close')">关闭</button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps(['show'])
defineEmits(['close'])
</script>
```

---

## ⚡ 九、性能优化技巧

### 9.1 **v-once / v-memo**
```vue
<template>
  <!-- v-once: 只渲染一次，不会更新 -->
  <div v-once>
    <h1>静态标题</h1>
    <p>静态内容</p>
  </div>
  
  <!-- v-memo: 条件性缓存 -->
  <div v-memo="[item.id, selectedId]">
    <p>{{ item.name }}</p>
    <p>{{ item.desc }}</p>
    <span :class="{ active: item.id === selectedId }">⭐</span>
  </div>
</template>
```

### 9.2 **shallowRef / shallowReactive**
```javascript
import { shallowRef } from 'vue'

// 只追踪 value 的变化，不追踪深层对象
const state = shallowRef({
  user: { name: '张三' }
})

// 这样不会触发更新
state.value.user.name = '李四'

// 这样才会触发更新
state.value = { user: { name: '李四' } }
```

---

## 🚨 十、错误处理

```vue
<script setup>
import { onErrorCaptured } from 'vue'

// 捕获子组件错误
onErrorCaptured((error, instance, info) => {
  console.log('捕获到错误:', error)
  console.log('错误组件:', instance)
  console.log('错误信息:', info)
  
  // 返回 false 阻止错误继续传播
  return false
})

// 错误边界组件
defineOptions({
  errorCaptured(err, vm, info) {
    console.log('错误边界:', err)
    return false
  }
})
</script>
```

---

## 📚 总结

Vue 3 的组件系统提供了**全方位**的解决方案：

| 功能 | 主要方案 | 适用场景 |
|:---|:---|:---|
| 组件定义 | SFC, 对象组件, 函数式 | 根据需求选择 |
| 组件注册 | 全局注册, 局部注册 | 通用组件全局，业务组件局部 |
| 组件通信 | 8种方式灵活选择 | 根据数据流向选择 |
| 动态组件 | component + is | 选项卡、多状态切换 |
| 异步组件 | defineAsyncComponent | 优化首屏加载 |
| 逻辑复用 | Composables | 抽离复用逻辑 |
| 性能优化 | v-memo, shallowRef | 大型列表、复杂对象 |
| 错误处理 | errorCaptured | 生产环境稳定性 |

Vue 3 的组件设计既保留了 Vue 2 的易用性，又引入了更多灵活强大的特性，能够满足从简单到复杂的各种应用场景。


## 🎯 Vue 3 内置 `<component>` 组件完全指南

`<component>` 是 Vue 内置的一个**动态组件**，用于根据 `is` 属性的值动态渲染不同的组件。它是实现组件动态切换的核心工具。

---

## 📦 一、基础用法

### 1.1 **基本语法**
```vue
<template>
  <component :is="currentComponent" />
</template>

<script setup>
import { ref } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

const currentComponent = ref(ComponentA)

// 也可以使用字符串（需要注册组件）
const currentComponentName = ref('component-a')
</script>
```

### 1.2 **`is` 属性的三种形式**

| 形式 | 示例 | 说明 |
|:---|:---|:---|
| **组件对象** | `:is="ComponentA"` | 直接传入导入的组件对象（推荐） |
| **组件名** | `:is="'component-a'"` | 传入注册的组件名（需全局/局部注册） |
| **HTML 标签名** | `:is="'div'"` | 直接渲染原生 HTML 元素 |

```vue
<template>
  <!-- 1. 组件对象（推荐） -->
  <component :is="MyButton" />
  
  <!-- 2. 注册的组件名 -->
  <component :is="'base-button'" />
  
  <!-- 3. 原生 HTML 元素 -->
  <component :is="'div'" class="wrapper">
    <p>作为原生 div 渲染</p>
  </component>
  
  <!-- 4. 动态计算 -->
  <component :is="someCondition ? ComponentA : ComponentB" />
</template>

<script setup>
import MyButton from './MyButton.vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

// 需要全局注册才能使用字符串形式
// app.component('base-button', MyButton)
</script>
```

---

## 🔄 二、传递 Props 和事件

### 2.1 **基础传参**
```vue
<template>
  <component
    :is="currentComponent"
    :title="title"
    :count="count"
    :user="user"
    @click="handleClick"
    @update="handleUpdate"
  />
</template>

<script setup>
import { ref } from 'vue'
import UserCard from './UserCard.vue'
import ProductCard from './ProductCard.vue'

const currentComponent = ref(UserCard)
const title = ref('标题')
const count = ref(0)
const user = ref({ name: '张三' })

const handleClick = () => {
  console.log('点击事件')
}

const handleUpdate = (value) => {
  console.log('更新:', value)
}
</script>
```

### 2.2 **动态 Props 传递**
```vue
<template>
  <!-- 根据当前组件动态计算 props -->
  <component
    :is="currentComponent"
    v-bind="componentProps"
    @event="handleEvent"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['type', 'data'])

// 根据不同组件返回不同的 props
const componentProps = computed(() => {
  switch (currentComponent.value) {
    case 'UserCard':
      return { user: props.data, showAvatar: true }
    case 'ProductCard':
      return { product: props.data, showPrice: true }
    default:
      return {}
  }
})
</script>
```

### 2.3 **使用 v-model**
```vue
<template>
  <!-- 支持 v-model -->
  <component
    :is="currentComponent"
    v-model="searchText"
    v-model:visible="dialogVisible"
  />
</template>

<script setup>
const searchText = ref('')
const dialogVisible = ref(false)
</script>
```

---

## 🎨 三、高级用法

### 3.1 **配合 KeepAlive 缓存**
```vue
<template>
  <KeepAlive :include="['ComponentA', 'ComponentB']" :max="10">
    <component :is="currentComponent" />
  </KeepAlive>
</template>

<script setup>
import { KeepAlive } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

const currentComponent = ref(ComponentA)
</script>
```

### 3.2 **配合 Transition 动画**
```vue
<template>
  <Transition name="fade" mode="out-in">
    <component :is="currentComponent" :key="currentComponent" />
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 3.3 **动态标签名渲染**
```vue
<template>
  <!-- 根据条件渲染不同级别的标题 -->
  <component
    :is="`h${level}`"
    :class="['title', `title-${level}`]"
  >
    {{ content }}
  </component>
  
  <!-- 动态表单字段 -->
  <component
    :is="`el-${field.type}`"
    v-model="field.value"
    :placeholder="field.placeholder"
    :options="field.options"
  />
</template>

<script setup>
const props = defineProps({
  level: {
    type: Number,
    default: 1,
    validator: (v) => [1, 2, 3, 4, 5, 6].includes(v)
  },
  content: String
})

const field = ref({
  type: 'input', // 动态决定使用 el-input, el-select, el-radio 等
  value: '',
  placeholder: '请输入'
})
</script>
```

---

## 🎯 四、实际应用场景

### 4.1 **选项卡/标签页**
```vue
<template>
  <div class="tabs">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        @click="activeTab = tab.component"
        :class="{ active: activeTab === tab.component }"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="tab-content">
      <KeepAlive>
        <component :is="activeTab" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ProfileTab from './ProfileTab.vue'
import SettingsTab from './SettingsTab.vue'
import NotificationsTab from './NotificationsTab.vue'

const tabs = [
  { label: '个人资料', component: ProfileTab },
  { label: '设置', component: SettingsTab },
  { label: '通知', component: NotificationsTab }
]

const activeTab = ref(ProfileTab)
</script>
```

### 4.2 **动态表单生成器**
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div v-for="field in schema" :key="field.name" class="form-field">
      <label>{{ field.label }}</label>
      
      <!-- 根据字段类型动态渲染组件 -->
      <component
        :is="getFieldComponent(field.type)"
        v-model="formData[field.name]"
        v-bind="field.props"
        @change="handleFieldChange(field.name, $event)"
      />
      
      <span v-if="errors[field.name]" class="error">
        {{ errors[field.name] }}
      </span>
    </div>
    
    <button type="submit">提交</button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue'
import InputField from './fields/InputField.vue'
import SelectField from './fields/SelectField.vue'
import RadioField from './fields/RadioField.vue'
import CheckboxField from './fields/CheckboxField.vue'
import DateField from './fields/DateField.vue'

const props = defineProps({
  schema: {
    type: Array,
    required: true
  }
})

const formData = reactive({})
const errors = ref({})

// 字段类型映射
const fieldComponents = {
  input: InputField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField
}

const getFieldComponent = (type) => {
  return fieldComponents[type] || InputField
}

const handleFieldChange = (name, value) => {
  // 字段值变化时的处理
  console.log(`字段 ${name} 变为:`, value)
}

const handleSubmit = () => {
  console.log('表单数据:', formData)
}
</script>
```

### 4.3 **可配置的仪表盘**
```vue
<template>
  <div class="dashboard" :style="gridStyle">
    <div
      v-for="(widget, index) in widgets"
      :key="widget.id"
      class="widget"
      :style="getWidgetStyle(widget)"
    >
      <component
        :is="widget.type"
        :config="widget.config"
        :data="widget.data"
        @resize="handleResize(index, $event)"
        @remove="removeWidget(index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ChartWidget from './widgets/ChartWidget.vue'
import TableWidget from './widgets/TableWidget.vue'
import MetricWidget from './widgets/MetricWidget.vue'
import ListWidget from './widgets/ListWidget.vue'

const widgetComponents = {
  chart: ChartWidget,
  table: TableWidget,
  metric: MetricWidget,
  list: ListWidget
}

const widgets = ref([
  { id: 1, type: 'chart', config: { type: 'line' }, data: [], position: { x: 0, y: 0, w: 6, h: 4 } },
  { id: 2, type: 'table', config: { columns: [] }, data: [], position: { x: 6, y: 0, w: 6, h: 4 } },
  { id: 3, type: 'metric', config: { label: '总销售额' }, data: 12345, position: { x: 0, y: 4, w: 4, h: 3 } }
])

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '16px'
}))

const getWidgetStyle = (widget) => ({
  gridColumn: `span ${widget.position.w}`,
  gridRow: `span ${widget.position.h}`
})

const removeWidget = (index) => {
  widgets.value.splice(index, 1)
}
</script>
```

### 4.4 **动态布局系统**
```vue
<template>
  <div class="dynamic-layout">
    <template v-for="(row, rowIndex) in layout" :key="rowIndex">
      <div class="row" :style="{ marginBottom: row.gap + 'px' }">
        <div
          v-for="(col, colIndex) in row.columns"
          :key="colIndex"
          class="col"
          :style="{ width: col.width + '%' }"
        >
          <component
            :is="col.component"
            v-bind="col.props"
            @action="handleAction(rowIndex, colIndex, $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const layout = ref([
  {
    gap: 16,
    columns: [
      { width: 60, component: 'MainContent', props: { title: '主内容' } },
      { width: 40, component: 'Sidebar', props: { showAds: true } }
    ]
  },
  {
    gap: 12,
    columns: [
      { width: 33, component: 'InfoCard', props: { type: 'user' } },
      { width: 33, component: 'InfoCard', props: { type: 'product' } },
      { width: 34, component: 'InfoCard', props: { type: 'order' } }
    ]
  }
])

const handleAction = (rowIndex, colIndex, payload) => {
  console.log(`第 ${rowIndex + 1} 行，第 ${colIndex + 1} 列触发了事件:`, payload)
}
</script>
```

---

## 🚀 五、性能优化

### 5.1 **使用 shallowRef 避免不必要的响应式**
```vue
<script setup>
import { shallowRef } from 'vue'

// 如果组件本身不需要响应式更新，使用 shallowRef
const currentComponent = shallowRef(HeavyComponent)

// 切换时依然有效
const switchComponent = () => {
  currentComponent.value = AnotherComponent
}
</script>
```

### 5.2 **配合 defineAsyncComponent 懒加载**
```vue
<script setup>
import { defineAsyncComponent, shallowRef } from 'vue'

// 懒加载组件
const HeavyComponent = defineAsyncComponent(() => 
  import('./HeavyComponent.vue')
)

const AnotherComponent = defineAsyncComponent(() => 
  import('./AnotherComponent.vue')
)

const currentComponent = shallowRef(HeavyComponent)
</script>
```

### 5.3 **使用 key 强制重新渲染**
```vue
<template>
  <!-- 当组件需要完全重新初始化时，改变 key -->
  <component
    :is="currentComponent"
    :key="componentKey"
    :data="data"
  />
  
  <button @click="resetComponent">重置组件</button>
</template>

<script setup>
import { ref } from 'vue'

const currentComponent = ref(ComponentA)
const componentKey = ref(0)

const resetComponent = () => {
  componentKey.value++ // 改变 key 强制重新渲染
}
</script>
```

---

## ⚠️ 六、注意事项

### 6.1 **`is` 属性的特殊处理**
```vue
<template>
  <!-- 在 DOM 模板中（如直接写在 HTML 文件中），需要加前缀 -->
  <component :is="'vue:ComponentA'"></component>
  
  <!-- 原生元素需要使用 kebab-case -->
  <component :is="'my-component'"></component>
</template>
```

### 6.2 **动态组件的生命周期**
```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

// 当组件被 KeepAlive 缓存时
onActivated(() => {
  console.log('组件被激活')
})

onDeactivated(() => {
  console.log('组件被缓存')
})
</script>
```

### 6.3 **Props 的类型安全（TypeScript）**
```typescript
<script setup lang="ts">
import type { Component } from 'vue'

// 使用泛型约束
interface ComponentProps {
  title: string
  count?: number
}

const currentComponent = shallowRef<Component>(ComponentA)

// 动态 props 的类型推导
const componentProps = computed<ComponentProps>(() => {
  if (currentComponent.value === ComponentA) {
    return { title: 'A', count: 1 }
  }
  return { title: 'B' }
})
</script>
```

---

## 📊 总结

| 特性 | 说明 | 使用场景 |
|:---|:---|:---|
| **动态切换** | 根据条件渲染不同组件 | 选项卡、多状态视图 |
| **传递 Props** | 支持所有 props 和事件 | 组件间数据传递 |
| **配合 KeepAlive** | 缓存组件状态 | 保留表单数据、避免重复渲染 |
| **配合 Transition** | 添加切换动画 | 提升用户体验 |
| **动态标签** | 渲染原生 HTML 元素 | 动态标题、表单字段 |
| **懒加载** | 配合异步组件 | 性能优化、代码分割 |

`<component>` 是 Vue 中实现**动态渲染**的核心工具，结合 KeepAlive、Transition 等内置组件，可以构建出非常灵活和高效的组件系统。