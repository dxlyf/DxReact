/**
 * CKEditor 5 专用 CDN 动态脚本加载器（与 CKEditor 4 完全隔离）
 * 地址：https://cdn.ckeditor.com/ckeditor5/{version}/{build}/ckeditor.js
 * 每个 build 暴露不同的 UMD 全局变量，加载后按全局名取构造函数。
 */

export type CKEditor5Build = 'classic' | 'inline' | 'balloon' | 'decoupled-document'

export interface CKEditor5Instance {
    getData(): string
    setData(data: string): void
    destroy(): Promise<void>
    focus(): void
    enableReadOnlyMode(lockId: string): void
    disableReadOnlyMode(lockId: string): void
    model: {
        document: {
            on(event: string, handler: (...args: any[]) => void): void
        }
    }
    editing: {
        view: {
            document: {
                on(event: string, handler: (...args: any[]) => void): void
            }
        }
    }
}

export interface CKEditor5Constructor {
    create(element: HTMLElement | string, config?: Record<string, any>): Promise<CKEditor5Instance>
}

declare global {
    interface Window {
        ClassicEditor?: CKEditor5Constructor
        InlineEditor?: CKEditor5Constructor
        BalloonEditor?: CKEditor5Constructor
        DecoupledEditor?: CKEditor5Constructor
    }
}

const CDN_BASE = 'https://cdn.ckeditor.com'
const DEFAULT_VERSION = '41.4.2'
const DEFAULT_BUILD: CKEditor5Build = 'classic'

/** 各 build 对应的 UMD 全局变量名 */
const GLOBALS: Record<
    CKEditor5Build,
    'ClassicEditor' | 'InlineEditor' | 'BalloonEditor' | 'DecoupledEditor'
> = {
    classic: 'ClassicEditor',
    inline: 'InlineEditor',
    balloon: 'BalloonEditor',
    'decoupled-document': 'DecoupledEditor',
}

/** URL -> 加载任务，保证同一 CDN 地址只请求一次 */
const tasks = new Map<string, Promise<void>>()

export function getCKEditor5Url(
    version: string = DEFAULT_VERSION,
    build: CKEditor5Build = DEFAULT_BUILD,
): string {
    return `${CDN_BASE}/ckeditor5/${version}/${build}/ckeditor.js`
}

function injectScript(url: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return Promise.reject(new Error('[CKEditor 5] 仅支持在浏览器环境中加载'))
    }

    const cached = tasks.get(url)
    if (cached) {
        return cached
    }

    const task = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.dataset.ckeditor5 = url

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
            reject(new Error(`[CKEditor 5] 脚本加载失败：${url}`))
        }

        document.head.appendChild(script)
    })

    tasks.set(url, task)
    return task
}

/** 加载 CKEditor 5，返回对应 build 的全局构造函数（如 window.ClassicEditor） */
export async function loadCKEditor5(
    version: string = DEFAULT_VERSION,
    build: CKEditor5Build = DEFAULT_BUILD,
): Promise<CKEditor5Constructor> {
    if (typeof window === 'undefined') {
        throw new Error('[CKEditor 5] 仅支持在浏览器环境中加载')
    }

    const globalName = GLOBALS[build]
    const existing = window[globalName] as CKEditor5Constructor | undefined
    if (existing) {
        return existing
    }

    const url = getCKEditor5Url(version, build)
    await injectScript(url)

    const ctor = window[globalName] as CKEditor5Constructor | undefined
    if (!ctor) {
        tasks.delete(url)
        throw new Error(`[CKEditor 5] 脚本已加载但未找到 window.${globalName}：${url}`)
    }
    return ctor
}
