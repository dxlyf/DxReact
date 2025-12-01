type Rule = {
  extensions: string[];
  mimePatterns: RegExp[];
};
export class AdvancedFileClassifier {
  defaultRules: Record<string, Rule>;
  rules: Record<string, Rule>;
  constructor(customRules:Record<string,Rule> = {}) {
    this.defaultRules = {
      document: {
        extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'],
        mimePatterns: [/^application\/(pdf|msword|.*wordprocessingml)/, /^text\/plain/]
      },
      image: {
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
        mimePatterns: [/^image\//]
      },
      video: {
        extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
        mimePatterns: [/^video\//]
      },
      audio: {
        extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
        mimePatterns: [/^audio\//]
      },
      archive: {
        extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
        mimePatterns: [/^application\/(zip|x-rar|.*compressed)/]
      }
    };
    
    this.rules = { ...this.defaultRules, ...customRules };
  }
  
  classify(fileName:string, fileUrl:string, fileType:string) {
    const extension = this.extractExtension(fileName, fileUrl);
    
    // 1. 优先通过扩展名分类
    for (const [category, rule] of Object.entries(this.rules)) {
      if (rule.extensions.includes(extension?.toLowerCase())) {
        return category;
      }
    }
    
    // 2. 其次通过MIME类型分类
    if (fileType) {
      for (const [category, rule] of Object.entries(this.rules)) {
        if (rule.mimePatterns.some(pattern => pattern.test(fileType))) {
          return category;
        }
      }
    }
    
    return 'other';
  }
  
  extractExtension(fileName:string, fileUrl:string) {
    let source = fileName || fileUrl;
    if (!source) return null;
    
    // 从URL中提取文件名
    if (source.includes('/')) {
      const urlParts = source.split('/');
      source = urlParts[urlParts.length - 1];
    }
    
    const lastDotIndex = source.lastIndexOf('.');
    return lastDotIndex === -1 ? null : source.slice(lastDotIndex + 1).toLowerCase();
  }
  
  // 批量分类
  classifyMultiple(files:{name:string, url?:string, type?:string}[]) {
    return files.map(file => ({
      ...file,
      category: this.classify(file.name, file.url, file.type)
    }));
  }
}

