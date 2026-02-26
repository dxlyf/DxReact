## 🎯 **effect 和 effectScope 核心概念**

在 Vue 3 中，`effect` 是响应式系统的底层核心，而 `effectScope` 是用于批量管理 effect 的高级工具。

| 特性 | `effect` | `effectScope` |
|:---|:---|:---|
| **作用** | 创建响应式副作用 | 批量管理多个 effect |
| **层级** | 单个副作用单元 | effect 的容器 |
| **自动收集** | 自动追踪依赖 | 自动收集内部的 effect |
| **手动停止** | 可单独停止 | 可批量停止内部所有 effect |

## 📝 **effect 详解**

### 1. **effect 基础用法**
```javascript
import { ref, effect } from 'vue'

const count = ref(0)
const double = ref(0)

// 创建一个 effect
const runner = effect(() => {
  double.value = count.value * 2
  console.log(`count: ${count.value}, double: ${double.value}`)
})

// 修改响应式数据，effect 会自动重新运行
count.value++ // 输出: count: 1, double: 2
count.value = 5 // 输出: count: 5, double: 10

// 停止 effect
runner.effect.stop()
count.value = 10 // effect 不会再运行
```

### 2. **effect 选项**
```javascript
import { ref, effect } from 'vue'

const data = ref({ count: 0 })

// effect 的高级选项
const runner = effect(
  () => {
    console.log('effect 运行:', data.value.count)
    return data.value.count * 2
  },
  {
    // 调度器：控制 effect 重新运行的时机
    scheduler: (job) => {
      console.log('调度器执行')
      // 可以在这里做防抖、节流等操作
      setTimeout(job, 1000)
    },
    
    // 懒执行：默认 false，首次会立即执行
    lazy: true,
    
    // 作用域：指定 effect 所属的作用域
    scope: null,
    
    // 允许递归调用自己
    allowRecurse: false,
    
    // 在组件渲染前触发
    onTrack: (event) => {
      console.log('依赖被追踪:', event)
    },
    
    // 在组件渲染后触发
    onTrigger: (event) => {
      console.log('依赖被触发:', event)
    }
  }
)

// 如果是 lazy 模式，需要手动调用
if (runner.effect.lazy) {
  const result = runner() // 返回值是 effect 函数的返回值
  console.log('lazy result:', result)
}
```

### 3. **computed 和 watch 的底层实现**
```javascript
import { ref, effect, computed } from 'vue'

const count = ref(0)

// computed 的简化实现
function myComputed(getter) {
  const result = ref()
  
  effect(() => {
    result.value = getter()
  })
  
  return result
}

const double = myComputed(() => count.value * 2)

// watch 的简化实现
function myWatch(source, callback) {
  effect(() => {
    // 读取值以触发依赖收集
    const value = source.value
    callback(value)
  })
}
```

## 📦 **effectScope 详解**

### 1. **基础用法**
```javascript
import { ref, effectScope, effect } from 'vue'

const count = ref(0)

// 创建一个作用域
const scope = effectScope()

scope.run(() => {
  // 在这个作用域内创建的 effect 都会被收集
  effect(() => {
    console.log('effect 1:', count.value)
  })
  
  effect(() => {
    console.log('effect 2:', count.value * 2)
  })
  
  // 也可以创建嵌套作用域
  const nestedScope = effectScope()
  nestedScope.run(() => {
    effect(() => {
      console.log('nested effect:', count.value)
    })
  })
  
  // 嵌套作用域也可以单独停止
  // nestedScope.stop()
})

// 修改值，所有 effect 都会运行
count.value++ // 输出三个 effect

// 停止整个作用域（包括嵌套的）
scope.stop()

count.value = 5 // 没有任何 effect 运行
```

### 2. **作用域模式：主动收集**
```javascript
import { effectScope, effect } from 'vue'

const scope = effectScope()

// 非运行状态下创建的 effect 不会被收集
effect(() => {
  console.log('这个 effect 不在作用域内')
})

// 方式1：通过 run 方法
scope.run(() => {
  effect(() => {
    console.log('这个 effect 被作用域收集')
  })
})

// 方式2：通过主动收集
const runner = effect(() => {
  console.log('手动收集的 effect')
})
scope.effects.push(runner.effect) // 手动添加到作用域
```

### 3. **获取当前作用域**
```javascript
import { effectScope, getCurrentScope, onScopeDispose } from 'vue'

const scope = effectScope()

scope.run(() => {
  // 获取当前作用域
  const currentScope = getCurrentScope()
  console.log(currentScope === scope) // true
  
  // 注册作用域销毁时的回调
  onScopeDispose(() => {
    console.log('作用域被销毁了')
    // 清理资源、取消订阅等
  })
  
  effect(() => {
    // 这个 effect 在作用域内
  })
})

// 销毁作用域，会触发 onScopeDispose
scope.stop()
```

## 🎯 **实际应用场景**

### 场景1：组件内的批量清理
```vue
<script setup>
import { ref, effectScope, onScopeDispose, watch } from 'vue'

// 场景：组件内有多个需要手动清理的副作用
const searchQuery = ref('')
const results = ref([])
const loading = ref(false)

// 创建组件级别的作用域
const scope = effectScope()

scope.run(() => {
  // 监听搜索变化，自动请求
  watch(searchQuery, async (query) => {
    loading.value = true
    try {
      const res = await fetch(`/api/search?q=${query}`)
      results.value = await res.json()
    } finally {
      loading.value = false
    }
  })
  
  // 定时轮询
  const interval = setInterval(() => {
    console.log('轮询中...')
  }, 5000)
  
  // 注册清理函数
  onScopeDispose(() => {
    clearInterval(interval)
  })
})

// 组件卸载时自动清理所有副作用
onScopeDispose(() => {
  scope.stop()
})

// 或者更简单：直接利用组件的清理机制
// scope.stop() 会在组件卸载时自动调用？
// 不，需要手动调用，但可以结合 onUnmounted
import { onUnmounted } from 'vue'
onUnmounted(() => {
  scope.stop()
})
</script>
```

### 场景2：动态模块/插件系统
```javascript
// plugin-system.js
import { effectScope, ref, watch } from 'vue'

class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.sharedState = ref({})
  }
  
  // 加载插件
  loadPlugin(pluginId, pluginCode) {
    // 每个插件有自己的作用域
    const scope = effectScope()
    
    scope.run(() => {
      // 插件内部状态
      const pluginState = ref({})
      
      // 插件可以监听共享状态
      watch(this.sharedState, (newState) => {
        console.log(`插件 ${pluginId} 收到状态更新:`, newState)
        // 插件逻辑...
      })
      
      // 执行插件代码
      pluginCode(pluginState, this.sharedState)
    })
    
    this.plugins.set(pluginId, scope)
  }
  
  // 卸载插件
  unloadPlugin(pluginId) {
    const scope = this.plugins.get(pluginId)
    if (scope) {
      scope.stop() // 清理插件的所有副作用
      this.plugins.delete(pluginId)
    }
  }
  
  // 更新共享状态
  updateState(newState) {
    this.sharedState.value = newState
  }
}

// 使用
const manager = new PluginManager()

manager.loadPlugin('logger', (state, shared) => {
  // 插件的副作用会自动被 scope 管理
  watch(() => shared.value, (val) => {
    console.log('状态变化:', val)
  })
})

manager.unloadPlugin('logger') // 自动清理所有 watch
```

### 场景3：路由页面缓存优化
```javascript
// router-cache.js
import { effectScope, ref, watch } from 'vue'

class RouteCache {
  constructor() {
    this.cache = new Map()
    this.currentScope = null
  }
  
  // 进入路由
  enterRoute(routeId, setupFn) {
    // 退出前的路由清理
    this.leaveRoute()
    
    // 创建新作用域
    const scope = effectScope()
    this.currentScope = scope
    
    scope.run(() => {
      // 执行路由的 setup 函数
      const cleanup = setupFn()
      
      // 返回清理函数
      return cleanup
    })
  }
  
  // 离开路由
  leaveRoute() {
    if (this.currentScope) {
      this.currentScope.stop()
      this.currentScope = null
    }
  }
}

// 在路由守卫中使用
const cache = new RouteCache()

router.beforeEach((to, from) => {
  cache.leaveRoute() // 清理上一个路由的副作用
})

router.afterEach((to) => {
  cache.enterRoute(to.path, () => {
    // 路由页面的响应式逻辑
    const data = ref(null)
    
    watch(data, () => {
      // 自动被 scope 管理
    })
    
    // 返回清理函数
    return () => {
      console.log('路由资源清理')
    }
  })
})
```

### 场景4：测试中的隔离
```javascript
// __tests__/component.test.js
import { effectScope, ref, watch } from 'vue'

describe('响应式逻辑测试', () => {
  let scope
  
  beforeEach(() => {
    // 每个测试用例创建独立作用域
    scope = effectScope()
  })
  
  afterEach(() => {
    // 清理作用域，避免测试间相互影响
    scope.stop()
  })
  
  test('测试 watch 行为', () => {
    const count = ref(0)
    let watchCount = 0
    
    scope.run(() => {
      watch(count, () => {
        watchCount++
      })
    })
    
    count.value++
    expect(watchCount).toBe(1)
  })
  
  test('另一个测试，不受影响', () => {
    const count = ref(0)
    let watchCount = 0
    
    scope.run(() => {
      watch(count, () => {
        watchCount++
      })
    })
    
    count.value++
    count.value++
    expect(watchCount).toBe(2)
  })
})
```

## 📊 **对比总结**

| 场景 | 使用 `effect` | 使用 `effectScope` |
|:---|:---|:---|
| **单个副作用** | ✅ 直接使用 | ❌ 过度设计 |
| **多个相关副作用** | ❌ 需要手动管理 | ✅ 批量管理 |
| **动态创建/销毁** | ❌ 需要记录每个 effect | ✅ 作用域一键清理 |
| **组件内部** | ⚠️ 可能造成内存泄漏 | ✅ 组件卸载自动清理 |
| **插件系统** | ❌ 难以统一管理 | ✅ 每个插件独立作用域 |
| **路由缓存** | ❌ 清理逻辑复杂 | ✅ 进入/离开轻松管理 |
| **单元测试** | ❌ 测试间可能相互影响 | ✅ 每个测试隔离 |

## 💡 **最佳实践**

1. **组件内使用 `effectScope` 管理多个副作用**
2. **插件/模块系统为每个模块创建独立作用域**
3. **测试中为每个用例创建新作用域**
4. **简单的单个 effect 直接用 `effect`**

```javascript
// 推荐模式：组件内使用作用域
import { effectScope, onUnmounted } from 'vue'

export default {
  setup() {
    const scope = effectScope()
    
    scope.run(() => {
      // 所有副作用在这里定义
      useFeature1()
      useFeature2()
      useFeature3()
    })
    
    onUnmounted(() => {
      scope.stop()
    })
    
    return {}
  }
}
```

这样既能享受响应式的便利，又能避免内存泄漏问题！