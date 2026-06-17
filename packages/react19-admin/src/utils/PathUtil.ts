/**
 * 浏览器端路径工具类，模拟 Node.js 的 path 模块
 * 注意：浏览器环境没有文件系统，因此不包含 fs 相关功能
 */
class PathUtil {
    // 平台特定的路径分隔符，浏览器环境统一使用 '/'
    readonly sep: string = '/';
    readonly delimiter: string = ':';
    readonly posix: PathUtil = this;
    readonly win32: PathUtil = this;

    /**
     * 规范化路径，解析 '..' 和 '.' 片段
     * @param path 待规范化的路径字符串
     * @returns 规范化后的路径
     */
    normalize(path: string): string {
        if (!path) return '.';

        // 检查是否为绝对路径
        const isAbsolute = this.isAbsolute(path);
        // 分割路径
        const parts = path.split(this.sep);
        // 过滤空字符串和 '.'
        const filtered: string[] = [];
        for (const part of parts) {
            if (part === '' || part === '.') continue;
            if (part === '..') {
                // 弹出上一个有效段（如果存在且不是 '..'）
                if (filtered.length > 0 && filtered[filtered.length - 1] !== '..') {
                    filtered.pop();
                } else {
                    // 如果当前已经是根目录或绝对路径开头，保留 '..'
                    filtered.push(part);
                }
            } else {
                filtered.push(part);
            }
        }

        // 如果过滤后为空，返回 '.' 或 '/' 或 '..'
        if (filtered.length === 0) {
            return isAbsolute ? '/' : '.';
        }

        // 构建结果路径
        let result = filtered.join(this.sep);
        if (isAbsolute) {
            result = '/' + result;
        }
        // 保留结尾的 '/'
        if (path.endsWith('/')) {
            result += '/';
        }
        return result;
    }

    /**
     * 连接多个路径片段
     * @param paths 路径片段数组
     * @returns 连接后的规范化路径
     */
    join(...paths: string[]): string {
        if (paths.length === 0) return '.';
        // 过滤空字符串并合并
        const filtered = paths.filter(p => p !== '');
        if (filtered.length === 0) return '.';

        // 如果第一个路径是绝对路径，作为起点
        let result = filtered[0];
        for (let i = 1; i < filtered.length; i++) {
            const part = filtered[i];
            if (part.startsWith('/')) {
                // 如果片段以 '/' 开头，则替换之前的路径
                result = part;
            } else {
                // 添加分隔符连接
                result = result.endsWith('/') ? result + part : result + '/' + part;
            }
        }

        return this.normalize(result);
    }

    /**
     * 获取路径的目录名
     * @param path 路径字符串
     * @returns 目录名
     */
    dirname(path: string): string {
        if (!path) return '.';
        // 处理根路径情况
        if (path === '/' || path === '\\') return '/';

        // 去除尾部分隔符
        let normalized = path.replace(/[\/\\]+$/, '');
        if (normalized === '') return '/';

        const lastSepIndex = normalized.lastIndexOf(this.sep);
        if (lastSepIndex === -1) return '.';

        // 如果目录部分为空，返回 '/'
        const dir = normalized.substring(0, lastSepIndex);
        return dir === '' ? '/' : dir;
    }

    /**
     * 获取路径的最后一部分（文件名或目录名）
     * @param path 路径字符串
     * @param ext 可选扩展名，如果提供则移除扩展名
     * @returns 路径的最后一部分
     */
    basename(path: string, ext?: string): string {
        if (!path) return '';

        // 去除尾部分隔符
        let normalized = path.replace(/[\/\\]+$/, '');
        if (normalized === '') return '';

        const lastSepIndex = normalized.lastIndexOf(this.sep);
        let base = lastSepIndex !== -1 ? normalized.substring(lastSepIndex + 1) : normalized;

        // 如果提供了扩展名，且base以扩展名结尾，移除扩展名
        if (ext && base.endsWith(ext) && base !== ext) {
            base = base.substring(0, base.length - ext.length);
        }

        return base;
    }

    /**
     * 获取文件的扩展名
     * @param path 路径字符串
     * @returns 扩展名（包含 '.'）
     */
    extname(path: string): string {
        if (!path) return '';

        // 获取basename，因为扩展名只存在于文件名中
        const base = this.basename(path);
        if (base === '' || base === '.' || base === '..') return '';

        const lastDotIndex = base.lastIndexOf('.');
        // 如果点号在开头（隐藏文件），返回空字符串
        if (lastDotIndex <= 0) return '';

        return base.substring(lastDotIndex);
    }

    /**
     * 判断路径是否为绝对路径
     * @param path 路径字符串
     * @returns 是否为绝对路径
     */
    isAbsolute(path: string): boolean {
        if (!path) return false;
        // 浏览器环境判断：以 '/' 开头的路径为绝对路径
        // 同时也支持 '//' 开头的协议无关路径
        return path.startsWith('/') || path.startsWith('\\');
    }

    /**
     * 解析路径为对象
     * @param path 路径字符串
     * @returns 包含 root, dir, base, ext, name 的对象
     */
    parse(path: string): {
        root: string;
        dir: string;
        base: string;
        ext: string;
        name: string;
    } {
        if (!path) {
            return { root: '', dir: '', base: '', ext: '', name: '' };
        }

        const isAbs = this.isAbsolute(path);
        const root = isAbs ? '/' : '';

        // 去除尾部分隔符
        const normalized = path.replace(/[\/\\]+$/, '') || '/';

        // 分割路径为各段
        const parts = normalized.split(this.sep).filter(p => p !== '');

        if (parts.length === 0) {
            return { root: '/', dir: '/', base: '', ext: '', name: '' };
        }

        const base = parts[parts.length - 1] || '';
        const ext = this.extname(base);
        const name = ext ? base.substring(0, base.length - ext.length) : base;

        // 构建 dir
        let dir = root;
        if (parts.length > 1) {
            dir += parts.slice(0, -1).join(this.sep);
        } else if (isAbs) {
            dir = root;
        } else {
            dir = '.';
        }

        return { root, dir, base, ext, name };
    }

    /**
     * 将路径对象转换为字符串
     * @param pathObject 路径对象
     * @returns 路径字符串
     */
    format(pathObject: {
        root?: string;
        dir?: string;
        base?: string;
        ext?: string;
        name?: string;
    }): string {
        const { root = '', dir = '', base = '', ext = '', name = '' } = pathObject;

        // 如果提供了 base，使用 base
        if (base) {
            // 如果提供了 dir，拼接 dir 和 base
            if (dir) {
                const dirNormalized = dir.endsWith(this.sep) ? dir : dir + this.sep;
                return dirNormalized + base;
            }
            // 如果提供了 root，拼接 root 和 base
            if (root) {
                const rootNormalized = root.endsWith(this.sep) ? root : root + this.sep;
                return rootNormalized + base;
            }
            // 只有 base
            return base;
        }

        // 没有 base，使用 name + ext
        const fileName = (name || '') + (ext || '');
        if (dir) {
            const dirNormalized = dir.endsWith(this.sep) ? dir : dir + this.sep;
            return dirNormalized + fileName;
        }
        if (root) {
            const rootNormalized = root.endsWith(this.sep) ? root : root + this.sep;
            return rootNormalized + fileName;
        }
        return fileName || '.';
    }

    /**
   * 解析路径序列，生成绝对路径
   * 从右到左处理，直到构造出绝对路径
   * @param paths 路径片段序列
   * @returns 绝对路径
   */
    resolve(...paths: string[]): string {
        if (paths.length === 0) return '';

        // 从右向左处理
        let resolvedPath = '';
        let isAbsolutePath = false;

        // 从最后一个路径开始向前遍历
        for (let i = paths.length - 1; i >= 0; i--) {
            const path = paths[i];
            if (!path) continue; // 忽略空字符串

            // 如果当前路径是绝对路径，重置 resolvedPath
            if (this.isAbsolute(path)) {
                resolvedPath = path;
                isAbsolutePath = true;
                break;
            }

            // 否则拼接到前面
            if (resolvedPath) {
                // 确保路径拼接正确
                if (path.endsWith('/') || path.endsWith('\\')) {
                    resolvedPath = path + resolvedPath;
                } else {
                    resolvedPath = path + '/' + resolvedPath;
                }
            } else {
                resolvedPath = path;
            }
        }

        // 如果最终不是绝对路径，使用当前页面路径作为基础
        if (!isAbsolutePath) {
            const basePath = this.getBasePath();
            resolvedPath = basePath.endsWith('/') || basePath.endsWith('\\')
                ? basePath + resolvedPath
                : basePath + '/' + resolvedPath;
        }

        // 规范化并去除尾部分隔符
        let normalized = this.normalize(resolvedPath);
        // 去除尾部分隔符（保留根路径 '/'）
        if (normalized.length > 1 && (normalized.endsWith('/') || normalized.endsWith('\\'))) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }

    /**
     * 获取当前页面的基础路径
     * @returns 当前页面的目录路径
     */
    private getBasePath(): string {
        // 使用当前页面 URL 的路径部分
        const pathname = window.location.pathname;
        // 如果是文件路径，取目录部分；否则直接使用
        if (pathname.includes('/')) {
            // 如果路径以 / 结尾，认为是目录
            if (pathname.endsWith('/')) {
                return pathname;
            }
            // 否则去除最后一段（文件名）
            const lastSlashIndex = pathname.lastIndexOf('/');
            if (lastSlashIndex === 0) {
                return '/';
            }
            return pathname.substring(0, lastSlashIndex + 1);
        }
        return '/';
    }

    /**
     * 判断路径是否包含 ".."
     * @param path 路径字符串
     * @returns 是否包含 ".."
     */
    containsDotDot(path: string): boolean {
        if (!path) return false;
        // 匹配 ".." 作为独立路径段
        return /\b\.\.\b/.test(path) || path.includes('/../') || path.includes('\\..\\') ||
            path.startsWith('../') || path.startsWith('..\\') ||
            path.endsWith('/..') || path.endsWith('\\..');
    }

    /**
     * 获取相对路径
     * @param from 起始路径
     * @param to 目标路径
     * @returns 相对路径
     */
    relative(from: string, to: string): string {
        if (!from || !to) return '';

        // 规范化两个路径
        const fromParts = this.normalize(from).split(this.sep);
        const toParts = this.normalize(to).split(this.sep);

        // 找到共同前缀
        let commonLength = 0;
        const minLength = Math.min(fromParts.length, toParts.length);
        for (let i = 0; i < minLength; i++) {
            if (fromParts[i] === toParts[i]) {
                commonLength++;
            } else {
                break;
            }
        }

        // 如果共同前缀长度为0，返回目标路径的绝对路径
        if (commonLength === 0) {
            return this.normalize(to);
        }

        // 构建相对路径
        const upCount = fromParts.length - commonLength;
        const resultParts: string[] = [];
        for (let i = 0; i < upCount; i++) {
            resultParts.push('..');
        }
        for (let i = commonLength; i < toParts.length; i++) {
            resultParts.push(toParts[i]);
        }

        const result = resultParts.join(this.sep);
        return result || '.';
    }

    /**
     * 将路径转换为绝对URL（基于当前页面）
     * @param path 路径字符串
     * @returns 绝对URL字符串
     */
    toAbsoluteUrl(path: string): string {
        if (!path) return window.location.href;
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
            return path;
        }
        // 使用 a 标签构建绝对 URL
        const a = document.createElement('a');
        a.href = path;
        return a.href;
    }
}

// 导出单例实例
export const path = new PathUtil();
export default path;