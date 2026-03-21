这是一个经典问题！动态加载的图层会导致 `top` 值变化，需要**实时重新计算**。以下是几种解决方案：

## 方案1：ResizeObserver + MutationObserver 组合

监听布局变化和 DOM 变化，实时更新高度：

```javascript
class DynamicHeightManager {
    constructor(scrollElement, options = {}) {
        this.scrollElement = scrollElement;
        this.offsetElements = options.offsetElements || []; // 需要减去的元素
        this.observer = null;
        this.mutationObserver = null;
        this.resizeObserver = null;
        
        this.init();
    }
    
    init() {
        // 1. 监听窗口大小变化
        window.addEventListener('resize', () => this.updateHeight());
        
        // 2. 监听滚动元素父容器的尺寸变化
        this.resizeObserver = new ResizeObserver(() => this.updateHeight());
        if (this.scrollElement.parentElement) {
            this.resizeObserver.observe(this.scrollElement.parentElement);
        }
        
        // 3. 监听 DOM 变化（动态加载的内容）
        this.mutationObserver = new MutationObserver(() => this.updateHeight());
        this.mutationObserver.observe(document.body, {
            childList: true,      // 监听子节点添加/删除
            subtree: true,        // 监听所有后代节点
            attributes: true,     // 监听属性变化
            attributeFilter: ['style', 'class'] // 只监听样式相关
        });
        
        // 4. 立即执行一次
        this.updateHeight();
    }
    
    updateHeight() {
        if (!this.scrollElement) return;
        
        // 获取滚动元素相对于视口的位置
        const rect = this.scrollElement.getBoundingClientRect();
        const top = rect.top;
        
        // 计算可用高度
        let availableHeight = window.innerHeight - top;
        
        // 减去其他固定元素的高度
        this.offsetElements.forEach(element => {
            if (element && element.isConnected) {
                const elementRect = element.getBoundingClientRect();
                availableHeight -= elementRect.height;
            }
        });
        
        // 设置最大高度
        this.scrollElement.style.maxHeight = `${availableHeight}px`;
        this.scrollElement.style.overflowY = 'auto';
        
        // 可选：触发自定义事件
        this.scrollElement.dispatchEvent(new CustomEvent('heightUpdated', {
            detail: { height: availableHeight }
        }));
    }
    
    addOffsetElement(element) {
        this.offsetElements.push(element);
        this.updateHeight();
    }
    
    destroy() {
        window.removeEventListener('resize', this.updateHeight);
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();
    }
}

// 使用示例
const scrollDiv = document.querySelector('.scroll-area');
const header = document.querySelector('.header');
const toolbar = document.querySelector('.toolbar');

const manager = new DynamicHeightManager(scrollDiv, {
    offsetElements: [header, toolbar]
});

// 动态添加内容后自动更新
setTimeout(() => {
    const newElement = document.createElement('div');
    newElement.className = 'dynamic-header';
    newElement.textContent = '动态加载的头部';
    document.body.insertBefore(newElement, scrollDiv);
    // 自动更新高度，无需手动调用
}, 2000);
```

## 方案2：基于 ResizeObserver 监听所有影响元素

```javascript
class SmartScrollHeight {
    constructor(scrollElement) {
        this.scrollElement = scrollElement;
        this.observers = [];
        this.init();
    }
    
    init() {
        this.calculateHeight();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.calculateHeight());
        
        // 监听滚动元素本身的位置变化
        const positionObserver = new ResizeObserver(() => this.calculateHeight());
        positionObserver.observe(this.scrollElement);
        this.observers.push(positionObserver);
        
        // 监听所有可能影响位置的父元素
        let parent = this.scrollElement.parentElement;
        while (parent) {
            const parentObserver = new ResizeObserver(() => this.calculateHeight());
            parentObserver.observe(parent);
            this.observers.push(parentObserver);
            parent = parent.parentElement;
        }
    }
    
    calculateHeight() {
        // 使用 requestAnimationFrame 避免频繁计算
        requestAnimationFrame(() => {
            const rect = this.scrollElement.getBoundingClientRect();
            const top = rect.top;
            const availableHeight = window.innerHeight - top;
            
            this.scrollElement.style.maxHeight = `${availableHeight}px`;
            this.scrollElement.style.overflowY = 'auto';
        });
    }
    
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        window.removeEventListener('resize', this.calculateHeight);
    }
}

// 使用
const scrollDiv = document.querySelector('.scroll-area');
const manager = new SmartScrollHeight(scrollDiv);
```

## 方案3：使用 IntersectionObserver 辅助

```javascript
class AdaptiveScrollHeight {
    constructor(scrollElement) {
        this.scrollElement = scrollElement;
        this.intersectionObserver = null;
        this.resizeObserver = null;
        this.init();
    }
    
    init() {
        // 监听滚动元素是否进入视口
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.updateHeight();
                    }
                });
            },
            { threshold: [0, 0.1, 0.5, 1] }
        );
        this.intersectionObserver.observe(this.scrollElement);
        
        // 监听父容器变化
        this.resizeObserver = new ResizeObserver(() => this.updateHeight());
        if (this.scrollElement.parentElement) {
            this.resizeObserver.observe(this.scrollElement.parentElement);
        }
        
        window.addEventListener('resize', () => this.updateHeight());
        
        // 使用 requestAnimationFrame 持续检查（兜底）
        this.animationFrame();
    }
    
    updateHeight() {
        const rect = this.scrollElement.getBoundingClientRect();
        const top = rect.top;
        const availableHeight = window.innerHeight - top - 20; // 留点边距
        
        this.scrollElement.style.maxHeight = `${Math.max(availableHeight, 100)}px`;
        this.scrollElement.style.overflowY = 'auto';
    }
    
    animationFrame() {
        let lastHeight = 0;
        
        const check = () => {
            const currentHeight = this.scrollElement.style.maxHeight;
            if (currentHeight !== lastHeight) {
                this.updateHeight();
                lastHeight = currentHeight;
            }
            requestAnimationFrame(check);
        };
        
        requestAnimationFrame(check);
    }
    
    destroy() {
        this.intersectionObserver?.disconnect();
        this.resizeObserver?.disconnect();
        window.removeEventListener('resize', this.updateHeight);
    }
}
```

## 方案4：React Hook 完整解决方案

```javascript
import { useEffect, useRef, useCallback, useState } from 'react';

function useDynamicScrollHeight(scrollRef, dependencies = []) {
    const [height, setHeight] = useState('auto');
    const observersRef = useRef([]);
    
    const calculateHeight = useCallback(() => {
        if (!scrollRef.current) return;
        
        const rect = scrollRef.current.getBoundingClientRect();
        const top = rect.top;
        const availableHeight = window.innerHeight - top - 20; // 20px 边距
        
        const newHeight = `${Math.max(availableHeight, 100)}px`;
        setHeight(newHeight);
        
        return newHeight;
    }, [scrollRef]);
    
    useEffect(() => {
        if (!scrollRef.current) return;
        
        // 立即计算一次
        calculateHeight();
        
        // 监听窗口大小变化
        window.addEventListener('resize', calculateHeight);
        
        // 监听所有可能影响位置的父元素
        const observers = [];
        let parent = scrollRef.current.parentElement;
        
        while (parent) {
            const observer = new ResizeObserver(calculateHeight);
            observer.observe(parent);
            observers.push(observer);
            parent = parent.parentElement;
        }
        
        // 监听滚动元素本身
        const selfObserver = new ResizeObserver(calculateHeight);
        selfObserver.observe(scrollRef.current);
        observers.push(selfObserver);
        
        observersRef.current = observers;
        
        // 使用 MutationObserver 监听 DOM 变化
        const mutationObserver = new MutationObserver(calculateHeight);
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        return () => {
            window.removeEventListener('resize', calculateHeight);
            observers.forEach(observer => observer.disconnect());
            mutationObserver.disconnect();
        };
    }, [scrollRef, calculateHeight, ...dependencies]);
    
    return {
        maxHeight: height,
        overflowY: 'auto',
        style: { maxHeight: height, overflowY: 'auto' }
    };
}

// 使用组件
function ScrollableComponent() {
    const scrollRef = useRef(null);
    const [dynamicContent, setDynamicContent] = useState(false);
    const scrollStyles = useDynamicScrollHeight(scrollRef, [dynamicContent]);
    
    useEffect(() => {
        // 模拟动态加载内容
        setTimeout(() => {
            setDynamicContent(true);
        }, 2000);
    }, []);
    
    return (
        <div>
            <div className="header">固定头部</div>
            {dynamicContent && (
                <div className="dynamic-header">动态加载的头部</div>
            )}
            <div 
                ref={scrollRef} 
                style={scrollStyles.style}
                className="scroll-area"
            >
                {/* 长内容 */}
                {Array(100).fill().map((_, i) => (
                    <div key={i}>内容行 {i + 1}</div>
                ))}
            </div>
        </div>
    );
}
```

## 方案5：最简单实用的方案（推荐）

```javascript
// 一个简单但强大的解决方案
class AutoScrollHeight {
    constructor(selector) {
        this.element = document.querySelector(selector);
        if (!this.element) return;
        
        // 使用 requestAnimationFrame 持续更新
        this.updateHeight = this.updateHeight.bind(this);
        this.updateHeight();
        
        // 监听窗口大小变化
        window.addEventListener('resize', this.updateHeight);
        
        // 监听滚动（确保位置变化时更新）
        window.addEventListener('scroll', this.updateHeight);
        
        // 使用 ResizeObserver 监听父容器
        this.resizeObserver = new ResizeObserver(this.updateHeight);
        this.resizeObserver.observe(document.body);
        
        // 使用 MutationObserver 监听 DOM 变化
        this.mutationObserver = new MutationObserver(this.updateHeight);
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
    }
    
    updateHeight() {
        requestAnimationFrame(() => {
            if (!this.element || !this.element.isConnected) return;
            
            const rect = this.element.getBoundingClientRect();
            const top = rect.top;
            const availableHeight = window.innerHeight - top - 20;
            
            // 避免频繁设置相同的值
            const newHeight = `${Math.max(availableHeight, 100)}px`;
            if (this.element.style.maxHeight !== newHeight) {
                this.element.style.maxHeight = newHeight;
                this.element.style.overflowY = 'auto';
            }
        });
    }
    
    destroy() {
        window.removeEventListener('resize', this.updateHeight);
        window.removeEventListener('scroll', this.updateHeight);
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();
    }
}

// 使用
const scrollManager = new AutoScrollHeight('.scroll-area');

// 当动态内容加载完成后，手动触发一次更新（可选）
function onDynamicContentLoaded() {
    scrollManager.updateHeight();
}
```

## 最佳实践建议

1. **使用 `requestAnimationFrame`**：避免频繁的样式计算和重绘
2. **设置最小高度**：避免高度过小导致内容不可见
3. **添加防抖/节流**：对于高频触发的事件
4. **及时清理观察器**：避免内存泄漏
5. **考虑性能**：如果页面有很多滚动区域，适当增加更新间隔

选择哪个方案取决于您的具体场景：
- 简单场景：使用方案5（最简单实用）
- React 项目：使用方案4（React Hook）
- 复杂交互：使用方案1（完整的事件监听）

需要我根据您的具体代码结构提供更针对性的解决方案吗？