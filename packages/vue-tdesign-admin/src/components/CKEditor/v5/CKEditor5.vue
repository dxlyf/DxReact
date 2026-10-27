<template>
    <div
        class="ckeditor5-container"
        :class="{ 'is-disabled': disabled }"
        :style="{ '--ckeditor5-height': editorHeight }"
    >
        <div ref="editorRef" class="ckeditor5-editor"></div>
        <div v-if="loading || errorMessage" class="ckeditor5-mask">
            <span v-if="loading" class="ckeditor5-loading">编辑器加载中…</span>
            <span v-else class="ckeditor5-error">{{ errorMessage }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { loadCKEditor5, type CKEditor5Build, type CKEditor5Instance } from './index'
import { uploadFile } from '@/utils/upload'

const READ_ONLY_LOCK_ID = 'vue-ckeditor5'

const props = withDefaults(
    defineProps<{
        /** 编辑器内容（支持 v-model） */
        modelValue?: string
        /** CKEditor 5 版本号 */
        version?: string
        /** CDN build：classic / inline / balloon / decoupled-document */
        build?: CKEditor5Build
        /** 透传给 Editor.create 的原生配置 */
        config?: Record<string, any>
        /** 编辑器高度，数字按 px 处理 */
        height?: number | string
        /** 只读 */
        readOnly?: boolean
        /** 禁用（只读且不可交互） */
        disabled?: boolean
        /** 图片上传接口，传空字符串可关闭上传 */
        uploadUrl?: string
        /** 上传文件字段名 */
        uploadFieldName?: string
        /** 上传附加请求头 */
        uploadHeaders?: Record<string, string>
        /** 上传附加表单字段 */
        uploadData?: Record<string, string>
        /** 自定义从上传响应中提取图片地址 */
        uploadResponseResolver?: (response: any) => string
    }>(),
    {
        modelValue: '',
        version: '41.4.2',
        build: 'classic',
        config: () => ({}),
        height: 320,
        readOnly: false,
        disabled: false,
        uploadUrl: '/api/upload',
        uploadFieldName: 'file',
        uploadHeaders: () => ({}),
        uploadData: () => ({}),
    },
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
    (e: 'ready', instance: CKEditor5Instance): void
    (e: 'focus'): void
    (e: 'blur'): void
    (e: 'error', error: Error): void
}>()

const editorRef = ref<HTMLDivElement>()
const loading = ref(true)
const errorMessage = ref('')

const editorHeight = computed(() =>
    typeof props.height === 'number' ? `${props.height}px` : props.height,
)

let instance: CKEditor5Instance | null = null
let disposed = false

/**
 * 上传适配器插件：接管 FileRepository，把图片交给项目上传服务。
 * 需在 extraPlugins 中注册，运行时才会覆盖默认适配器。
 */
function createUploadAdapterPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => ({
        // CKEditor 5 约定 upload() 返回 { default: url }
        upload: () =>
            loader.file.then((file: File) =>
                uploadFile(file, {
                    action: props.uploadUrl,
                    fieldName: props.uploadFieldName,
                    headers: props.uploadHeaders,
                    data: props.uploadData,
                    resolveUrl: props.uploadResponseResolver,
                }).then(({ url }) => ({ default: url })),
            ),
        abort: () => {},
    })
}

function buildConfig(): Record<string, any> {
    const basePlugins = props.config?.extraPlugins
    const extraPlugins: Array<(editor: any) => void> = Array.isArray(basePlugins)
        ? [...basePlugins]
        : basePlugins
          ? [basePlugins]
          : []
    if (props.uploadUrl) extraPlugins.push(createUploadAdapterPlugin)

    return {
        // CDN 上的开源构建使用 GPL 授权
        licenseKey: 'GPL',
        initialData: props.modelValue ?? '',
        ...props.config,
        extraPlugins,
    }
}

function syncReadOnly() {
    if (!instance) return
    if (props.readOnly || props.disabled) {
        instance.enableReadOnlyMode(READ_ONLY_LOCK_ID)
    } else {
        instance.disableReadOnlyMode(READ_ONLY_LOCK_ID)
    }
}

async function initEditor() {
    if (!editorRef.value) return

    loading.value = true
    errorMessage.value = ''

    try {
        const Editor = await loadCKEditor5(props.version, props.build)
        if (disposed || !editorRef.value) {
            loading.value = false
            return
        }

        const editor = await Editor.create(editorRef.value, buildConfig())
        if (disposed) {
            await editor.destroy()
            return
        }
        instance = editor

        editor.model.document.on('change:data', () => {
            if (disposed || !instance) return
            const html = instance.getData()
            // 由外部写入导致的变化不再回传，避免 v-model 回环
            if (html === (props.modelValue ?? '')) return
            emit('update:modelValue', html)
            emit('change', html)
        })

        editor.editing.view.document.on('focus', () => {
            if (!disposed) emit('focus')
        })

        editor.editing.view.document.on('blur', () => {
            if (!disposed) emit('blur')
        })

        syncReadOnly()
        loading.value = false
        emit('ready', editor)
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
        if (!instance) return
        const html = value ?? ''
        if (html === instance.getData()) return
        instance.setData(html)
    },
)

watch(() => [props.readOnly, props.disabled], syncReadOnly)

onMounted(initEditor)

onBeforeUnmount(() => {
    disposed = true
    if (instance) {
        // destroy() 返回 Promise，组件卸载时无需等待
        void instance.destroy().catch(() => {})
        instance = null
    }
})

defineExpose({
    getEditor: () => instance,
    getData: () => instance?.getData() ?? '',
    setData: (html: string) => instance?.setData(html),
    focus: () => instance?.focus(),
    setReadOnly: (flag: boolean) => {
        if (!instance) return
        if (flag) instance.enableReadOnlyMode(READ_ONLY_LOCK_ID)
        else instance.disableReadOnlyMode(READ_ONLY_LOCK_ID)
    },
})
</script>

<style scoped>
.ckeditor5-container {
    position: relative;
    width: 100%;
    min-height: 120px;
}

.ckeditor5-editor :deep(.ck-editor__editable_inline) {
    min-height: var(--ckeditor5-height, 320px);
}

.is-disabled :deep(.ck-editor),
.is-disabled .ckeditor5-editor {
    pointer-events: none;
}

.is-disabled {
    opacity: 0.6;
}

.ckeditor5-mask {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.7);
}

.ckeditor5-loading {
    color: #666;
    font-size: 14px;
}

.ckeditor5-error {
    padding: 0 16px;
    color: #d54941;
    font-size: 14px;
    text-align: center;
    word-break: break-all;
}
</style>
