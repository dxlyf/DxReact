/**
 * 调试模块。
 *
 * 提供三类能力，全部可独立开关，关闭时不产生任何额外开销（走布尔短路而非字符串拼接）：
 *  1. 描述符校验：创建资源时检查字段合法性（validateDescriptors）
 *  2. 原生调用追踪：环形记录最近 N 次原生调用，出错时可定位到具体调用（logCommands）
 *  3. 原生错误检查：每次原生调用后检查错误状态并抛出 GraphicsError（checkNativeErrors）
 */
import { GraphicsError, ErrorCode, type ErrorSeverity } from './errors.js';

export interface DebugConfig {
  /** 总开关。false 时下列所有子开关都失效 */
  enabled: boolean;
  validateDescriptors: boolean;
  logCommands: boolean;
  checkNativeErrors: boolean;
  /** 追踪泄漏：Device.destroy() 时若仍有存活资源则报告 */
  trackResourceLeaks: boolean;
  /** 环形缓冲容量 */
  commandHistorySize: number;
  /** 自定义日志输出，默认 console.log */
  log: (message: string) => void;
}

export function defaultDebugConfig(enabled = false): DebugConfig {
  return {
    enabled,
    validateDescriptors: enabled,
    logCommands: false,
    checkNativeErrors: enabled,
    trackResourceLeaks: enabled,
    commandHistorySize: 32,
    log: (message: string) => console.log(message),
  };
}

export interface CommandRecord {
  api: string;
  call: string;
  args: readonly unknown[];
  /** 出错的调用会被标记，便于定位 */
  error?: string;
}

/** 最近 N 次原生调用的环形缓冲。 */
export class CommandRecorder {
  private readonly buffer: CommandRecord[] = [];
  private cursor = 0;
  private size: number;

  constructor(size: number) {
    this.size = Math.max(1, size);
  }

  record(api: string, call: string, args: readonly unknown[]): void {
    const entry: CommandRecord = { api, call, args };
    if (this.buffer.length < this.size) {
      this.buffer.push(entry);
    } else {
      this.buffer[this.cursor] = entry;
      this.cursor = (this.cursor + 1) % this.size;
    }
  }

  /** 把最近一次调用标记为出错。 */
  markLastError(message: string): void {
    const last = this.recent(1)[0];
    if (last) last.error = message;
  }

  recent(count = this.size): CommandRecord[] {
    const ordered = this.buffer.length < this.size ? [...this.buffer] : this.buffer.slice(this.cursor).concat(this.buffer.slice(0, this.cursor));
    return ordered.slice(-count);
  }

  format(count = 8): string {
    return this.recent(count)
      .map((entry) => {
        const args = entry.args.map((arg) => formatArg(arg)).join(', ');
        return `  ${entry.api}.${entry.call}(${args})${entry.error ? ` -> ${entry.error}` : ''}`;
      })
      .join('\n');
  }

  clear(): void {
    this.buffer.length = 0;
    this.cursor = 0;
  }
}

function formatArg(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return String(value);
  if (ArrayBuffer.isView(value)) return `<${value.constructor.name} len=${(value as unknown as { length: number }).length}>`;
  if (typeof value === 'object') {
    const label = (value as { describe?: () => string }).describe;
    if (typeof label === 'function') return label.call(value);
    const handle = (value as { handle?: { kind: string; id: number } }).handle;
    if (handle) return `${handle.kind}#${handle.id}`;
  }
  return Object.prototype.toString.call(value);
}

/** 构造原生 API 报错。带上最近调用栈，能直接指出是哪一步出了问题。 */
export function nativeError(
  message: string,
  options: { api: string; call?: string; code?: string; recorder?: CommandRecorder; severity?: ErrorSeverity },
): GraphicsError {
  const details = options.recorder ? `最近的原生调用:\n${options.recorder.format(6)}` : undefined;
  return new GraphicsError(message, {
    code: ErrorCode.NativeAPIError,
    api: options.api as never,
    call: options.call,
    hint: '该错误来自底层图形 API；开启 debug.logCommands 可打印完整调用序列。',
    details: options.code ? `native code: ${options.code}\n${details ?? ''}`.trimEnd() : details,
  });
}
