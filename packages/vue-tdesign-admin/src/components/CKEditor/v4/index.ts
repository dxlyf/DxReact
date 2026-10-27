/**
 * CKEditor 4 专用 CDN 动态脚本加载器（与 CKEditor 5 完全隔离）
 * 地址：https://cdn.ckeditor.com/{version}/{preset}/ckeditor.js
 * 同一 URL 只注入一次，并用 Promise 缓存避免并发重复加载。
 */

export type CKEditor4Preset = 'basic' | 'standard' | 'full'

export interface CKEditor4Instance {
    name: string
    getData(): string
    setData(html: string, options?: { internal?: boolean; callback?: () => void }): void
    on(
        event: string,
        handler: (...args: any[]) => void,
        scope?: any,
        listenerData?: any,
        priority?: number,
    ): CKEditor4Instance
    once(event: string, handler: (...args: any[]) => void): CKEditor4Instance
    destroy(noUpdate?: boolean): void
    setReadOnly(flag: boolean): void
    focus(): void
    updateElement(): void
}

export interface CKEditor4Static {
    replace(element: HTMLElement | string, config?: Record<string, any>): CKEditor4Instance
    instances: Record<string, CKEditor4Instance>
    /** 关闭「自动把页面中 contenteditable 元素初始化为内联编辑器」的行为 */
    disableAutoInline?: boolean
}

declare global {
    interface Window {
        CKEDITOR?: CKEditor4Static
    }
}

const CDN_BASE = 'https://cdn.ckeditor.com'
const DEFAULT_VERSION: string = '4.22.1'
const DEFAULT_PRESET: CKEditor4Preset = 'standard'

/** URL -> 加载任务，保证同一 CDN 地址只请求一次 */
const tasks = new Map<string, Promise<void>>()

export function getCKEditor4Url(
    version: string = DEFAULT_VERSION,
    preset: CKEditor4Preset = DEFAULT_PRESET,
): string {
    return `${CDN_BASE}/${version}/${preset}/ckeditor.js`
}

/**
 * ckeditor.js 尾部会执行 CKEDITOR.domReady(() => !CKEDITOR.disableAutoInline && CKEDITOR.inlineAll())，
 * 自动把页面里所有 contenteditable="true" 的元素初始化成内联编辑器——这会误伤同页面的 CKEditor 5 编辑区。
 * 由于脚本是动态注入的，onload 时 inlineAll 已经执行完，无法事后关闭。
 * 所以在注入前给 window.CKEDITOR 挂一个临时 setter：脚本赋值时立刻写入 disableAutoInline，
 * 随后再把属性还原成普通数据属性，保证不影响 CKEDITOR 的正常使用。
 */
function guardAutoInline(): void {
    Object.defineProperty(window, 'CKEDITOR', {
        configurable: true,
        get: () => undefined,
        set(value: CKEditor4Static) {
            if (value) {
                value.disableAutoInline = true
            }
            Object.defineProperty(window, 'CKEDITOR', {
                configurable: true,
                enumerable: true,
                writable: true,
                value,
            })
        },
    })
}

function injectScript(url: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.reject(new Error('[CKEditor 4] 仅支持在浏览器环境中加载'))
    }

    const cached = tasks.get(url)
    if (cached) {
        return cached
    }

    const task = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.dataset.ckeditor4 = url

        // 必须在脚本执行前挂上拦截器，否则 inlineAll 已经跑完
        guardAutoInline()

        const cleanup = () => {
            script.onload = null
            script.onerror = null
        }

        script.onload = () => {
            cleanup()
            resolve()
        }

        script.onerror = () => {
            cleanup()
            script.remove()
            tasks.delete(url)
            reject(new Error(`[CKEditor 4] 脚本加载失败：${url}`))
        }

        document.head.appendChild(script)
    })
    tasks.set(url, task)
    return task
}

/** 加载 CKEditor 4，返回 window.CKEDITOR */
export async function loadCKEditor4(
    version: string = DEFAULT_VERSION,
    preset: CKEditor4Preset = DEFAULT_PRESET,
): Promise<CKEditor4Static> {
    if (typeof window === 'undefined') {
        throw new Error('[CKEditor 4] 仅支持在浏览器环境中加载')
    }

    // 已通过其它方式（如本地 lib）引入
    if (window.CKEDITOR) {
        return window.CKEDITOR
    }

    const url = getCKEditor4Url(version, preset)
    await injectScript(url)

    const CKEDITOR = window.CKEDITOR
    if (!CKEDITOR) {
        tasks.delete(url)
        throw new Error(`[CKEditor 4] 脚本已加载但未找到 window.CKEDITOR：${url}`)
    }
    return CKEDITOR
}
