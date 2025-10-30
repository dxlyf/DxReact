type UploadFile = {
    type: string
    url: string
    name: string
}

const errorImageData = "data:image/png;base64,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"

/**
 * 校验上传文件的类型
 * @param {File} file - 上传的文件对象
 * @param {string} accept - Upload 组件中设置的 accept 属性值，例如 ".jpg,.png,.pdf"
 * @returns {boolean} - 返回 true 表示类型符合，false 表示不符合
 */
const validateFileType = (file: File, accept: string, isStrict = false) => {
    // 1. 解析 accept 字符串，获取允许的后缀列表
    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());

    // 2. 获取文件的后缀名（转换为小写）
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));

    // 3. 检查文件后缀是否在允许列表中
    const isExtensionValid = allowedExtensions.some(ext => fileExtension === ext);

    if (!isExtensionValid) {
        const allowedTypesText = allowedExtensions.join(', ');
        //message.error(`文件 "${file.name}" 类型错误，仅支持 ${allowedTypesText} 格式的文件。`);
        return false;
    }
    // 4. （可选但推荐）检查文件的 MIME 类型作为第二道防线
    // 注意：file.type 由浏览器提供，可能不可靠，但能拦截一些明显的类型错误[citation:2]
    if (isStrict && file.type) {
        // 这里可以建立一个更完整的扩展名与 MIME 类型映射关系
        const extensionToMime: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4',
            // ... 可根据你的 accept 类型继续添加
        };

        const expectedMime = extensionToMime[fileExtension];
        // 如果映射表中存在该扩展名对应的 MIME 类型，并且文件的实际 MIME 类型不匹配，则告警
        if (expectedMime && file.type !== expectedMime) {
            // console.warn(`文件 "${file.name}" 的 MIME 类型 (${file.type}) 与期望类型 (${expectedMime}) 不符。文件可能被修改了后缀名。[citation:2]`);
            return false;
        }
    }
    return true;
};
/**
 * 判断文件是否为图片类型
 * @param {Object} file - 文件对象
 * @param {string} [file.type] - 文件的 MIME 类型
 * @param {string} [file.name] - 文件名
 * @param {string} [file.url] - 文件 URL
 * @returns {boolean} 是否为图片
 */
function isImageFile(file: UploadFile) {
    if (!file) return false;

    // 1. 通过 MIME 类型判断（最可靠的方式）
    if (file.type) {
        const imageMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'image/tiff',
            'image/x-icon',
            'image/vnd.microsoft.icon'
        ];

        if (imageMimeTypes.includes(file.type.toLowerCase())) {
            return true;
        }
    }

    // 2. 通过文件扩展名判断
    if (file.name) {
        const imageExtensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.webp',
            '.svg', '.bmp', '.tiff', '.tif', '.ico',
            '.jfif', '.pjpeg', '.pjp', '.avif'
        ];

        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.slice(fileName.lastIndexOf('.'));

        if (imageExtensions.includes(fileExtension)) {
            return true;
        }
    }

    // 3. 通过 URL 判断（适用于已上传的文件）
    if (file.url) {
        const imageUrlPatterns = [
            /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i,
            //  /\/image\//i,
            //   /\/img\//i,
            //   /\/upload\/.*\.(jpg|jpeg|png|gif)/i
        ];

        if (imageUrlPatterns.some(pattern => pattern.test(file.url))) {
            return true;
        }
    }

    return false;
}

// 增强版：返回详细的图片类型信息
function getImageFileInfo(file: UploadFile) {
    if (!file) return { isImage: false, type: 'unknown' };

    const result = {
        isImage: false,
        type: 'unknown',
        extension: '',
        mimeType: file.type || 'unknown'
    };

    // 检查 MIME 类型
    if (file.type) {
        const mimeMap = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpeg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff',
            'image/x-icon': 'ico'
        };

        const imageType = mimeMap[file.type.toLowerCase()];
        if (imageType) {
            result.isImage = true;
            result.type = imageType;
            result.extension = imageType === 'jpeg' ? '.jpg' : `.${imageType}`;
            return result;
        }
    }

    // 检查文件扩展名
    if (file.name) {
        const extensionMap = {
            '.jpg': 'jpeg', '.jpeg': 'jpeg',
            '.png': 'png',
            '.gif': 'gif',
            '.webp': 'webp',
            '.svg': 'svg',
            '.bmp': 'bmp',
            '.tiff': 'tiff', '.tif': 'tiff',
            '.ico': 'ico',
            '.jfif': 'jpeg', '.pjpeg': 'jpeg', '.pjp': 'jpeg',
            '.avif': 'avif'
        };

        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
        const imageType = extensionMap[fileExtension];

        if (imageType) {
            result.isImage = true;
            result.type = imageType;
            result.extension = fileExtension;
            return result;
        }
    }

    // 检查 URL
    if (file.url) {
        const urlPatterns = [
            { pattern: /\.(jpg|jpeg)$/i, type: 'jpeg', ext: '.jpg' },
            { pattern: /\.png$/i, type: 'png', ext: '.png' },
            { pattern: /\.gif$/i, type: 'gif', ext: '.gif' },
            { pattern: /\.webp$/i, type: 'webp', ext: '.webp' },
            { pattern: /\.svg$/i, type: 'svg', ext: '.svg' },
            { pattern: /\.bmp$/i, type: 'bmp', ext: '.bmp' },
            { pattern: /\.tiff?$/i, type: 'tiff', ext: '.tiff' },
            { pattern: /\.ico$/i, type: 'ico', ext: '.ico' },
            { pattern: /\.avif$/i, type: 'avif', ext: '.avif' }
        ];

        for (const { pattern, type, ext } of urlPatterns) {
            if (pattern.test(file.url)) {
                result.isImage = true;
                result.type = type;
                result.extension = ext;
                return result;
            }
        }
    }

    return result;
}

// 文件类型分类
export enum FileCategory {
    IMAGE = 'image',
    DOCUMENT = 'document',
    PDF = 'pdf',
    VIDEO = 'video',
    AUDIO = 'audio',
    ARCHIVE = 'archive',
    CODE = 'code',
    EXCEL = 'excel',
    WORD = 'word',
    POWERPOINT = 'powerpoint',
    TEXT = 'text',
    UNKNOWN = 'unknown'
}

// 文件类型信息接口
export interface FileTypeInfo {
    category: FileCategory;
    mimeTypes: string[];
    extensions: string[];
    description: string;
    icon?: string;
}

// 文件信息结果
export interface FileInfoResult {
    name: string;
    extension: string;
    category: FileCategory;
    mimeType: string | null;
    description: string;
    icon: string;
    isSupported: boolean;
}

// 完整的文件类型映射
const FILE_TYPE_MAP: Record<FileCategory, FileTypeInfo> = {
    [FileCategory.IMAGE]: {
        category: FileCategory.IMAGE,
        description: '图片文件',
        icon: '🖼️',
        mimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'image/tiff',
            'image/x-icon',
            'image/vnd.microsoft.icon',
            'image/avif'
        ],
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.ico', '.jfif', '.pjpeg', '.pjp', '.avif']
    },
    [FileCategory.PDF]: {
        category: FileCategory.PDF,
        description: 'PDF文档',
        icon: '📄',
        mimeTypes: [
            'application/pdf'
        ],
        extensions: ['.pdf']
    },
    [FileCategory.WORD]: {
        category: FileCategory.WORD,
        description: 'Word文档',
        icon: '📝',
        mimeTypes: [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-word.document.macroEnabled.12'
        ],
        extensions: ['.doc', '.docx', '.dot', '.dotx']
    },
    [FileCategory.EXCEL]: {
        category: FileCategory.EXCEL,
        description: 'Excel表格',
        icon: '📊',
        mimeTypes: [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ],
        extensions: ['.xls', '.xlsx', '.xlsm', '.xlt', '.xltx']
    },
    [FileCategory.POWERPOINT]: {
        category: FileCategory.POWERPOINT,
        description: 'PowerPoint演示文稿',
        icon: '📽️',
        mimeTypes: [
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint.presentation.macroEnabled.12'
        ],
        extensions: ['.ppt', '.pptx', '.pps', '.ppsx', '.pot', '.potx']
    },
    [FileCategory.DOCUMENT]: {
        category: FileCategory.DOCUMENT,
        description: '其他文档',
        icon: '📃',
        mimeTypes: [
            'text/plain',
            'application/rtf',
            'application/vnd.oasis.opendocument.text',
            'application/vnd.apple.pages'
        ],
        extensions: ['.txt', '.rtf', '.odt', '.pages']
    },
    [FileCategory.TEXT]: {
        category: FileCategory.TEXT,
        description: '文本文件',
        icon: '📄',
        mimeTypes: [
            'text/plain',
            'text/markdown',
            'text/csv'
        ],
        extensions: ['.txt', '.md', '.markdown', '.csv']
    },
    [FileCategory.VIDEO]: {
        category: FileCategory.VIDEO,
        description: '视频文件',
        icon: '🎬',
        mimeTypes: [
            'video/mp4',
            'video/mpeg',
            'video/ogg',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-flv',
            'video/x-matroska'
        ],
        extensions: ['.mp4', '.mpeg', '.mpg', '.ogv', '.webm', '.mov', '.avi', '.flv', '.mkv', '.wmv', '.3gp']
    },
    [FileCategory.AUDIO]: {
        category: FileCategory.AUDIO,
        description: '音频文件',
        icon: '🎵',
        mimeTypes: [
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/aac',
            'audio/webm',
            'audio/flac',
            'audio/x-m4a'
        ],
        extensions: ['.mp3', '.wav', '.ogg', '.aac', '.webm', '.flac', '.m4a', '.wma', '.aiff']
    },
    [FileCategory.ARCHIVE]: {
        category: FileCategory.ARCHIVE,
        description: '压缩文件',
        icon: '📦',
        mimeTypes: [
            'application/zip',
            'application/x-rar-compressed',
            'application/x-tar',
            'application/gzip',
            'application/x-7z-compressed',
            'application/x-bzip2'
        ],
        extensions: ['.zip', '.rar', '.tar', '.gz', '.7z', '.bz2', '.xz']
    },
    [FileCategory.CODE]: {
        category: FileCategory.CODE,
        description: '代码文件',
        icon: '💻',
        mimeTypes: [
            'text/html',
            'text/css',
            'application/javascript',
            'application/json',
            'text/xml',
            'application/xml'
        ],
        extensions: ['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.xml', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs']
    },
    [FileCategory.UNKNOWN]: {
        category: FileCategory.UNKNOWN,
        description: '未知文件',
        icon: '📎',
        mimeTypes: [],
        extensions: []
    }
};

// 支持的 MIME 类型映射（用于快速查找）
const MIME_TYPE_MAP: Map<string, FileTypeInfo> = new Map();
// 支持的文件扩展名映射（用于快速查找）
const EXTENSION_MAP: Map<string, FileTypeInfo> = new Map();

// 初始化映射表
Object.values(FILE_TYPE_MAP).forEach(fileType => {
    fileType.mimeTypes.forEach(mimeType => {
        MIME_TYPE_MAP.set(mimeType.toLowerCase(), fileType);
    });
    fileType.extensions.forEach(extension => {
        EXTENSION_MAP.set(extension.toLowerCase(), fileType);
    });
});
// 根据路径获取文件扩展名
function getFileExtension(path: string): string | null {
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex === -1) return null; // 没有找到扩展名
    return path.substring(lastDotIndex).toLowerCase();
}
function getFileInfo(file:File):FileTypeInfo{
    const extension = getFileExtension(file.name);
    if (extension) {
        return EXTENSION_MAP.get(extension)||MIME_TYPE_MAP.get(file.type) || FILE_TYPE_MAP[FileCategory.UNKNOWN];
    }
    return FILE_TYPE_MAP[FileCategory.UNKNOWN];
}
function downloadFromFile(file:File,filename?:string){
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename||file.name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0);
}
function downloadFromUrl(url:string,fileName?:string){
    const curFileName=fileName||url.split('/').pop()!;
    const ext=getFileExtension(curFileName);
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    a.download = curFileName||'file'+ext;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
    }, 0);
}
export {
    downloadFromUrl,
    getFileExtension,
    getFileInfo,
    MIME_TYPE_MAP,
    EXTENSION_MAP
} 