/**
 * 网络资源加载监听器 - TypeScript 实现
 * 用于监听网页刷新时特定类型资源的加载完成情况
 */

// 资源类型定义
type ResourceInitiatorType = 'img' | 'script' | 'link' | 'fetch' | 'xmlhttprequest' | 'css' | 'iframe';

// 资源配置选项
interface ResourceLoadMonitorOptions {
    /** 要监听的资源类型列表，默认监听所有资源类型 */
    resourceTypes?: ResourceInitiatorType[];
    /** 所有资源加载完成时的回调函数 */
    onComplete?: (resources: Map<string, ResourceInfo>) => void;
    /** 单个资源加载完成时的回调函数 */
    onResourceLoaded?: (url: string, info: ResourceInfo) => void;
    /** 超时时间（毫秒），避免一直等待，默认30000ms */
    timeout?: number;
    /** 是否在页面刷新时自动开始监听，默认true */
    autoStart?: boolean;
    /** 是否输出详细日志，默认false */
    verbose?: boolean;
}

// 资源信息接口
interface ResourceInfo {
    url: string;
    type: ResourceInitiatorType;
    status: 'loading' | 'loaded' | 'failed';
    startTime: number;
    endTime?: number;
    duration?: number;
    size?: number;
}

// 资源统计信息
interface ResourceStatistics {
    total: number;
    loaded: number;
    pending: number;
    failed: number;
    byType: Map<ResourceInitiatorType, number>;
    averageLoadTime: number;
    totalLoadTime: number;
}

// 性能条目扩展接口
interface PerformanceResourceTimingExtended extends PerformanceResourceTiming {
    initiatorType: ResourceInitiatorType;
}

/**
 * 资源加载监听器类
 */
class ResourceLoadMonitor {
    private resources: Map<string, ResourceInfo> = new Map();
    private isMonitoring: boolean = false;
    private timeoutId: number | null = null;
    private observer: PerformanceObserver | null = null;
    private options: Required<ResourceLoadMonitorOptions>;
    private startTime: number = 0;
    private abortController: AbortController | null = null;

    constructor(options: ResourceLoadMonitorOptions = {}) {
        this.options = {
            resourceTypes: ['img', 'script', 'link', 'fetch', 'xmlhttprequest'],
            onComplete: () => {},
            onResourceLoaded: () => {},
            timeout: 30000,
            autoStart: true,
            verbose: false,
            ...options
        };

        if (this.options.autoStart && typeof window !== 'undefined') {
            this.init();
        }
    }

    /**
     * 初始化监听器
     */
    private init(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
        window.addEventListener('load', () => this.checkAllResourcesLoaded());
    }

    /**
     * 开始监听资源加载
     */
    public start(): void {
        if (this.isMonitoring) {
            this.log('监听器已在运行中');
            return;
        }

        this.isMonitoring = true;
        this.startTime = performance.now();
        this.resources.clear();
        this.abortController = new AbortController();

        this.log('开始监听资源加载...');

        // 捕获初始已加载的资源
        this.captureInitialResources();

        // 监听 Performance API 的资源条目
        this.observePerformanceEntries();

        // 监听资源加载事件（备用方案）
        this.observeResourceEvents();

        // 设置超时
        this.timeoutId = window.setTimeout(() => {
            if (this.getPendingCount() > 0) {
                this.log(`监听超时，仍有 ${this.getPendingCount()} 个资源未加载完成`);
                this.checkAllResourcesLoaded();
            }
        }, this.options.timeout);
    }

    /**
     * 捕获初始已加载的资源
     */
    private captureInitialResources(): void {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTimingExtended[];
        
        entries.forEach(entry => {
            if (this.shouldMonitorResource(entry)) {
                this.markResourceAsLoaded(entry.name, entry);
            }
        });
    }

    /**
     * 判断是否应该监听该资源
     */
    private shouldMonitorResource(entry: PerformanceResourceTimingExtended): boolean {
        const initiatorType = entry.initiatorType;
        
        // 如果指定了资源类型，则只监听指定类型
        if (this.options.resourceTypes.length > 0 && !this.options.resourceTypes.includes(initiatorType)) {
            return false;
        }

        // 排除不需要监听的内置资源
        const excludePatterns = [
            'chrome-extension://',
            'moz-extension://',
            'data:',
            'blob:',
            'about:'
        ];
        
        if (excludePatterns.some(pattern => entry.name.startsWith(pattern))) {
            return false;
        }

        return true;
    }

    /**
     * 标记资源为已加载
     */
    private markResourceAsLoaded(url: string, entry?: PerformanceResourceTimingExtended): void {
        if (this.resources.has(url)) {
            const existing = this.resources.get(url)!;
            if (existing.status === 'loaded') {
                return;
            }
        }

        const info: ResourceInfo = {
            url,
            type: entry?.initiatorType || this.guessResourceType(url),
            status: entry && entry.responseEnd === 0 ? 'failed' : 'loaded',
            startTime: entry?.startTime || 0,
            endTime: entry?.responseEnd || performance.now(),
            duration: entry?.duration,
            size: entry?.transferSize
        };

        this.resources.set(url, info);
        this.log(`资源加载${info.status === 'loaded' ? '完成' : '失败'}: ${url}`);
        this.options.onResourceLoaded(url, info);
        this.checkAllResourcesLoaded();
    }

    /**
     * 根据 URL 猜测资源类型
     */
    private guessResourceType(url: string): ResourceInitiatorType {
        const extension = url.split('.').pop()?.toLowerCase();
        
        switch (extension) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'webp':
            case 'svg':
                return 'img';
            case 'css':
                return 'link';
            case 'js':
                return 'script';
            default:
                return 'fetch';
        }
    }

    /**
     * 检查是否所有资源都已加载
     */
    private checkAllResourcesLoaded(): void {
        // 获取当前所有资源条目
        const currentEntries = performance.getEntriesByType('resource') as PerformanceResourceTimingExtended[];
        let pendingCount = 0;

        // 找出尚未加载的资源
        currentEntries.forEach(entry => {
            if (this.shouldMonitorResource(entry) && !this.resources.has(entry.name)) {
                if (entry.responseEnd > 0) {
                    this.markResourceAsLoaded(entry.name, entry);
                } else {
                    pendingCount++;
                }
            }
        });

        // 检查动态添加的资源
        this.checkDynamicResources();

        // 如果没有待加载的资源，触发完成回调
        if (pendingCount === 0 && this.getPendingCount() === 0) {
            this.finishMonitoring();
        }
    }

    /**
     * 检查动态添加的资源
     */
    private checkDynamicResources(): void {
        // 获取所有图片、脚本、链接等元素
        const imgElements = document.querySelectorAll('img');
        imgElements.forEach(img => {
            if (img.src && !this.resources.has(img.src)) {
                if (img.complete) {
                    this.markResourceAsLoaded(img.src);
                } else {
                    this.addImageListeners(img);
                }
            }
        });

        const scriptElements = document.querySelectorAll('script[src]');
        scriptElements.forEach(script => {
            if (script.src && !this.resources.has(script.src)) {
                if (script.readyState === 'complete') {
                    this.markResourceAsLoaded(script.src);
                } else {
                    this.addScriptListeners(script);
                }
            }
        });

        const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
        linkElements.forEach(link => {
            if (link.href && !this.resources.has(link.href)) {
                if (link.sheet) {
                    this.markResourceAsLoaded(link.href);
                } else {
                    this.addLinkListeners(link);
                }
            }
        });
    }

    /**
     * 为图片元素添加监听器
     */
    private addImageListeners(img: HTMLImageElement): void {
        const loadHandler = () => {
            this.markResourceAsLoaded(img.src);
            img.removeEventListener('load', loadHandler);
            img.removeEventListener('error', errorHandler);
        };

        const errorHandler = () => {
            this.markResourceAsLoaded(img.src);
            img.removeEventListener('load', loadHandler);
            img.removeEventListener('error', errorHandler);
        };

        img.addEventListener('load', loadHandler, { signal: this.abortController?.signal });
        img.addEventListener('error', errorHandler, { signal: this.abortController?.signal });
    }

    /**
     * 为脚本元素添加监听器
     */
    private addScriptListeners(script: HTMLScriptElement): void {
        const loadHandler = () => {
            this.markResourceAsLoaded(script.src);
            script.removeEventListener('load', loadHandler);
            script.removeEventListener('error', errorHandler);
        };

        const errorHandler = () => {
            this.markResourceAsLoaded(script.src);
            script.removeEventListener('load', loadHandler);
            script.removeEventListener('error', errorHandler);
        };

        script.addEventListener('load', loadHandler, { signal: this.abortController?.signal });
        script.addEventListener('error', errorHandler, { signal: this.abortController?.signal });
    }

    /**
     * 为链接元素添加监听器
     */
    private addLinkListeners(link: HTMLLinkElement): void {
        const loadHandler = () => {
            this.markResourceAsLoaded(link.href);
            link.removeEventListener('load', loadHandler);
            link.removeEventListener('error', errorHandler);
        };

        const errorHandler = () => {
            this.markResourceAsLoaded(link.href);
            link.removeEventListener('load', loadHandler);
            link.removeEventListener('error', errorHandler);
        };

        link.addEventListener('load', loadHandler, { signal: this.abortController?.signal });
        link.addEventListener('error', errorHandler, { signal: this.abortController?.signal });
    }

    /**
     * 监听 PerformanceObserver API 获取实时资源加载
     */
    private observePerformanceEntries(): void {
        if (!window.PerformanceObserver) {
            this.log('PerformanceObserver 不支持');
            return;
        }

        this.observer = new PerformanceObserver((list) => {
            const entries = list.getEntries() as PerformanceResourceTimingExtended[];
            
            entries.forEach(entry => {
                if (entry.entryType === 'resource' && this.shouldMonitorResource(entry)) {
                    if (entry.responseEnd > 0 && !this.resources.has(entry.name)) {
                        this.markResourceAsLoaded(entry.name, entry);
                    }
                }
            });
        });

        this.observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * 监听传统资源加载事件作为备用
     */
    private observeResourceEvents(): void {
        // 监听图片加载
        document.addEventListener('load', (e) => {
            const target = e.target as HTMLElement;
            
            if (target.tagName === 'IMG' && (target as HTMLImageElement).src) {
                this.markResourceAsLoaded((target as HTMLImageElement).src);
            } else if (target.tagName === 'LINK' && (target as HTMLLinkElement).href) {
                this.markResourceAsLoaded((target as HTMLLinkElement).href);
            } else if (target.tagName === 'SCRIPT' && (target as HTMLScriptElement).src) {
                this.markResourceAsLoaded((target as HTMLScriptElement).src);
            }
        }, { signal: this.abortController?.signal });

        // 监听错误事件，避免因加载失败导致永久等待
        document.addEventListener('error', (e) => {
            const target = e.target as HTMLElement;
            const src = (target as HTMLImageElement).src || 
                       (target as HTMLScriptElement).src || 
                       (target as HTMLLinkElement).href;
            
            if (src && !this.resources.has(src)) {
                this.log(`资源加载失败: ${src}`);
                this.markResourceAsLoaded(src);
            }
        }, { signal: this.abortController?.signal });
    }

    /**
     * 获取待加载资源数量
     */
    private getPendingCount(): number {
        let pendingCount = 0;
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTimingExtended[];
        
        entries.forEach(entry => {
            if (this.shouldMonitorResource(entry) && !this.resources.has(entry.name)) {
                if (entry.responseEnd === 0) {
                    pendingCount++;
                }
            }
        });
        
        return pendingCount;
    }

    /**
     * 完成监听
     */
    private finishMonitoring(): void {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this.log(`所有目标资源加载完成，共加载 ${this.resources.size} 个资源`);
        this.options.onComplete(this.resources);
    }

    /**
     * 停止监听
     */
    public stop(): void {
        this.isMonitoring = false;
        
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        this.log('监听已停止');
    }

    /**
     * 获取加载统计信息
     */
    public getStatistics(): ResourceStatistics {
        const allResources = Array.from(this.resources.values());
        const loadedResources = allResources.filter(r => r.status === 'loaded');
        const failedResources = allResources.filter(r => r.status === 'failed');
        
        const byType = new Map<ResourceInitiatorType, number>();
        allResources.forEach(r => {
            byType.set(r.type, (byType.get(r.type) || 0) + 1);
        });

        const totalLoadTime = loadedResources.reduce((sum, r) => sum + (r.duration || 0), 0);
        const averageLoadTime = loadedResources.length > 0 ? totalLoadTime / loadedResources.length : 0;

        return {
            total: allResources.length,
            loaded: loadedResources.length,
            pending: allResources.length - loadedResources.length - failedResources.length,
            failed: failedResources.length,
            byType,
            averageLoadTime,
            totalLoadTime
        };
    }

    /**
     * 获取资源列表
     */
    public getResources(): Map<string, ResourceInfo> {
        return new Map(this.resources);
    }

    /**
     * 检查特定资源是否已加载
     */
    public isResourceLoaded(url: string): boolean {
        const resource = this.resources.get(url);
        return resource?.status === 'loaded';
    }

    /**
     * 等待特定资源加载完成
     */
    public waitForResource(url: string, timeout?: number): Promise<ResourceInfo> {
        return new Promise((resolve, reject) => {
            if (this.isResourceLoaded(url)) {
                resolve(this.resources.get(url)!);
                return;
            }

            const timeoutMs = timeout || 10000;
            let timeoutId: number | null = null;

            const checkInterval = setInterval(() => {
                if (this.isResourceLoaded(url)) {
                    clearInterval(checkInterval);
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve(this.resources.get(url)!);
                }
            }, 100);

            timeoutId = window.setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`等待资源超时: ${url}`));
            }, timeoutMs);
        });
    }

    /**
     * 日志输出
     */
    private log(message: string): void {
        if (this.options.verbose) {
            console.log(`[ResourceLoadMonitor] ${message}`);
        }
    }
}


// 使用示例
// 页面刷新时自动开始监听

// 方式1：监听所有资源类型
const monitor = new ResourceLoadMonitor({
    resourceTypes: ['img', 'script', 'link'],
    onComplete: (resources: Map<string, ResourceInfo>) => {
        console.log('✅ 所有资源加载完成！');
        console.log(`共加载 ${resources.size} 个资源`);
        
        // 获取统计信息
        const stats = monitor.getStatistics();
        console.log('加载统计:', stats);
        
        // 执行页面初始化逻辑
        initPageAfterResourcesLoaded();
    },
    onResourceLoaded: (url: string, info: ResourceInfo) => {
        console.log(`资源加载完成: ${url}`, info);
    },
    timeout: 15000,
    verbose: true
});


// 方式2：监听特定类型的资源（只监听图片）
const imageMonitor = new ResourceLoadMonitor({
    resourceTypes: ['img'],
    onComplete: () => {
        console.log('所有图片加载完成！');
        // 图片加载完成后的处理
    },
    autoStart: true
});

// 方式3：等待特定资源
async function waitForSpecificResource(): Promise<void> {
    try {
        const resourceInfo = await monitor.waitForResource('https://example.com/important.js', 5000);
        console.log('重要资源加载完成:', resourceInfo);
    } catch (error) {
        console.error('资源加载失败:', error);
    }
}

// 方式4：获取当前加载状态
function checkLoadingStatus(): void {
    const stats = monitor.getStatistics();
    console.log(`加载进度: ${stats.loaded}/${stats.total} (${stats.failed}失败)`);
    
    if (stats.pending > 0) {
        console.log(`还有 ${stats.pending} 个资源正在加载`);
    }
}