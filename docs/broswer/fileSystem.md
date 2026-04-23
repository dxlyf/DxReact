以下是使用 TypeScript 封装的完整文件系统操作工具类，支持目录和文件的增删改查：

```typescript
// file-system.ts

/**
 * 文件系统操作错误类型
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * 文件/目录信息
 */
export interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  lastModified?: Date;
  parent?: FileSystemDirectoryHandle;
}

/**
 * 文件写入选项
 */
export interface WriteFileOptions {
  /** 是否创建缺失的父目录，默认 true */
  createParent?: boolean;
  /** 写入模式，默认 'create' */
  mode?: 'create' | 'overwrite' | 'append';
}

/**
 * 目录遍历选项
 */
export interface ListOptions {
  /** 是否递归遍历子目录，默认 false */
  recursive?: boolean;
  /** 文件匹配模式（正则表达式），默认匹配所有 */
  pattern?: RegExp;
  /** 是否包含目录本身，默认 false */
  includeDirectories?: boolean;
}

/**
 * 文件系统操作类
 * 
 * @example
 * ```typescript
 * // 请求目录权限
 * const fs = new FileSystem();
 * const dirHandle = await fs.requestDirectory();
 * 
 * // 写入文件
 * await fs.writeFile(dirHandle, 'test.txt', 'Hello World');
 * 
 * // 读取文件
 * const content = await fs.readFile(dirHandle, 'test.txt');
 * ```
 */
export class FileSystem {
  private static instance: FileSystem;
  private grantedHandles: Map<string, FileSystemDirectoryHandle> = new Map();

  /**
   * 获取单例实例
   */
  static getInstance(): FileSystem {
    if (!FileSystem.instance) {
      FileSystem.instance = new FileSystem();
    }
    return FileSystem.instance;
  }

  /**
   * 请求用户选择并授权一个目录
   */
  async requestDirectory(options?: {
    id?: string;
    startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }): Promise<FileSystemDirectoryHandle> {
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: options?.id,
        startIn: options?.startIn,
        mode: 'readwrite'
      });

      // 验证权限
      const permission = await this.verifyPermission(dirHandle, true);
      if (!permission) {
        throw new FileSystemError('无法获取目录读写权限', 'PERMISSION_DENIED');
      }

      if (options?.id) {
        this.grantedHandles.set(options.id, dirHandle);
      }

      return dirHandle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new FileSystemError('用户取消了目录选择', 'USER_ABORTED', error);
      }
      throw new FileSystemError('请求目录失败', 'REQUEST_FAILED', error);
    }
  }

  /**
   * 恢复之前授权的目录句柄（需要配合 requestDirectory 时传入的 id）
   */
  async restoreDirectory(id: string): Promise<FileSystemDirectoryHandle | null> {
    const handle = this.grantedHandles.get(id);
    if (!handle) return null;

    const permission = await this.verifyPermission(handle, false);
    return permission ? handle : null;
  }

  /**
   * 验证并请求目录权限
   */
  async verifyPermission(
    dirHandle: FileSystemDirectoryHandle,
    readWrite: boolean = false
  ): Promise<boolean> {
    const opts: FileSystemHandlePermissionDescriptor = {
      mode: readWrite ? 'readwrite' : 'read'
    };

    if ((await dirHandle.queryPermission(opts)) === 'granted') {
      return true;
    }

    if ((await dirHandle.requestPermission(opts)) === 'granted') {
      return true;
    }

    return false;
  }

  /**
   * 读取文件内容（文本）
   */
  async readFile(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<string> {
    try {
      const fileHandle = await this.getFileHandle(dirHandle, filePath);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      throw new FileSystemError(`读取文件失败: ${filePath}`, 'READ_FAILED', error);
    }
  }

  /**
   * 读取文件内容（二进制 ArrayBuffer）
   */
  async readFileAsBuffer(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<ArrayBuffer> {
    try {
      const fileHandle = await this.getFileHandle(dirHandle, filePath);
      const file = await fileHandle.getFile();
      return await file.arrayBuffer();
    } catch (error) {
      throw new FileSystemError(`读取文件失败: ${filePath}`, 'READ_FAILED', error);
    }
  }

  /**
   * 读取文件内容（Blob）
   */
  async readFileAsBlob(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<Blob> {
    try {
      const fileHandle = await this.getFileHandle(dirHandle, filePath);
      return await fileHandle.getFile();
    } catch (error) {
      throw new FileSystemError(`读取文件失败: ${filePath}`, 'READ_FAILED', error);
    }
  }

  /**
   * 写入文件
   */
  async writeFile(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string,
    data: string | Blob | ArrayBuffer | Uint8Array,
    options: WriteFileOptions = {}
  ): Promise<void> {
    const { createParent = true, mode = 'create' } = options;

    try {
      // 解析路径，分离目录和文件名
      const { parentDir, fileName } = await this.resolvePath(dirHandle, filePath, createParent);
      
      let fileHandle: FileSystemFileHandle;

      if (mode === 'create') {
        try {
          fileHandle = await parentDir.getFileHandle(fileName, { create: true });
        } catch {
          fileHandle = await parentDir.getFileHandle(fileName, { create: true });
        }
      } else {
        fileHandle = await parentDir.getFileHandle(fileName, { create: true });
      }

      const writable = await fileHandle.createWritable({ keepExistingData: mode === 'append' });
      
      if (mode === 'append') {
        const existingFile = await fileHandle.getFile();
        const existingContent = await existingFile.text();
        await writable.write(existingContent + data);
      } else {
        await writable.write(data);
      }
      
      await writable.close();
    } catch (error) {
      throw new FileSystemError(`写入文件失败: ${filePath}`, 'WRITE_FAILED', error);
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<void> {
    try {
      const { parentDir, fileName } = await this.resolvePath(dirHandle, filePath, false);
      await parentDir.removeEntry(fileName);
    } catch (error) {
      throw new FileSystemError(`删除文件失败: ${filePath}`, 'DELETE_FAILED', error);
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(
    dirHandle: FileSystemDirectoryHandle,
    dirPath: string
  ): Promise<FileSystemDirectoryHandle> {
    try {
      const pathParts = dirPath.split(/[/\\]/).filter(p => p);
      let currentHandle = dirHandle;

      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      return currentHandle;
    } catch (error) {
      throw new FileSystemError(`创建目录失败: ${dirPath}`, 'CREATE_DIR_FAILED', error);
    }
  }

  /**
   * 删除目录（递归删除）
   */
  async deleteDirectory(
    dirHandle: FileSystemDirectoryHandle,
    dirPath: string,
    recursive: boolean = true
  ): Promise<void> {
    try {
      const { parentDir, fileName } = await this.resolvePath(dirHandle, dirPath, false);
      await parentDir.removeEntry(fileName, { recursive });
    } catch (error) {
      throw new FileSystemError(`删除目录失败: ${dirPath}`, 'DELETE_DIR_FAILED', error);
    }
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(
    dirHandle: FileSystemDirectoryHandle,
    path: string
  ): Promise<boolean> {
    try {
      const { parentDir, fileName } = await this.resolvePath(dirHandle, path, false);
      await parentDir.getFileHandle(fileName);
      return true;
    } catch {
      try {
        const { parentDir, fileName } = await this.resolvePath(dirHandle, path, false);
        await parentDir.getDirectoryHandle(fileName);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * 获取文件或目录信息
   */
  async getEntryInfo(
    dirHandle: FileSystemDirectoryHandle,
    path: string
  ): Promise<FileSystemEntry | null> {
    try {
      // 先尝试作为文件
      const fileHandle = await this.getFileHandle(dirHandle, path);
      const file = await fileHandle.getFile();
      return {
        name: fileHandle.name,
        path: path,
        isDirectory: false,
        isFile: true,
        size: file.size,
        lastModified: new Date(file.lastModified)
      };
    } catch {
      try {
        // 再尝试作为目录
        const dir = await this.getDirectoryHandle(dirHandle, path);
        return {
          name: dir.name,
          path: path,
          isDirectory: true,
          isFile: false
        };
      } catch {
        return null;
      }
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(
    dirHandle: FileSystemDirectoryHandle,
    dirPath: string = '',
    options: ListOptions = {}
  ): Promise<FileSystemEntry[]> {
    const { recursive = false, pattern, includeDirectories = true } = options;
    const results: FileSystemEntry[] = [];
    
    const targetDir = dirPath ? await this.getDirectoryHandle(dirHandle, dirPath) : dirHandle;

    const traverse = async (handle: FileSystemDirectoryHandle, currentPath: string) => {
      for await (const entry of handle.values()) {
        const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'directory') {
          if (includeDirectories) {
            results.push({
              name: entry.name,
              path: fullPath,
              isDirectory: true,
              isFile: false
            });
          }
          
          if (recursive) {
            await traverse(entry as FileSystemDirectoryHandle, fullPath);
          }
        } else {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const entryInfo: FileSystemEntry = {
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            isFile: true,
            size: file.size,
            lastModified: new Date(file.lastModified)
          };
          
          if (!pattern || pattern.test(entry.name)) {
            results.push(entryInfo);
          }
        }
      }
    };

    await traverse(targetDir, dirPath);
    return results;
  }

  /**
   * 复制文件
   */
  async copyFile(
    srcDirHandle: FileSystemDirectoryHandle,
    srcPath: string,
    destDirHandle: FileSystemDirectoryHandle,
    destPath: string
  ): Promise<void> {
    try {
      const content = await this.readFileAsBuffer(srcDirHandle, srcPath);
      await this.writeFile(destDirHandle, destPath, content);
    } catch (error) {
      throw new FileSystemError(`复制文件失败: ${srcPath} -> ${destPath}`, 'COPY_FAILED', error);
    }
  }

  /**
   * 移动文件（复制后删除原文件）
   */
  async moveFile(
    srcDirHandle: FileSystemDirectoryHandle,
    srcPath: string,
    destDirHandle: FileSystemDirectoryHandle,
    destPath: string
  ): Promise<void> {
    await this.copyFile(srcDirHandle, srcPath, destDirHandle, destPath);
    await this.deleteFile(srcDirHandle, srcPath);
  }

  /**
   * 重命名文件或目录
   */
  async rename(
    dirHandle: FileSystemDirectoryHandle,
    oldPath: string,
    newName: string
  ): Promise<void> {
    try {
      const { parentDir, fileName } = await this.resolvePath(dirHandle, oldPath, false);
      
      // 检查原文件/目录是否存在
      const isFile = await this.exists(dirHandle, oldPath);
      
      if (isFile) {
        const fileHandle = await parentDir.getFileHandle(fileName);
        const content = await fileHandle.getFile();
        const newFileHandle = await parentDir.getFileHandle(newName, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        await parentDir.removeEntry(fileName);
      } else {
        // 重命名目录（通过复制后删除实现，因为 API 不支持直接重命名目录）
        const oldDirHandle = await parentDir.getDirectoryHandle(fileName);
        const newDirHandle = await parentDir.getDirectoryHandle(newName, { create: true });
        await this.copyDirectoryContents(oldDirHandle, newDirHandle);
        await parentDir.removeEntry(fileName, { recursive: true });
      }
    } catch (error) {
      throw new FileSystemError(`重命名失败: ${oldPath} -> ${newName}`, 'RENAME_FAILED', error);
    }
  }

  /**
   * 递归复制目录内容（内部方法）
   */
  private async copyDirectoryContents(
    src: FileSystemDirectoryHandle,
    dest: FileSystemDirectoryHandle
  ): Promise<void> {
    for await (const entry of src.values()) {
      if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        const destFile = await dest.getFileHandle(entry.name, { create: true });
        const writable = await destFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        const subDest = await dest.getDirectoryHandle(entry.name, { create: true });
        await this.copyDirectoryContents(entry as FileSystemDirectoryHandle, subDest);
      }
    }
  }

  /**
   * 获取文件句柄（支持路径）
   */
  private async getFileHandle(
    dirHandle: FileSystemDirectoryHandle,
    filePath: string
  ): Promise<FileSystemFileHandle> {
    const { parentDir, fileName } = await this.resolvePath(dirHandle, filePath, false);
    return await parentDir.getFileHandle(fileName);
  }

  /**
   * 获取目录句柄（支持路径）
   */
  private async getDirectoryHandle(
    dirHandle: FileSystemDirectoryHandle,
    dirPath: string
  ): Promise<FileSystemDirectoryHandle> {
    const pathParts = dirPath.split(/[/\\]/).filter(p => p);
    let currentHandle = dirHandle;

    for (const part of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(part);
    }

    return currentHandle;
  }

  /**
   * 解析路径，返回父目录句柄和文件名/目录名
   */
  private async resolvePath(
    rootHandle: FileSystemDirectoryHandle,
    fullPath: string,
    createMissingDirs: boolean
  ): Promise<{ parentDir: FileSystemDirectoryHandle; fileName: string }> {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    let dirPath = '';
    let fileName = normalizedPath;
    
    if (lastSlashIndex !== -1) {
      dirPath = normalizedPath.substring(0, lastSlashIndex);
      fileName = normalizedPath.substring(lastSlashIndex + 1);
    }
    
    let parentDir = rootHandle;
    
    if (dirPath) {
      const dirParts = dirPath.split('/').filter(p => p);
      for (const part of dirParts) {
        parentDir = await parentDir.getDirectoryHandle(part, { create: createMissingDirs });
      }
    }
    
    return { parentDir, fileName };
  }
}

// 导出便捷方法
export const fs = FileSystem.getInstance();

// 类型导出
export type {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
  FileSystemHandlePermissionDescriptor
};
```

## 使用示例

```typescript
// example.ts
import { fs, FileSystemError } from './file-system';

// 1. 基本使用 - 选择目录并操作
async function basicUsage() {
  try {
    // 请求用户选择目录
    const dirHandle = await fs.requestDirectory();
    
    // 写入文件
    await fs.writeFile(dirHandle, 'hello.txt', 'Hello World!');
    console.log('文件写入成功');
    
    // 读取文件
    const content = await fs.readFile(dirHandle, 'hello.txt');
    console.log('文件内容:', content);
    
    // 创建子目录
    await fs.createDirectory(dirHandle, 'subfolder');
    
    // 在子目录中写入文件
    await fs.writeFile(dirHandle, 'subfolder/data.json', JSON.stringify({ key: 'value' }));
    
    // 列出所有文件
    const files = await fs.listDirectory(dirHandle, '', { recursive: true });
    console.log('所有文件:', files);
    
  } catch (error) {
    if (error instanceof FileSystemError) {
      console.error('文件系统错误:', error.message, error.code);
    }
  }
}

// 2. 带持久化权限的使用
async function withPersistence() {
  // 第一次选择目录时传入 id
  const dirHandle = await fs.requestDirectory({ id: 'my-workspace' });
  
  // 下次访问时可以恢复
  const restoredHandle = await fs.restoreDirectory('my-workspace');
  if (restoredHandle) {
    const content = await fs.readFile(restoredHandle, 'saved-file.txt');
    console.log('恢复的文件:', content);
  }
}

// 3. 文件管理操作
async function fileManagement() {
  const dirHandle = await fs.requestDirectory();
  
  // 检查文件是否存在
  const exists = await fs.exists(dirHandle, 'config.json');
  console.log('config.json 存在:', exists);
  
  // 获取文件信息
  const info = await fs.getEntryInfo(dirHandle, 'data.txt');
  if (info) {
    console.log(`文件大小: ${info.size} bytes`);
    console.log(`最后修改: ${info.lastModified}`);
  }
  
  // 复制文件
  await fs.copyFile(dirHandle, 'source.txt', dirHandle, 'backup/source.txt');
  
  // 移动文件
  await fs.moveFile(dirHandle, 'temp.txt', dirHandle, 'archive/temp.txt');
  
  // 重命名
  await fs.rename(dirHandle, 'oldname.txt', 'newname.txt');
  
  // 删除文件
  await fs.deleteFile(dirHandle, 'unwanted.txt');
  
  // 删除目录（递归）
  await fs.deleteDirectory(dirHandle, 'old_folder', true);
}

// 4. 高级遍历和过滤
async function advancedListing() {
  const dirHandle = await fs.requestDirectory();
  
  // 只列出 JSON 文件，递归搜索
  const jsonFiles = await fs.listDirectory(dirHandle, '', {
    recursive: true,
    pattern: /\.json$/i,
    includeDirectories: false
  });
  
  console.log('所有 JSON 文件:', jsonFiles);
  
  // 遍历每个文件
  for (const file of jsonFiles) {
    const content = await fs.readFile(dirHandle, file.path);
    console.log(`${file.name}: ${content.substring(0, 50)}...`);
  }
}

// 5. 二进制文件处理
async function binaryFileHandling() {
  const dirHandle = await fs.requestDirectory();
  
  // 读取为 ArrayBuffer
  const buffer = await fs.readFileAsBuffer(dirHandle, 'image.png');
  console.log('图片大小:', buffer.byteLength);
  
  // 读取为 Blob
  const blob = await fs.readFileAsBlob(dirHandle, 'data.bin');
  
  // 写入二进制数据
  const uint8Array = new Uint8Array([72, 101, 108, 108, 111]);
  await fs.writeFile(dirHandle, 'binary.dat', uint8Array);
}

// 6. 错误处理示例
async function withErrorHandling() {
  try {
    const dirHandle = await fs.requestDirectory();
    await fs.readFile(dirHandle, 'nonexistent.txt');
  } catch (error) {
    if (error instanceof FileSystemError) {
      switch (error.code) {
        case 'USER_ABORTED':
          console.log('用户取消了操作');
          break;
        case 'PERMISSION_DENIED':
          console.log('权限被拒绝');
          break;
        case 'READ_FAILED':
          console.log('读取文件失败');
          break;
        default:
          console.log('其他错误:', error.message);
      }
    }
  }
}

// 运行示例
basicUsage();
```

## 特性说明

1. **完整的类型定义**：所有方法都有完整的 TypeScript 类型
2. **错误处理**：统一的 `FileSystemError` 类型，包含错误码
3. **权限管理**：支持持久化权限和临时权限
4. **路径解析**：支持 `/` 和 `\` 分隔符
5. **递归操作**：支持递归遍历、删除、复制
6. **多种读取方式**：支持文本、二进制、Blob 读取
7. **单例模式**：提供全局唯一的实例

这个封装可以直接在支持 File System Access API 的现代浏览器中使用。


这三个 API 的核心区别在于**使用场景**和**返回的对象类型**。下面从开发者视角详细对比：

---

## 📊 核心区别对比表

| 特性 | `showOpenFilePicker` | `showSaveFilePicker` | `showDirectoryPicker` |
|------|---------------------|---------------------|----------------------|
| **主要用途** | 打开一个或多个现有文件 | 保存新文件或覆盖现有文件 | 选择一个目录进行批量操作 |
| **返回对象** | `FileSystemFileHandle[]` | `FileSystemFileHandle` | `FileSystemDirectoryHandle` |
| **能否创建文件** | ❌ 不能 | ✅ 能（用户确认后创建） | ✅ 能（通过 `getFileHandle`） |
| **能否创建目录** | ❌ 不能 | ❌ 不能 | ✅ 能（通过 `getDirectoryHandle`） |
| **文件选择** | 支持多选 | 单选 | 不适用（选择目录） |
| **默认行为** | 读取文件内容 | 写入文件内容 | 读写目录下的所有文件 |
| **文件存在时** | 直接打开 | 询问是否覆盖 | 目录直接打开 |
| **用户取消** | 抛出 `AbortError` | 抛出 `AbortError` | 抛出 `AbortError` |

---

## 📁 1. `showOpenFilePicker` - 打开文件

**适用场景**：让用户选择一个或多个现有文件进行读取

### 基本用法
```typescript
// 选择单个文件
const [fileHandle] = await window.showOpenFilePicker();
const file = await fileHandle.getFile();
const content = await file.text();

// 选择多个文件（支持多选）
const handles = await window.showOpenFilePicker({
  multiple: true,  // 允许选择多个文件
  types: [{
    description: '文本文件',
    accept: { 'text/plain': ['.txt', '.md'] }
  }]
});

for (const handle of handles) {
  const file = await handle.getFile();
  console.log(file.name, file.size);
}
```

### 常用选项
```typescript
interface OpenFilePickerOptions {
  multiple?: boolean;        // 是否允许多选
  excludeAcceptAllOption?: boolean;  // 是否隐藏"所有文件"选项
  types?: Array<{           // 限制文件类型
    description?: string;
    accept: Record<string, string[]>;
  }>;
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}
```

### 特点
- 只能**读取**文件内容，不能修改
- 通过 `getFile()` 获取 `File` 对象
- 如需写入，需额外调用 `createWritable()`

---

## 💾 2. `showSaveFilePicker` - 保存文件

**适用场景**：让用户选择保存位置并写入内容（导出数据、下载文件等）

### 基本用法
```typescript
// 保存文本文件
const fileHandle = await window.showSaveFilePicker({
  suggestedName: 'untitled.txt',  // 建议的文件名
  types: [{
    description: '文本文件',
    accept: { 'text/plain': ['.txt'] }
  }]
});

const writable = await fileHandle.createWritable();
await writable.write('Hello, World!');
await writable.close();

// 保存 Blob（如图片）
const blob = await fetch('image.png').then(r => r.blob());
const writable = await fileHandle.createWritable();
await writable.write(blob);
await writable.close();
```

### 常用选项
```typescript
interface SaveFilePickerOptions {
  suggestedName?: string;     // 建议的文件名
  types?: Array<{...}>;       // 同 showOpenFilePicker
  startIn?: ...;              // 同 showOpenFilePicker
  excludeAcceptAllOption?: boolean;
}
```

### 特点
- 如果文件已存在，浏览器会自动询问是否覆盖
- 必须通过 `createWritable()` 写入内容
- 适合"导出"、"另存为"等场景

---

## 🗂️ 3. `showDirectoryPicker` - 选择目录

**适用场景**：批量操作整个目录（上传整个文件夹、同步本地项目等）

### 基本用法
```typescript
// 选择目录
const dirHandle = await window.showDirectoryPicker();

// 读取目录中的所有文件
for await (const entry of dirHandle.values()) {
  if (entry.kind === 'file') {
    const file = await entry.getFile();
    console.log(`文件: ${entry.name}, 大小: ${file.size}`);
  } else {
    console.log(`子目录: ${entry.name}`);
  }
}

// 在目录中创建文件
const fileHandle = await dirHandle.getFileHandle('new-file.txt', { create: true });
const writable = await fileHandle.createWritable();
await writable.write('新文件内容');
await writable.close();

// 创建子目录
const subDir = await dirHandle.getDirectoryHandle('subfolder', { create: true });
```

### 常用选项
```typescript
interface DirectoryPickerOptions {
  id?: string;               // 用于持久化权限的标识符
  startIn?: ...;             // 同 showOpenFilePicker
  mode?: 'read' | 'readwrite';  // 权限模式，默认 'read'
}
```

### 特点
- 返回目录句柄，可访问整个目录树
- 支持递归操作文件
- 需要用户明确授权读写权限

---

## 🎯 实战示例：三个 API 的组合使用

```typescript
class FileSystemHelper {
  /**
   * 场景1：用户上传配置文件
   */
  async uploadConfig(): Promise<string> {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: '配置文件',
        accept: { 'application/json': ['.json'] }
      }]
    });
    
    const file = await handle.getFile();
    return await file.text();
  }
  
  /**
   * 场景2：导出数据到文件
   */
  async exportData(data: object, filename: string): Promise<void> {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'JSON 文件',
        accept: { 'application/json': ['.json'] }
      }]
    });
    
    const json = JSON.stringify(data, null, 2);
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
  }
  
  /**
   * 场景3：上传整个项目文件夹
   */
  async uploadProject(): Promise<Map<string, string>> {
    const dirHandle = await window.showDirectoryPicker();
    const files = new Map<string, string>();
    
    // 递归读取所有文件
    const readDir = async (handle: FileSystemDirectoryHandle, path: string = '') => {
      for await (const entry of handle.values()) {
        const fullPath = path ? `${path}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const content = await file.text();
          files.set(fullPath, content);
        } else {
          await readDir(entry, fullPath);
        }
      }
    };
    
    await readDir(dirHandle);
    return files;
  }
  
  /**
   * 场景4：批量处理图片（打开 + 保存）
   */
  async batchProcessImages(): Promise<void> {
    // 选择多张图片
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: [{
        description: '图片',
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
      }]
    });
    
    // 处理每张图片
    for (const handle of handles) {
      const file = await handle.getFile();
      const processed = await this.processImage(file);
      
      // 保存处理后的图片
      const saveHandle = await window.showSaveFilePicker({
        suggestedName: `processed_${handle.name}`,
        types: [{ accept: { 'image/png': ['.png'] } }]
      });
      
      const writable = await saveHandle.createWritable();
      await writable.write(processed);
      await writable.close();
    }
  }
  
  private async processImage(file: File): Promise<Blob> {
    // 图片处理逻辑
    return file; // 示例返回原文件
  }
}
```

---

## ⚠️ 重要注意事项

### 1. 安全性限制
这些 API **只能在安全上下文**中使用：
- ✅ `https://` 或 `localhost`
- ❌ `http://`（非 localhost）
- ❌ `file://` 协议

### 2. 用户交互要求
所有 picker 方法**必须由用户手势触发**（如点击事件）：
```typescript
// ✅ 正确
button.addEventListener('click', async () => {
  const handle = await window.showOpenFilePicker();
});

// ❌ 错误 - 页面加载时自动调用会被阻止
window.addEventListener('load', async () => {
  const handle = await window.showOpenFilePicker(); // 抛出错误
});
```

### 3. 错误处理
```typescript
try {
  const handle = await window.showOpenFilePicker();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('用户取消了操作');
  } else {
    console.error('发生错误:', error);
  }
}
```

### 4. 权限管理
- `showOpenFilePicker` 和 `showSaveFilePicker`：每次都需要用户交互（但返回的 handle 可存储到 IndexedDB）
- `showDirectoryPicker`：支持持久化权限，配合 `id` 选项和 IndexedDB 使用

---

## 🎯 选择建议

| 需求 | 推荐 API |
|------|---------|
| 上传头像/单个文件 | `showOpenFilePicker` |
| 批量上传图片 | `showOpenFilePicker` + `multiple: true` |
| 导出报表/下载文件 | `showSaveFilePicker` |
| 上传整个项目文件夹 | `showDirectoryPicker` |
| 文件管理器类应用 | `showDirectoryPicker` |
| 编辑器打开文件 | `showOpenFilePicker` |
| 编辑器保存文件 | `showSaveFilePicker` |

希望这个对比能帮你快速选择合适的 API！



监听本地目录变化，现在已经有了官方推荐的现代方案。通过 **File System Observer API**，你的 Web 应用可以像本地 IDE 一样，在文件或目录发生变动时立即收到通知，而不必再使用效率较低的轮询方式。

以下是这个新特性的详细说明和用法：

---

### 🚀 核心方案：File System Observer API

这是一个专门为 Web 平台设计的、用于监听文件和目录变化的 API。Chrome 从 129 版本开始支持它的“源试用”，标志着 Web 应用的文件处理能力又向前迈进了一大步。

#### 1. 如何工作
它的工作流程非常清晰，主要包含三个步骤：

1.  **创建观察者**：使用 `new FileSystemObserver()` 初始化一个观察器实例，并传入一个回调函数。
2.  **开始观察**：调用观察者实例的 `observe()` 方法，并将你通过 `showDirectoryPicker` 等方法获得的 `FileSystemHandle` (文件或目录句柄) 传递给它。
3.  **处理变化**：当被观察的文件或目录发生变化时，你定义的回调函数就会被触发，并接收一个包含变化详情的 `records` 数组。

#### 2. 代码示例
```javascript
// 1. 定义回调函数，处理变化
const callback = (records, observer) => {
  for (const record of records) {
    console.log('检测到变化:', record);
    // 你可以根据 record.type 来做不同的处理
    if (record.type === 'modified') {
      console.log(`文件已修改: ${record.relativePathComponents.join('/')}`);
    } else if (record.type === 'appeared') {
      console.log(`新文件/目录已添加: ${record.relativePathComponents.join('/')}`);
    }
  }
};

// 2. 创建观察者实例
const observer = new FileSystemObserver(callback);

// 3. 获取一个目录句柄 (用户授权)
const directoryHandle = await window.showDirectoryPicker();

// 4. 开始观察目录
// 设置 recursive: true 可以递归监听所有子目录和文件的变化
await observer.observe(directoryHandle, { recursive: true });
```

#### 3. 变化记录详解
回调函数接收的 `record` 对象包含了丰富的信息，可以帮助你精确地做出响应。

| 字段 | 说明 | 类型 |
| :--- | :--- | :--- |
| **`type`** | **变化类型**，是最关键的字段。可以是 `"appeared"` (新增)、`"disappeared"` (删除)、`"modified"` (修改)、`"moved"` (移动)、`"unknown"` (未知) 或 `"errored"` (错误)。 | `string` |
| **`changedHandle`** | 发生变化的**文件或目录的句柄**。对于 `"disappeared"` 等情况，此值可能为 `null`。 | `FileSystemHandle` |
| **`relativePathComponents`** | 一个字符串数组，表示变化对象相对于**被观察根目录**的路径。例如 `['folder', 'file.txt']`。 | `Array<string>` |
| **`root`** | **被观察的根目录**的句柄。 | `FileSystemHandle` |
| **`relativePathMovedFrom`** | 当 `type` 为 `"moved"` 时，此数组表示文件或目录**移动前的旧路径**。 | `Array<string>` |

#### 4. 最佳实践与注意事项
- **⚠️ 实验性技术**：请务必注意，这是一个**实验性、非标准**的 API。在生产环境中使用前，请仔细检查[浏览器兼容性表](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemObserver#browser_compatibility)。
- **🔐 安全上下文**：此 API 仅在如 `https://` 或 `localhost` 这样的**安全上下文**中可用。
- **🧩 功能检测**：在使用前，最好先判断浏览器是否支持：
    ```javascript
    if ('FileSystemObserver' in window) {
      // 支持，可以使用 FileSystemObserver
    } else {
      // 不支持，需要提示用户或使用降级方案（如轮询）
    }
    ```
- **🗂️ 处理 "unknown" 类型**：当操作系统无法提供详细的变化信息时，API 可能会返回 `type: "unknown"` 的记录。此时，作为降级策略，你可以主动轮询整个目录树来获取最新状态。

---

### 📜 旧方案回顾：轮询 (Polling)

在 `FileSystemObserver` 出现之前，这是唯一可行的方案。其核心思想是**每隔一段时间（例如5秒）读取文件内容或元数据，并与之前的状态进行比较**，从而判断文件是否发生变化。

**缺点**：这种方式效率不高，会带来不必要的 CPU 和磁盘 I/O 开销，实时性也受限于轮询间隔。因此，**推荐优先使用 File System Observer API**，仅在 API 不可用或需要处理 "unknown" 变化时，再将轮询作为备用方案。



有的，目前社区已经有不少成熟的封装库，可以帮你省去直接处理底层 API 的麻烦。

我根据它们解决的核心问题，把它们分成了两大类，你可以根据自己的需求来选择：

---

### 1. 通用文件操作库

这些库主要用于解决**打开、保存、读写**文件和目录的问题，覆盖了 `showOpenFilePicker`、`showSaveFilePicker`、`showDirectoryPicker` 等核心 API。

#### 📦 browser-fs-access

一个非常优秀的“Ponyfill”库，它会自动检测浏览器是否支持 File System Access API。如果支持，就使用强大的原生 API；如果不支持，就会无缝降级到传统的 `<input type="file">` 和 `<a download>` 方案。

- **核心价值**：提供统一的 API，一套代码兼容新旧浏览器。
- **主要功能**：
    - `fileOpen`：打开一个或多个文件。
    - `directoryOpen`：打开目录，并可选择递归读取所有文件。
    - `fileSave`：保存文件，支持流式写入大文件。
- **安装**：`npm install --save browser-fs-access` 

```typescript
import { fileOpen, directoryOpen, fileSave } from 'browser-fs-access';

// 打开图片文件
const blob = await fileOpen({
    mimeTypes: ['image/*'],
    multiple: false,
});

// 打开目录（递归读取所有文件）
const blobs = await directoryOpen({
    recursive: true,
});

// 保存文件
await fileSave(blob, { fileName: 'my-image.png' });
```

#### 🌐 universal-fs

这是一个设计更现代化的库，主打**跨平台**。无论是在 Node.js 环境还是浏览器中，它都提供完全一致的 API。

- **核心价值**：Write once, run everywhere。代码无需修改即可在服务端和客户端运行。
- **主要功能**：
    - `ufs.readFile` / `ufs.writeFile`：核心读写方法。
    - 智能输入：在浏览器中，可以直接传入 `File` 或 `Blob` 对象进行读取。
    - 格式感知：支持 `text`、`json`、`arrayBuffer` 等多种格式，并有完整的 TypeScript 类型推断。
- **安装**：`npm install @jeffy-g/universal-fs` 

```typescript
import { ufs } from '@jeffy-g/universal-fs';

// 在浏览器中写入文件（触发下载）
await ufs.writeText('hello.txt', 'Hello, World!');

// 从用户选择的文件中读取JSON
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const jsonData = await ufs.readJSON<{ name: string }>(file);
```

#### 🗄️ Filer.js

这是一个功能更重的解决方案，它在浏览器中实现了一个**虚拟文件系统**。

- **核心价值**：提供一个完整的、类似 POSIX 标准的文件系统。
- **主要功能**：拥有 `fs.mkdir`、`fs.writeFile`、`fs.readdir` 等与 Node.js `fs` 模块高度相似的 API。其底层存储基于 IndexedDB，因此数据持久性好。
- **安装**：`npm install @ebidel/filer-js` 

```typescript
import * as Filer from '@ebidel/filer-js';

const fs = new Filer.FileSystem();

// 创建目录并写入文件
fs.mkdir('/data', (err) => {
  if (err) throw err;
  fs.writeFile('/data/config.json', JSON.stringify({ theme: 'dark' }), (err) => {
    console.log('文件已保存');
  });
});
```

---

### 2. 监听目录变化库

为了解决 `FileSystemObserver` API 兼容性不佳且尚未标准化的问题 ，有库提供了封装好的监听功能。

#### 👁️ opfs-worker

这个库非常强大，它不仅仅能监听文件变化，更是一个基于 OPFS 的、API 设计向 Node.js 看齐的完整文件系统。

- **核心价值**：高性能 + 实时监听。
- **主要功能**：
    - **文件监听**：提供 `watch` 方法，支持 `recursive`、`include`/`exclude` 模式过滤，并通过 `BroadcastChannel` 发送事件，没有轮询延迟 。
    - **完整 API**：`readFile`、`writeFile`、`mkdir`、`copy`、`stat` 等。
    - **架构优势**：基于 Web Worker，文件操作在后台线程执行，不阻塞主线程。
- **安装**：`npm install opfs-worker` 

```typescript
import { createWorker } from 'opfs-worker';

const fs = await createWorker();
const channel = new BroadcastChannel('fs-events');

// 开始监听 /docs 目录下的所有 JSON 文件变化
await fs.watch('/docs', {
    recursive: true,
    include: ['*.json']
});

channel.onmessage = (event) => {
    console.log('文件变化:', event.data); // 事件包含 path, type (add/change/unlink) 等
};
```

---

### 3. 面向现代浏览器的专用库

如果不需要兼容旧浏览器，且主要目标是为现代 Web 应用提供强大的文件系统能力，可以考虑以下库。

#### 🎯 happy-opfs

这是一个 API 设计非常现代化的库，提供了 Deno 风格的 `Result` 类型（类似 Rust）来处理错误，而不是使用 `try-catch`。

- **核心价值**：现代化的 API 设计 + 完整的 OPFS 能力。
- **主要功能**：
    - **Result 类型**：所有异步方法都返回 `Result<T, E>`，强制你处理错误，代码更健壮 。
    - **丰富功能**：除了基础的 CRUD，还内置了 `zip`/`unzip`、`downloadFile`/`uploadFile`、以及所有操作的同步版本（Sync API）。
- **安装**：`npm install happy-opfs` 

```typescript
import { readTextFile, writeFile } from 'happy-opfs';

// 使用 .inspect 优雅地处理结果
(await readTextFile('/data.txt')).inspect(
  (content) => console.log('文件内容:', content),
  (error) => console.error('读取失败:', error)
);
```

#### 🧩 pure/fs

这是一个注重**特性检测**和**降级**的库，可以清晰地告知你当前运行环境支持哪些文件操作。

- **核心价值**：让你精确了解当前环境的能力（如是否支持写入、是否支持实时监听）。
- **主要功能**：
    - `fsGetSupportStatus()`：检测当前使用的具体实现（是原生 API、FileEntry 还是普通的 File）。
    - 支持从拖放（Drag-and-Drop）操作中挂载文件系统。
- **安装**：`jsr add @pistonite/pure` 

---

### 总结与选型建议

| 如果你需要... | 推荐库 | 原因 |
| :--- | :--- | :--- |
| **兼容旧浏览器，一套代码搞定** | `browser-fs-access` | 完美的渐进增强方案，API 简洁。 |
| **代码需要同时跑在 Node.js 和浏览器** | `@jeffy-g/universal-fs` | 真正的跨平台抽象层。 |
| **类似 Node.js 的完整虚拟文件系统** | `Filer.js` | 功能全面，历史悠久，适用于复杂应用。 |
| **高性能 + 监听文件变化** | `opfs-worker` | Worker 架构不卡 UI，`watch` 功能是其亮点。 |
| **追求现代、健壮的 API 设计** | `happy-opfs` | Deno 风格的 Result 类型，错误处理更优雅。 |

这些库中，你是更看重旧浏览器的兼容性，还是追求最新的 API 和性能？告诉我你的具体场景，我可以帮你推荐最合适的一个。