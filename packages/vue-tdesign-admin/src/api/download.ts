import { instance } from '@/utils/request'

function getFilenameFromHeaders(headers: Record<string, string>): string | null {
    const disposition = headers['content-disposition']
    if (!disposition) return null
    const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;\s]+)/i)
    if (match) {
        return decodeURIComponent(match[1].replace(/['"]/g, ''))
    }
    return null
}

function triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

/**
 * 下载文件
 * @param url 下载接口地址
 * @param filename 可选，指定文件名（不传则尝试从响应头提取）
 * @param data 可选，POST 请求体
 * @param params 可选，URL 查询参数
 */
export async function downloadFile(
    url: string,
    filename?: string,
    data?: Record<string, any>,
    params?: Record<string, any>,
): Promise<void> {
    const res = await instance.post(url, data ?? {}, {
        params,
        responseType: 'blob',
    })

    const blob = res.data as Blob

    let finalName = filename
    if (!finalName) {
        finalName = getFilenameFromHeaders(res.headers as Record<string, string>) || 'download'
    }

    triggerDownload(blob, finalName)
}