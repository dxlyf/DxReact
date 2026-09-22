/**
 * 错误处理模块。
 *
 * 设计目标：把三种 API 完全不同的错误形态（WebGL 的 getError 码、WebGPU 的
 * GPUValidationError/Promise 拒绝、以及库自身的描述符校验失败）收敛成同一种
 * 可读、可定位、可上报的 GraphicsError。
 */
import { GraphicsApi } from './types.js';

export enum ErrorCode {
  /** 描述符字段缺失或非法 */
  InvalidDescriptor = 'INVALID_DESCRIPTOR',
  /** 数据类型与声明不符（例如给 F32x4 的 uniform 传了 3 个数） */
  TypeMismatch = 'TYPE_MISMATCH',
  /** 资源已被销毁却仍被使用 */
  ResourceDisposed = 'RESOURCE_DISPOSED',
  /** 资源标识符的 kind 与目标不符 */
  KindMismatch = 'KIND_MISMATCH',
  /** 设备销毁时仍有存活资源 */
  ResourceLeak = 'RESOURCE_LEAK',
  /** 原生 API 报错 */
  NativeAPIError = 'NATIVE_API_ERROR',
  ShaderCompileError = 'SHADER_COMPILE_ERROR',
  ProgramLinkError = 'PROGRAM_LINK_ERROR',
  PipelineCreationError = 'PIPELINE_CREATION_ERROR',
  /** 当前后端不支持该能力 */
  Unsupported = 'UNSUPPORTED_FEATURE',
  /** 上下文丢失或设备丢失 */
  ContextLost = 'CONTEXT_LOST',
  /** 绑定顺序/绑定冲突 */
  BindingError = 'BINDING_ERROR',
}

export interface GraphicsErrorOptions {
  code: ErrorCode;
  api?: GraphicsApi | 'core';
  /** 触发错误的原生调用名，例如 `drawElements` */
  call?: string;
  /** 相关资源的标识符文本 */
  resource?: string;
  /** 解决建议 */
  hint?: string;
  /** 原始日志，例如着色器编译输出 */
  details?: string;
  cause?: unknown;
}

export class GraphicsError extends Error {
  readonly code: ErrorCode;
  readonly api: GraphicsApi | 'core';
  readonly call?: string;
  readonly resource?: string;
  readonly hint?: string;
  readonly details?: string;

  constructor(message: string, options: GraphicsErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'GraphicsError';
    this.code = options.code;
    this.api = options.api ?? 'core';
    this.call = options.call;
    this.resource = options.resource;
    this.hint = options.hint;
    this.details = options.details;
  }

  /** 多行可读文本，用于 console 输出或上报。 */
  format(): string {
    const lines = [`[${this.api}] ${this.code}: ${this.message}`];
    if (this.resource) lines.push(`  resource: ${this.resource}`);
    if (this.call) lines.push(`  native call: ${this.call}`);
    if (this.hint) lines.push(`  hint: ${this.hint}`);
    if (this.details) lines.push('  details:', indent(this.details));
    return lines.join('\n');
  }
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
}

export function isGraphicsError(error: unknown): error is GraphicsError {
  return error instanceof GraphicsError;
}

export type ErrorSeverity = 'warning' | 'error';

export interface ReportedError {
  severity: ErrorSeverity;
  error: unknown;
  graphics: GraphicsError;
  timestamp: number;
}

export type ErrorListener = (reported: ReportedError) => void;

/**
 * 错误上报中枢。
 *
 * 库内部所有非致命问题（例如 WebGL1 下要求 UBO）都走这里，
 * 由使用方决定是抛异常、降级还是仅打日志；致命问题仍然直接抛 GraphicsError。
 */
export class ErrorReporter {
  private readonly listeners = new Set<ErrorListener>();
  private records: ReportedError[] = [];
  private keepRecords = 64;

  /** 注册监听器，返回取消函数。 */
  onError(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  report(error: unknown, severity: ErrorSeverity = 'error'): ReportedError {
    const graphics = toGraphicsError(error, 'core');
    const reported: ReportedError = { severity, error, graphics, timestamp: Date.now() };
    this.records.push(reported);
    if (this.records.length > this.keepRecords) this.records.shift();
    if (this.listeners.size === 0) {
      // 没有监听器时保持原生的可见性，避免错误被静默吞掉
      if (severity === 'error') console.error(graphics.format());
      else console.warn(graphics.format());
    } else {
      for (const listener of this.listeners) listener(reported);
    }
    return reported;
  }

  /** 历史记录，便于崩溃时回放。 */
  history(): readonly ReportedError[] {
    return this.records;
  }

  clear(): void {
    this.records = [];
  }
}

/** 全局上报中枢。 */
export const errorReporter = new ErrorReporter();

/** 把任意抛出物规范化为 GraphicsError。 */
export function toGraphicsError(error: unknown, api: GraphicsApi | 'core'): GraphicsError {
  if (isGraphicsError(error)) return error;
  if (error instanceof Error) {
    return new GraphicsError(error.message, { code: ErrorCode.NativeAPIError, api, cause: error });
  }
  return new GraphicsError(String(error), { code: ErrorCode.NativeAPIError, api, cause: error });
}

export function invalidDescriptor(message: string, options: Partial<GraphicsErrorOptions> = {}): GraphicsError {
  return new GraphicsError(message, { code: ErrorCode.InvalidDescriptor, ...options });
}

export function typeMismatch(message: string, options: Partial<GraphicsErrorOptions> = {}): GraphicsError {
  return new GraphicsError(message, { code: ErrorCode.TypeMismatch, ...options });
}

export function unsupported(message: string, options: Partial<GraphicsErrorOptions> = {}): GraphicsError {
  return new GraphicsError(message, { code: ErrorCode.Unsupported, ...options });
}

export function disposedError(resource: string, call: string): GraphicsError {
  return new GraphicsError(`${resource} 已被销毁，无法执行 ${call}`, {
    code: ErrorCode.ResourceDisposed,
    resource,
    call,
    hint: '资源销毁后其标识符即失效；请检查是否在 destroy() 之后仍然提交绘制。',
  });
}
