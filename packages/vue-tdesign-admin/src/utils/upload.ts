/**
 * 通用文件上传服务
 * 默认对接项目 mock 服务 /api/upload：multipart/form-data，字段名 file，
 * 响应格式 { code: 0, data: { files: [{ url }] } }。
 */

export interface UploadOptions {
    /** 上传接口地址 */
    action?: string
    /** 文件字段名 */
    fieldName?: string
    /** 附加请求头 */
    headers?: Record<string, string>
    /** 附加表单字段 */
    data?: Record<string, string>
    /** 是否携带 cookie */
    withCredentials?: boolean
    /** 上传进度（0-100） */
    onProgress?: (percent: number) => void
    /** 自定义从响应中提取图片地址 */
    resolveUrl?: (response: any) => string
}

export interface UploadResult {
    /** 图片访问地址 */
    url: string
    /** 服务端原始响应 */
    response: any
}

const DEFAULT_ACTION = '/api/upload'
const DEFAULT_FIELD_NAME = 'file'

/** 从常见的上传响应结构中提取图片地址 */
export function resolveUploadUrl(response: any): string {
    if (!response) return ''
    if (typeof response === 'string') return response
    const data = response.data ?? response
    const file = Array.isArray(data?.files) ? data.files[0] : null
    return file?.url ?? data?.url ?? response.url ?? ''
}

/** 上传单个文件，成功时返回图片地址 */
export function uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const {
        action = DEFAULT_ACTION,
        fieldName = DEFAULT_FIELD_NAME,
        headers,
        data,
        withCredentials = false,
        onProgress,
        resolveUrl,
    } = options

    return new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', action, true)
        xhr.withCredentials = withCredentials

        Object.entries(headers ?? {}).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value)
        })

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                onProgress?.(Math.round((event.loaded / event.total) * 100))
            }
        }

        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error(`上传失败（HTTP ${xhr.status}）`))
                return
            }

            let response: any
            try {
                response = JSON.parse(xhr.responseText)
            } catch {
                reject(new Error('上传响应解析失败'))
                return
            }

            if (typeof response?.code === 'number' && response.code !== 0) {
                reject(new Error(response.msg || response.message || '上传失败'))
                return
            }

            const url = (resolveUrl ?? resolveUploadUrl)(response)
            if (!url) {
                reject(new Error('上传响应中未找到文件地址'))
                return
            }
            resolve({ url, response })
        }

        xhr.onerror = () => reject(new Error('网络异常，文件上传失败'))
        xhr.onabort = () => reject(new Error('文件上传已取消'))

        const formData = new FormData()
        formData.append(fieldName, file, file.name)
        Object.entries(data ?? {}).forEach(([key, value]) => {
            formData.append(key, value)
        })
        xhr.send(formData)
    })
}
