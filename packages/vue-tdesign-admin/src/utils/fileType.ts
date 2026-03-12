// utils/fileTypeDetector.ts

/**
 * 常见文件的魔数（文件头）
 */
const FILE_MAGIC_NUMBERS = {
  // 图片
  JPEG: {
    hex: ['FFD8FF'],
    offset: 0,
    mime: 'image/jpeg',
    extensions: ['jpg', 'jpeg']
  },
  PNG: {
    hex: ['89504E47'],
    offset: 0,
    mime: 'image/png',
    extensions: ['png']
  },
  GIF: {
    hex: ['47494638'],
    offset: 0,
    mime: 'image/gif',
    extensions: ['gif']
  },
  WEBP: {
    hex: ['52494646', '57454250'], // RIFF....WEBP
    offset: 0,
    mime: 'image/webp',
    extensions: ['webp']
  },
  BMP: {
    hex: ['424D'],
    offset: 0,
    mime: 'image/bmp',
    extensions: ['bmp']
  },
  // 文档
  PDF: {
    hex: ['25504446'], // %PDF
    offset: 0,
    mime: 'application/pdf',
    extensions: ['pdf']
  },
  DOC: {
    hex: ['D0CF11E0'], // CFB格式
    offset: 0,
    mime: 'application/msword',
    extensions: ['doc']
  },
  DOCX: {
    hex: ['504B0304'], // ZIP格式 (PK)
    offset: 0,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx']
  },
  XLS: {
    hex: ['D0CF11E0'],
    offset: 0,
    mime: 'application/vnd.ms-excel',
    extensions: ['xls']
  },
  XLSX: {
    hex: ['504B0304'],
    offset: 0,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx']
  },
  // 压缩文件
  ZIP: {
    hex: ['504B0304'],
    offset: 0,
    mime: 'application/zip',
    extensions: ['zip']
  },
  RAR: {
    hex: ['52617221'],
    offset: 0,
    mime: 'application/x-rar-compressed',
    extensions: ['rar']
  },
  '7Z': {
    hex: ['377ABCAF271C'],
    offset: 0,
    mime: 'application/x-7z-compressed',
    extensions: ['7z']
  },
  TAR: {
    hex: ['7573746172'],
    offset: 257, // TAR头部位置特殊
    mime: 'application/x-tar',
    extensions: ['tar']
  },
  // 音频
  MP3: {
    hex: ['494433', 'FFFB'],
    offset: 0,
    mime: 'audio/mpeg',
    extensions: ['mp3']
  },
  // 视频
  MP4: {
    hex: ['66747970'], // ftyp
    offset: 4,
    mime: 'video/mp4',
    extensions: ['mp4']
  },
  AVI: {
    hex: ['52494646', '41564920'],
    offset: 0,
    mime: 'video/x-msvideo',
    extensions: ['avi']
  },
  // 可执行文件
  EXE: {
    hex: ['4D5A'],
    offset: 0,
    mime: 'application/x-msdownload',
    extensions: ['exe']
  }
} as const

type FileType = keyof typeof FILE_MAGIC_NUMBERS

/**
 * 检测结果接口
 */
interface FileTypeResult {
  /** 是否检测成功 */
  success: boolean
  /** 实际文件类型 */
  actualType?: FileType
  /** 实际MIME类型 */
  actualMime?: string
  /** 实际扩展名 */
  actualExtension?: string
  /** 声明的类型（基于文件名） */
  declaredType?: string
  /** 是否匹配 */
  match: boolean
  /** 错误信息 */
  error?: string
  /** 文件头（十六进制） */
  header?: string
}

/**
 * 读取文件头（魔数）
 */
async function readFileHeader(file: File, bytesToRead: number = 12): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      const hex = Array.from(uint8Array)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('')
      resolve(hex)
    }
    
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsArrayBuffer(file.slice(0, bytesToRead))
  })
}

/**
 * 检测实际文件类型
 */
export async function detectRealFileType(file: File): Promise<FileTypeResult> {
  try {
    // 读取文件头（前12个字节）
    const header = await readFileHeader(file, 12)
    
    // 获取声明的扩展名
    const declaredExt = file.name.split('.').pop()?.toLowerCase() || ''
    
    // 遍历魔数表进行匹配
    for (const [type, magic] of Object.entries(FILE_MAGIC_NUMBERS)) {
      const magicHex = Array.isArray(magic.hex) ? magic.hex : [magic.hex]
      
      // 检查每个可能的魔数
      for (const hex of magicHex) {
        const offset = magic.offset || 0
        const headerAtOffset = header.substr(offset * 2, hex.length)
        
        if (headerAtOffset === hex) {
          const match = magic.extensions.includes(declaredExt)
          
          return {
            success: true,
            actualType: type as FileType,
            actualMime: magic.mime,
            actualExtension: magic.extensions[0],
            declaredType: declaredExt,
            match,
            header
          }
        }
      }
    }
    
    return {
      success: false,
      match: false,
      error: '无法识别的文件类型',
      header,
      declaredType: declaredExt
    }
  } catch (error) {
    return {
      success: false,
      match: false,
      error: error instanceof Error ? error.message : '检测失败'
    }
  }
}