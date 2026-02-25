`i18n.global.t` 是 vue-i18n 在 Composition API 模式下的全局翻译方法。让我详细介绍它的各种使用方式：

## 📝 基本语法

```javascript
i18n.global.t(key: string, [locale: string], [values: object]): string
```

## 🎯 使用场景与方法

### 1. **基础使用 - 普通翻译**
```javascript
import { i18n } from './i18n'

// 假设 messages 定义如下：
// {
//   'zh-CN': { hello: '你好', world: '世界' },
//   'en-US': { hello: 'Hello', world: 'World' }
// }

// 使用当前语言翻译
console.log(i18n.global.t('hello'))  // 输出: '你好' (当前 locale 是 zh-CN)

// 切换到英文后
i18n.global.locale.value = 'en-US'
console.log(i18n.global.t('hello'))  // 输出: 'Hello'
```

### 2. **指定语言翻译**
```javascript
// 强制使用特定语言，忽略当前 locale 设置
console.log(i18n.global.t('hello', 'en-US'))  // 输出: 'Hello'
console.log(i18n.global.t('hello', 'zh-CN'))  // 输出: '你好'
```

### 3. **带参数的翻译**
```javascript
// 定义 messages
const messages = {
  'zh-CN': {
    welcome: '欢迎 {name}',
    unread: '你有 {count} 条未读消息',
    price: '价格: {value}元',
    date: '今天是 {date}'
  },
  'en-US': {
    welcome: 'Welcome {name}',
    unread: 'You have {count} unread messages',
    price: 'Price: ${value}',
    date: 'Today is {date}'
  }
}

// 使用对象传参
console.log(i18n.global.t('welcome', { name: '张三' }))  // 欢迎 张三
console.log(i18n.global.t('unread', { count: 5 }))       // 你有 5 条未读消息

// 指定语言 + 参数
console.log(i18n.global.t('welcome', 'en-US', { name: 'John' }))  // Welcome John
```

### 4. **复数形式翻译**
```javascript
// 定义 messages（需要设置复数规则）
const messages = {
  'zh-CN': {
    apple: '没有苹果 | 一个苹果 | {count} 个苹果'
  },
  'en-US': {
    apple: 'no apples | one apple | {count} apples'
  }
}

// 使用复数翻译
console.log(i18n.global.t('apple', 0))  // '没有苹果'
console.log(i18n.global.t('apple', 1))  // '一个苹果'
console.log(i18n.global.t('apple', 5))  // '5 个苹果'

// 带参数的复数形式
console.log(i18n.global.t('apple', 5, { count: 5 }))  // '5 个苹果'
```

### 5. **嵌套对象翻译**
```javascript
// 定义嵌套 messages
const messages = {
  'zh-CN': {
    user: {
      profile: {
        title: '个人资料',
        settings: '设置'
      },
      actions: {
        login: '登录',
        logout: '退出'
      }
    }
  },
  'en-US': {
    user: {
      profile: {
        title: 'Profile',
        settings: 'Settings'
      },
      actions: {
        login: 'Login',
        logout: 'Logout'
      }
    }
  }
}

// 使用点语法访问嵌套属性
console.log(i18n.global.t('user.profile.title'))     // '个人资料'
console.log(i18n.global.t('user.actions.login'))     // '登录'

// 指定语言
console.log(i18n.global.t('user.profile.title', 'en-US'))  // 'Profile'
```

### 6. **列表参数**
```javascript
// 定义 messages
const messages = {
  'zh-CN': {
    fruits: '水果: {0}, {1}, {2}',
    ranking: '第 {0} 名'
  },
  'en-US': {
    fruits: 'Fruits: {0}, {1}, {2}',
    ranking: 'Rank {0}'
  }
}

// 使用数组传参
console.log(i18n.global.t('fruits', ['苹果', '香蕉', '橙子']))
// 水果: 苹果, 香蕉, 橙子

console.log(i18n.global.t('ranking', [1]))
// 第 1 名
```

## 💡 实际应用场景

### 场景1：在 Pinia/Vuex 中使用
```javascript
// stores/userStore.js
import { defineStore } from 'pinia'
import { i18n } from '@/i18n'

export const useUserStore = defineStore('user', {
  state: () => ({
    userName: '张三',
    unreadCount: 3
  }),
  
  getters: {
    // 使用全局 t 方法
    welcomeMessage: (state) => {
      return i18n.global.t('welcome', { name: state.userName })
    },
    
    unreadMessage: (state) => {
      return i18n.global.t('unread', { count: state.unreadCount })
    }
  },
  
  actions: {
    showNotification() {
      // 在 action 中使用
      const msg = i18n.global.t('user.login.success')
      ElMessage.success(msg)
    }
  }
})
```

### 场景2：在普通 JS/TS 工具函数中使用
```javascript
// utils/format.js
import { i18n } from '@/i18n'

export function formatPrice(price, currency = 'CNY') {
  if (currency === 'USD') {
    return i18n.global.t('price.usd', { value: price.toFixed(2) })
  }
  return i18n.global.t('price.cny', { value: price.toFixed(2) })
}

export function formatDate(date) {
  const d = new Date(date)
  return i18n.global.t('date.format', {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate()
  })
}
```

### 场景3：在 API 请求中使用（错误提示）
```javascript
// api/request.js
import axios from 'axios'
import { i18n } from '@/i18n'
import { ElMessage } from 'element-plus'

axios.interceptors.response.use(
  response => response,
  error => {
    // 根据错误码显示对应的翻译
    const errorCode = error.response?.data?.code
    const errorMessage = i18n.global.t(`error.${errorCode}`, {
      default: i18n.global.t('error.unknown')
    })
    
    ElMessage.error(errorMessage)
    return Promise.reject(error)
  }
)
```

## ⚠️ 注意事项

### 1. **必须设置 `legacy: false`**
```javascript
// i18n.js
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,  // 必须设置为 false 才能使用 global
  locale: 'zh-CN',
  messages: {
    // ...
  }
})

export { i18n }
```

### 2. **模板中使用 vs 全局使用**
```vue
<template>
  <!-- 模板中直接用 $t -->
  <div>{{ $t('hello') }}</div>
  
  <!-- 或使用 useI18n 的 t -->
  <div>{{ t('world') }}</div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { i18n } from '@/i18n'

// 方式1：setup 中使用
const { t } = useI18n()
console.log(t('hello'))

// 方式2：全局使用（可以在任何地方）
console.log(i18n.global.t('hello'))
</script>
```

### 3. **响应式问题**
```javascript
// ✅ 正确：locale 变化时自动更新
i18n.global.locale.value = 'en-US'

// ❌ 错误：直接赋值不会触发更新
i18n.global.locale = 'en-US'
```

### 4. **带默认值的翻译**
```javascript
// 如果 key 不存在，可以设置默认值
const message = i18n.global.t('some.new.key', {
  default: '默认文案',
  name: '参数值'
})

// 或指定多个默认值
const message = i18n.global.t('some.key', {
  default: ['默认文案1', '默认文案2'],
  count: 5
})
```

## 📊 方法对比

| 方式 | 使用场景 | 优点 | 缺点 |
|:---|:---|:---|:---|
| `$t` | Vue 模板中 | 简洁、自动响应式 | 只能在模板使用 |
| `t()` from `useI18n()` | Composition API 中 | 响应式、类型提示好 | 只能在 setup 中使用 |
| `i18n.global.t()` | 任意 JS/TS 文件 | 全局可用、灵活 | 需要手动处理响应式 |

**总结**：`i18n.global.t` 是你**在任何 JS/TS 文件中**进行翻译的最佳选择，特别是在工具函数、store、API 拦截器等非 Vue 组件环境中。