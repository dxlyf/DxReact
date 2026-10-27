<template>
    <div class="ckeditor4-container" :class="{ 'is-disabled': disabled }">
        <textarea ref="textareaRef" class="ckeditor4-textarea" :name="name"></textarea>
        <div v-if="loading || errorMessage" class="ckeditor4-mask">
            <span v-if="loading" class="ckeditor4-loading">编辑器加载中…</span>
            <span v-else class="ckeditor4-error">{{ errorMessage }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadCKEditor4, type CKEditor4Instance, type CKEditor4Preset } from './index'
import { resolveUploadUrl } from '@/utils/upload'

const props = withDefaults(
    defineProps<{
        /** 编辑器内容（支持 v-model） */
        modelValue?: string
        /** CKEditor 4 版本号 */
        version?: string
        /** CDN 预设包：basic / standard / full */
        preset?: CKEditor4Preset
        /** 透传给 CKEDITOR.replace 的原生配置 */
        config?: Record<string, any>
        /** 界面语言 */
        language?: string
        /** 编辑器高度，数字按 px 处理 */
        height?: number | string
        /** 只读 */
        readOnly?: boolean
        /** 禁用（只读且不可交互） */
        disabled?: boolean
        /** textarea name，便于原生表单提交 */
        name?: string
        /**
         * 上传方式：
         * - native（默认）：使用 CKEditor 自带上传，请求方式、响应格式由 config 中的
         *   filebrowserUploadMethod、filebrowserUploadUrl、filebrowserImageUploadUrl 等原生参数决定
         * - custom：组件接管上传请求，使用下方的 uploadUrl / uploadFieldName / uploadHeaders / uploadData 等配置
         */
        uploadMode?: 'custom' | 'native'
        /** 图片上传接口，传空字符串可关闭上传 */
        uploadUrl?: string
        /** 链接（附件）上传接口，对应 filebrowserUploadUrl，缺省回退 uploadUrl */
        linkUploadUrl?: string
        /** 上传文件字段名（仅 custom 模式） */
        uploadFieldName?: string
        /** 上传附加请求头（仅 custom 模式） */
        uploadHeaders?: Record<string, string>
        /** 上传附加表单字段（仅 custom 模式） */
        uploadData?: Record<string, string>
        /** 自定义从上传响应中提取图片地址（仅 custom 模式） */
        uploadResponseResolver?: (response: any) => string
    }>(),
    {
        modelValue: '',
        version: '4.22.1',
        preset: 'standard',
        config: () => ({}),
        language: 'zh-cn',
        height: 320,
        readOnly: false,
        disabled: false,
        name: '',
        uploadMode: 'custom',
        uploadUrl: '/api/upload',
        linkUploadUrl: '',
        uploadFieldName: 'file',
        uploadHeaders: () => ({}),
        uploadData: () => ({}),
    },
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
    (e: 'ready', instance: CKEditor4Instance): void
    (e: 'focus'): void
    (e: 'blur'): void
    (e: 'error', error: Error): void
}>()

const textareaRef = ref<HTMLTextAreaElement>()
const loading = ref(true)
const errorMessage = ref('')

let instance: CKEditor4Instance | null = null
let disposed = false

function buildConfig(): Record<string, any> {
    const height = typeof props.height === 'number' ? `${props.height}px` : props.height
    const uploadUrl = props.uploadUrl || undefined
    const linkUploadUrl = props.linkUploadUrl || uploadUrl
    const config: Record<string, any> = {
        language: props.language,
        height,
        readOnly: props.readOnly || props.disabled,
        // uploadimage 需要 uploadUrl 才会启用拖拽/粘贴上传
        uploadUrl, // 粘贴图片
        // 图像浏览器服务器地址
        /**
         * 支持三种粒度，优先级从高到低：`filebrowserImageBrowseUrl` （仅图片）→`filebrowserBrowseUrl` （通用，链接/图片/Flash 都回退到它）→ 不配置则不显示「浏览服务器」按钮。
         */
        //  filebrowserBrowseUrl:browseImageUrl,
        //    filebrowserImageBrowseUrl:browseImageUrl,
        // filebrowser 插件只有拿到上传地址，才会在「图像属性」对话框展示 Upload 标签页
        filebrowserUploadUrl: linkUploadUrl, // 链接/附件
        filebrowserImageUploadUrl: uploadUrl,// 图像
        imageUploadUrl:uploadUrl,
        versionCheck: false
    }
    if (props.uploadMode === 'custom') {
        // 接管上传时固定走 XHR + uploadRepository 分支，请求细节由 fileUploadRequest 覆写；
        // native 模式不设置该方法，交由 config 中的 filebrowserUploadMethod 决定（默认即 XHR 分支）
        config.filebrowserUploadMethod = 'xhr'
    }
    return {
        ...config,
        ...props.config,
    }
}

/**
 * 接管 CKEditor 4 图片上传：复用 fileLoader 的 XHR 发送请求，
 * 由 fileUploadRequest / fileUploadResponse 替换默认上传逻辑。
 */
function bindUploadEvents(editor: CKEditor4Instance) {
    // 优先级 1：先于 CKEditor 默认上传处理执行
    editor.on(
        'fileUploadRequest',
        (evt: any) => {
            const fileLoader = evt.data.fileLoader
            const xhr: XMLHttpRequest = fileLoader.xhr
            // CKEditor 在触发 fileUploadRequest 前已按配置解析好地址（图片/链接可能不同），优先使用它
            const targetUrl: string = fileLoader.uploadUrl || props.uploadUrl

            const formData = new FormData()
            formData.append(props.uploadFieldName, fileLoader.file, fileLoader.fileName)
            Object.entries(props.uploadData ?? {}).forEach(([key, value]) =>
                formData.append(key, value),
            )

            xhr.open('POST', targetUrl, true)
            Object.entries(props.uploadHeaders ?? {}).forEach(([key, value]) =>
                xhr.setRequestHeader(key, value),
            )
            xhr.send(formData)

            // 阻止 CKEditor 默认上传请求
            evt.stop()
        },
        null,
        null,
        1,
    )

    editor.on(
        'fileUploadResponse',
        (evt: any) => {
            evt.stop()

            const data = evt.data
            const xhr: XMLHttpRequest = data.fileLoader.xhr

            try {
                if (xhr.status < 200 || xhr.status >= 300) {
                    throw new Error(`图片上传失败（HTTP ${xhr.status}）`)
                }
                const response = JSON.parse(xhr.responseText)
                if (typeof response?.code === 'number' && response.code !== 0) {
                    throw new Error(response.msg || response.message || '图片上传失败')
                }
                const url = (props.uploadResponseResolver ?? resolveUploadUrl)(response)
                if (!url) throw new Error('上传响应中未找到图片地址')
                const absoluteUrl = url.startsWith('http') ? url : `//${location.host}${url}`
                data.url = absoluteUrl
            } catch (err) {
                data.message = err instanceof Error ? err.message : '图片上传失败'
                // 取消成功流程，编辑器会在图片位置展示错误提示
                evt.cancel()
            }
        },
        null,
        null,
        1,
    )
}
/**
 * 接管 CKEditor 4 上传：复用 fileLoader 的 XHR 发送请求，
 * 图片走 uploadUrl、链接/附件走 filebrowserUploadUrl（由 fileLoader.uploadUrl 决定）。
 */
function bindUploadEvents2(editor: CKEditor4Instance) {
    editor.on(
        'fileUploadRequest',
        (evt: any) => {

            // 阻止 CKEditor 默认上传请求
            evt.stop()

            const fileLoader = evt.data.fileLoader
            const xhr: XMLHttpRequest = fileLoader.xhr
            // CKEditor 在触发 fileUploadRequest 前已按配置解析好地址（图片/链接可能不同），优先使用它
            const targetUrl: string = fileLoader.uploadUrl || props.uploadUrl

            const formData = new FormData()
            formData.append(props.uploadFieldName, fileLoader.file, fileLoader.fileName)
            Object.entries(props.uploadData ?? {}).forEach(([key, value]) =>
                formData.append(key, value),
            )

            xhr.open('POST', targetUrl, true)
            Object.entries(props.uploadHeaders ?? {}).forEach(([key, value]) =>
                xhr.setRequestHeader(key, value),

            )
            xhr.onload = () => {
                try {
                    const response = JSON.parse(xhr.responseText)
                    if (response && response.code === 0) {
                        const url = (props.uploadResponseResolver ?? resolveUploadUrl)(response)
                        if (!url) throw new Error('上传响应中未找到文件地址')
                        // uploadimage widget 渲染 <img src> 时取的是 loader.url，必须显式赋值
                        const absoluteUrl = url.startsWith('http') ? url : `//${location.host}${url}`

                        fileLoader.responseData = {
                            uploaded: 1,
                            url: absoluteUrl,
                            fileName: url.substring(url.lastIndexOf('/') + 1),
                        }
                        fileLoader.url = absoluteUrl
                        fileLoader.uploaded = 1
                        fileLoader.fileName = fileLoader.responseData.fileName
                        fileLoader.changeStatus('uploaded')
                    } else {
                        throw new Error(response?.msg || response?.message || '上传失败')
                    }
                } catch (err) {
                    // 必须是 error，uploadRepository 才会触发失败回调
                    fileLoader.responseData = {
                        uploaded: 0,
                        error: err instanceof Error ? err.message : '上传失败',
                    }
                    fileLoader.uploaded = 0
                    fileLoader.error = fileLoader.responseData.error
                    fileLoader.changeStatus('error')
                }
            }
            xhr.send(formData)
        },
        null,
        null,
        1,
    )
}
function syncReadOnly() {
    instance?.setReadOnly(props.readOnly || props.disabled)
}

function bindEvents(editor: CKEditor4Instance) {
    // 仅 custom 模式接管上传；native 模式完全交给 CKEditor 自带实现
    if (props.uploadMode === 'custom' && props.uploadUrl) bindUploadEvents(editor)

    editor.on('instanceReady', () => {
        if (disposed) return
        loading.value = false
        syncReadOnly()
        emit('ready', editor)
    })

    editor.on('change', () => {
        if (disposed || !instance) return
        const html = instance.getData()
        // 由外部写入导致的变化不再回传，避免 v-model 回环
        if (html === (props.modelValue ?? '')) return
        emit('update:modelValue', html)
        emit('change', html)
    })

    editor.on('focus', () => {
        if (!disposed) emit('focus')
    })

    editor.on('blur', () => {
        if (!disposed) emit('blur')
    })
}

async function initEditor() {
    if (!textareaRef.value) return

    loading.value = true
    errorMessage.value = ''
    // CKEditor 4 以 textarea 的当前内容作为初始值
    textareaRef.value.value = props.modelValue ?? ''

    try {
        const CKEDITOR = await loadCKEditor4(props.version, props.preset)
        if (disposed || !textareaRef.value) {
            loading.value = false
            return
        }
        instance = CKEDITOR.replace(textareaRef.value, buildConfig())
        bindEvents(instance)
    } catch (err) {
        loading.value = false
        const error = err instanceof Error ? err : new Error(String(err))
        errorMessage.value = error.message
        emit('error', error)
    }
}

watch(
    () => props.modelValue,
    (value) => {
        const html = value ?? ''
        if (!instance) {
            if (textareaRef.value) textareaRef.value.value = html
            return
        }
        if (html === instance.getData()) return
        instance.setData(html)
    },
)

watch(() => [props.readOnly, props.disabled], syncReadOnly)

onMounted(initEditor)

onBeforeUnmount(() => {
    disposed = true
    if (instance) {
        try {
            // true：不把编辑器内容回写 textarea，数据已由 v-model 维护
            instance.destroy(true)
        } catch {
            // 编辑器可能已随页面卸载被销毁
        }
        instance = null
    }
})

defineExpose({
    getEditor: () => instance,
    getData: () => instance?.getData() ?? '',
    setData: (html: string) => instance?.setData(html),
    focus: () => instance?.focus(),
    setReadOnly: (flag: boolean) => instance?.setReadOnly(flag),
})
</script>

<style scoped>
.ckeditor4-container {
    position: relative;
    width: 100%;
    min-height: 120px;
}

.ckeditor4-textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 120px;
    padding: 8px 12px;
    border: 1px solid #dcdcdc;
    border-radius: 4px;
    font-family: inherit;
    resize: vertical;
}

.is-disabled :deep(.cke),
.is-disabled .ckeditor4-textarea {
    pointer-events: none;
}

.is-disabled {
    opacity: 0.6;
}

.ckeditor4-mask {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
}

.ckeditor4-loading {
    color: #666;
    font-size: 14px;
}

.ckeditor4-error {
    padding: 0 16px;
    color: #d54941;
    font-size: 14px;
    text-align: center;
    word-break: break-all;
}
</style>
