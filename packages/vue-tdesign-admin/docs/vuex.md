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