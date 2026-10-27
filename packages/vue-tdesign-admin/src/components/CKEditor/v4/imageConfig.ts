/**
 * CKEditor 4 图片/文件上传完整配置
 *
 * 涉及三个上传入口，分别由不同的配置项控制：
 * 1. uploadUrl                    —— uploadimage 插件：拖拽图片、粘贴图片上传
 * 2. filebrowserImageUploadUrl    —— 图像属性对话框的「上传」标签页
 * 3. filebrowserUploadUrl         —— 超链接对话框的「上传」标签页（图片未配专用地址时也回退到它）
 *
 * 解析优先级（CKEDITOR.fileTools.getUploadUrl）：
 *   imageUploadUrl → uploadUrl → filebrowserImageUploadUrl → filebrowserUploadUrl
 */

export interface ImageConfigOptions {
    /** 上传接口地址；为空则不启用上传入口 */
    uploadUrl?: string
    /** 图片上传地址，缺省回退到 uploadUrl */
    imageUploadUrl?: string
    /** 超链接（普通文件）上传地址，缺省回退到 uploadUrl */
    linkUploadUrl?: string
    /**
     * 上传请求方式：
     * - xhr（默认）：走 uploadRepository + fileLoader，响应必须是 JSON
     *   （成功 `{ uploaded: 1, url: '...' }`，失败 `{ error: { message } }`），
     *   可被 fileUploadRequest / fileUploadResponse 事件接管
     * - form：传统 iframe 表单提交，文件字段名 upload（附带 ckCsrfToken），
     *   服务端需返回 `window.parent.CKEDITOR.tools.callFunction(funcNum, url, message)` 脚本
     */
    uploadMethod?: 'xhr' | 'form'
    /** 图片「浏览服务器」页面地址（不配置则不显示该按钮） */
    imageBrowseUrl?: string
    /** 通用「浏览服务器」页面地址，链接/图片/Flash 未配专用地址时回退到它 */
    browseUrl?: string
    /** 浏览/上传弹窗宽度，数字按 px 处理，也可传 '80%'，默认 80% */
    windowWidth?: number | string
    /** 浏览/上传弹窗高度，数字按 px 处理，也可传 '70%'，默认 70% */
    windowHeight?: number | string
    /** 是否开启 CKEditor 版本安全提示，默认 false（关闭 4.22.1 的 not secure 提示） */
    versionCheck?: boolean
}

/** 生成完整的图像上传配置 */
export function createImageConfig(options: ImageConfigOptions = {}): Record<string, any> {
    const imageUploadUrl = options.imageUploadUrl ?? options.uploadUrl
    const linkUploadUrl = options.linkUploadUrl ?? options.uploadUrl

    const config: Record<string, any> = {
        // 关闭 4.22.1 起默认输出的版本安全提示
        versionCheck: options.versionCheck ?? false,
        // 默认走 XHR：可返回 JSON，也允许被 fileUploadRequest / fileUploadResponse 接管
        filebrowserUploadMethod: options.uploadMethod ?? 'xhr',
    }

    // 拖拽/粘贴上传：uploadimage 插件拿不到地址就不会注册上传 widget
    if (options.uploadUrl) {
        config.uploadUrl = options.uploadUrl
    }

    // 图像属性对话框「上传」标签页
    if (imageUploadUrl) {
        config.filebrowserImageUploadUrl = imageUploadUrl
    }

    // 超链接对话框「上传」标签页
    if (linkUploadUrl) {
        config.filebrowserUploadUrl = linkUploadUrl
    }

    // 「浏览服务器」按钮：需要返回可点选文件的 HTML 页面，不能填上传接口
    if (options.imageBrowseUrl) {
        config.filebrowserImageBrowseUrl = options.imageBrowseUrl
    }
    if (options.browseUrl) {
        config.filebrowserBrowseUrl = options.browseUrl
    }

    if (options.windowWidth !== undefined) {
        config.filebrowserWindowWidth = options.windowWidth
    }
    if (options.windowHeight !== undefined) {
        config.filebrowserWindowHeight = options.windowHeight
    }

    return config
}

/** 把图像上传配置合并进已有的 CKEditor 配置对象（原地修改并返回） */
export function initConfig(config: Record<string, any>, options: ImageConfigOptions = {}): Record<string, any> {
    return Object.assign(config, createImageConfig(options))
}
