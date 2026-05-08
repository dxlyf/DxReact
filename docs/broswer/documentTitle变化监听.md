以下是监听 `document.title` 变化的函数实现，包含多种监听方式和完整示例：

## 方法一：使用 MutationObserver（推荐）

```javascript
/**
 * 监听 document.title 变化
 * @param {Function} callback - 标题变化时的回调函数，接收新标题和旧标题作为参数
 * @returns {MutationObserver} 返回 observer 实例，可用于停止监听
 */
function listenTitleChange(callback) {
    // 获取 title 元素
    const titleElement = document.querySelector('title');
    
    if (!titleElement) {
        console.error('未找到 title 元素');
        return null;
    }
    
    // 记录旧标题
    let oldTitle = document.title;
    
    // 创建 MutationObserver 实例
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.target === titleElement) {
                const newTitle = document.title;
                if (oldTitle !== newTitle) {
                    // 调用回调函数
                    callback(newTitle, oldTitle);
                    oldTitle = newTitle; // 更新旧标题
                }
            }
        });
    });
    
    // 配置监听选项
    const config = {
        childList: true,  // 监听子节点变化
        subtree: true     // 监听所有后代节点
    };
    
    // 开始监听
    observer.observe(titleElement, config);
    
    return observer;
}
```

## 方法二：重写 title 的 setter（拦截式）

```javascript
/**
 * 通过重写 document.title 的 setter 来监听变化
 * @param {Function} callback - 标题变化时的回调函数
 * @returns {Function} 返回恢复函数，可恢复原始行为
 */
function listenTitleChangeByProxy(callback) {
    let oldTitle = document.title;
    
    // 保存原始的属性描述符
    const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    
    // 重写 setter
    Object.defineProperty(document, 'title', {
        configurable: true,
        enumerable: true,
        get: function() {
            return originalDescriptor.get.call(this);
        },
        set: function(newTitle) {
            const oldTitle = document.title;
            // 调用原始 setter
            originalDescriptor.set.call(this, newTitle);
            // 触发回调
            if (oldTitle !== newTitle) {
                callback(newTitle, oldTitle);
            }
        }
    });
    
    // 返回恢复函数
    return function restore() {
        Object.defineProperty(document, 'title', originalDescriptor);
    };
}
```

## 方法三：轮询检测（简单但性能较差）

```javascript
/**
 * 通过轮询检测标题变化（不推荐在生产环境使用）
 * @param {Function} callback - 标题变化时的回调函数
 * @param {number} interval - 检测间隔（毫秒），默认 100ms
 * @returns {number} 返回定时器 ID，可用于清除定时器
 */
function listenTitleChangeByPolling(callback, interval = 100) {
    let oldTitle = document.title;
    
    const timer = setInterval(() => {
        const newTitle = document.title;
        if (oldTitle !== newTitle) {
            callback(newTitle, oldTitle);
            oldTitle = newTitle;
        }
    }, interval);
    
    return timer;
}
```

## 完整示例和测试

```javascript
// 示例 1：使用 MutationObserver
const observer = listenTitleChange((newTitle, oldTitle) => {
    console.log(`标题已从 "${oldTitle}" 变为 "${newTitle}"`);
});

// 模拟标题变化
setTimeout(() => {
    document.title = '新页面标题';
}, 2000);

setTimeout(() => {
    document.title = '另一个标题';
}, 4000);

// 停止监听
// observer.disconnect();

// 示例 2：使用 setter 拦截方式
const restore = listenTitleChangeByProxy((newTitle, oldTitle) => {
    console.log(`[Proxy] 标题变化: ${oldTitle} -> ${newTitle}`);
});

// 恢复原始行为
// restore();

// 示例 3：使用轮询方式（性能较差，不推荐）
const timer = listenTitleChangeByPolling((newTitle, oldTitle) => {
    console.log(`[Polling] 标题变化: ${oldTitle} -> ${newTitle}`);
}, 200);

// 停止轮询
// clearInterval(timer);
```

## 封装成完整的类（推荐方案）

```javascript
class TitleWatcher {
    constructor() {
        this.observer = null;
        this.callbacks = [];
        this.oldTitle = document.title;
        this.isWatching = false;
    }
    
    // 开始监听
    start() {
        if (this.isWatching) return;
        
        const titleElement = document.querySelector('title');
        if (!titleElement) {
            throw new Error('未找到 title 元素');
        }
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target === titleElement) {
                    const newTitle = document.title;
                    if (this.oldTitle !== newTitle) {
                        this.callbacks.forEach(callback => {
                            callback(newTitle, this.oldTitle);
                        });
                        this.oldTitle = newTitle;
                    }
                }
            });
        });
        
        this.observer.observe(titleElement, { childList: true, subtree: true });
        this.isWatching = true;
    }
    
    // 添加监听回调
    on(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
        }
        return this;
    }
    
    // 移除监听回调
    off(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index !== -1) {
            this.callbacks.splice(index, 1);
        }
        return this;
    }
    
    // 停止监听
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.isWatching = false;
        return this;
    }
    
    // 获取当前标题
    getCurrentTitle() {
        return document.title;
    }
}

// 使用示例
const watcher = new TitleWatcher();
watcher.on((newTitle, oldTitle) => {
    console.log(`标题变化: ${oldTitle} -> ${newTitle}`);
    // 可以做其他操作，比如更新页面标题显示、发送统计等
}).start();

// 停止监听
// watcher.stop();
```

## 注意事项

1. **MutationObserver** 是最推荐的方案，性能好且准确
2. **重写 setter** 方案可能会影响其他监听 title 的代码
3. **轮询方案** 性能较差，不建议在生产环境使用
4. 标题变化只发生在 `<title>` 元素的文本内容改变时
5. 某些浏览器扩展或框架可能会以特殊方式修改标题，MutationObserver 仍能捕获

选择方法一（MutationObserver）即可满足大部分需求。