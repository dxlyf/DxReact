以下是使用 TypeScript 编写的完整请求/响应双拦截器，包含完整的类型定义和示例：

## 📦 TypeScript 版本拦截器

### 1. **类型定义文件**

```typescript
// types.ts
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options';
export type RequestType = 'fetch' | 'xhr' | 'all';

export interface RequestContext {
  url: string;
  method: HttpMethod;
  type: RequestType;
  headers: Record<string, string>;
  body: any;
  config?: RequestInit;
  originalRequest?: Request | string;
  timestamp: number;
  [key: string]: any;
}

export interface ResponseContext extends RequestContext {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
  redirected: boolean;
  type: ResponseType;
  url: string;
  response?: any;
  responseText?: string;
  responseXML?: Document | null;
  readyState?: number;
  timeout?: number;
  withCredentials?: boolean;
  error?: string;
}

export interface InterceptorRule<T = RequestContext | Response> {
  match: string | RegExp | ((url: string) => boolean);
  method?: HttpMethod | HttpMethod[];
  type?: RequestType;
  handler: (context: T) => Promise<T | false> | T | false;
  priority?: number;
}

export interface RequestInterceptorRule extends InterceptorRule<RequestContext> {
  handler: (context: RequestContext) => Promise<RequestContext | false> | RequestContext | false;
}

export interface ResponseInterceptorRule {
  match: string | RegExp | ((url: string) => boolean);
  method?: HttpMethod | HttpMethod[];
  type?: RequestType;
  handler: (response: Response, context: ResponseContext) => Promise<Response | void> | Response | void;
  priority?: number;
}

export interface XHRResponseContext extends ResponseContext {
  response: any;
  responseText: string;
  responseXML: Document | null;
  responseURL: string;
  readyState: number;
  timeout: number;
  withCredentials: boolean;
}

export interface XHRInstance extends XMLHttpRequest {
  _interceptor?: RequestContext;
  _responseContext?: RequestContext;
  _originalOpenArgs?: [string, string, boolean?, string?, string?];
}
```

### 2. **核心拦截器类**

```typescript
// requestInterceptor.ts
import {
  HttpMethod,
  RequestContext,
  ResponseContext,
  RequestInterceptorRule,
  ResponseInterceptorRule,
  XHRInstance
} from './types';

class RequestInterceptor {
  private requestRules: RequestInterceptorRule[] = [];
  private responseRules: ResponseInterceptorRule[] = [];
  
  private originalFetch: typeof window.fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private originalXHRSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;
  
  private isActive: boolean = false;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  }

  /**
   * 添加请求拦截规则
   */
  public addRequestRule(rule: RequestInterceptorRule): this {
    this.requestRules.push({
      priority: rule.priority || 0,
      ...rule
    });
    this.requestRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  /**
   * 添加响应拦截规则
   */
  public addResponseRule(rule: ResponseInterceptorRule): this {
    this.responseRules.push({
      priority: rule.priority || 0,
      ...rule
    });
    this.responseRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  /**
   * 批量添加请求规则
   */
  public addRequestRules(rules: RequestInterceptorRule[]): this {
    rules.forEach(rule => this.addRequestRule(rule));
    return this;
  }

  /**
   * 批量添加响应规则
   */
  public addResponseRules(rules: ResponseInterceptorRule[]): this {
    rules.forEach(rule => this.addResponseRule(rule));
    return this;
  }

  /**
   * 启动拦截
   */
  public start(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.overrideFetch();
    this.overrideXHR();
  }

  /**
   * 停止拦截
   */
  public stop(): void {
    if (!this.isActive) return;
    this.isActive = false;
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetRequestHeader;
  }

  /**
   * 清除所有规则
   */
  public clearRules(): void {
    this.requestRules = [];
    this.responseRules = [];
  }

  /**
   * 获取当前规则数量
   */
  public getRuleCount(): { request: number; response: number } {
    return {
      request: this.requestRules.length,
      response: this.responseRules.length
    };
  }

  /**
   * 查找匹配的请求规则
   */
  private findMatchingRequestRules(
    url: string,
    method: HttpMethod,
    type: RequestType
  ): RequestInterceptorRule[] {
    return this.requestRules.filter(rule => {
      // 类型过滤
      if (rule.type && rule.type !== 'all' && rule.type !== type) {
        return false;
      }

      // 方法过滤
      if (rule.method) {
        const methods = Array.isArray(rule.method) ? rule.method : [rule.method];
        if (!methods.includes(method.toLowerCase() as HttpMethod)) {
          return false;
        }
      }

      // URL匹配
      if (typeof rule.match === 'function') {
        return rule.match(url);
      } else if (rule.match instanceof RegExp) {
        return rule.match.test(url);
      } else {
        return url.includes(rule.match);
      }
    });
  }

  /**
   * 查找匹配的响应规则
   */
  private findMatchingResponseRules(
    url: string,
    method: HttpMethod,
    type: RequestType
  ): ResponseInterceptorRule[] {
    return this.responseRules.filter(rule => {
      // 类型过滤
      if (rule.type && rule.type !== 'all' && rule.type !== type) {
        return false;
      }

      // 方法过滤
      if (rule.method) {
        const methods = Array.isArray(rule.method) ? rule.method : [rule.method];
        if (!methods.includes(method.toLowerCase() as HttpMethod)) {
          return false;
        }
      }

      // URL匹配
      if (typeof rule.match === 'function') {
        return rule.match(url);
      } else if (rule.match instanceof RegExp) {
        return rule.match.test(url);
      } else {
        return url.includes(rule.match);
      }
    });
  }

  /**
   * 应用请求规则
   */
  private async applyRequestRules(
    context: RequestContext,
    type: RequestType
  ): Promise<RequestContext | false> {
    const matchingRules = this.findMatchingRequestRules(
      context.url,
      context.method,
      type
    );

    let modifiedContext = context;
    for (const rule of matchingRules) {
      try {
        const result = await rule.handler(modifiedContext);
        if (result === false) {
          return false;
        }
        if (result) {
          modifiedContext = result;
        }
      } catch (error) {
        console.error('Request interceptor rule error:', error);
      }
    }
    return modifiedContext;
  }

  /**
   * 应用响应规则
   */
  private async applyResponseRules(
    response: Response,
    context: ResponseContext,
    type: RequestType
  ): Promise<Response> {
    const matchingRules = this.findMatchingResponseRules(
      context.url,
      context.method,
      type
    );

    let modifiedResponse = response;
    for (const rule of matchingRules) {
      try {
        const result = await rule.handler(modifiedResponse, context);
        if (result instanceof Response) {
          modifiedResponse = result;
        }
      } catch (error) {
        console.error('Response interceptor rule error:', error);
      }
    }
    return modifiedResponse;
  }

  /**
   * 重写 fetch
   */
  private overrideFetch(): void {
    const self = this;
    window.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      // 构建请求上下文
      const url = input instanceof Request ? input.url : input.toString();
      const method = (
        init?.method || 
        (input instanceof Request ? input.method : 'GET')
      ).toLowerCase() as HttpMethod;

      const context: RequestContext = {
        url,
        method,
        type: 'fetch',
        headers: {
          ...(input instanceof Request ? Object.fromEntries(input.headers.entries()) : {}),
          ...init?.headers
        },
        body: init?.body,
        config: init,
        originalRequest: input,
        timestamp: Date.now()
      };

      // 应用请求规则
      const modifiedContext = await self.applyRequestRules(context, 'fetch');
      if (modifiedContext === false) {
        return Promise.reject(new Error('Request blocked by interceptor'));
      }

      // 重建请求参数
      let modifiedInput: RequestInfo | URL = modifiedContext.url;
      let modifiedInit: RequestInit = {
        ...modifiedContext.config,
        headers: modifiedContext.headers
      };

      if (modifiedContext.body !== undefined) {
        modifiedInit.body = modifiedContext.body;
      }

      if (input instanceof Request) {
        modifiedInput = new Request(modifiedContext.url, modifiedInit);
      }

      // 发送请求
      try {
        const response = await self.originalFetch.call(this, modifiedInput, modifiedInit);

        // 构建响应上下文
        const responseContext: ResponseContext = {
          ...modifiedContext,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok,
          redirected: response.redirected,
          type: response.type,
          url: response.url
        };

        // 应用响应规则
        const modifiedResponse = await self.applyResponseRules(
          response,
          responseContext,
          'fetch'
        );

        return modifiedResponse;
      } catch (error) {
        const errorContext: ResponseContext = {
          ...modifiedContext,
          status: 0,
          statusText: 'Network Error',
          headers: {},
          ok: false,
          redirected: false,
          type: 'error' as ResponseType,
          url: modifiedContext.url,
          error: error instanceof Error ? error.message : String(error)
        };
        throw error;
      }
    };
  }

  /**
   * 重写 XMLHttpRequest
   */
  private overrideXHR(): void {
    const self = this;
    const XHR = XMLHttpRequest;

    // 重写 open
    XHR.prototype.open = function(
      this: XHRInstance,
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      this._interceptor = {
        url: url.toString(),
        method: method.toLowerCase() as HttpMethod,
        headers: {},
        body: null,
        type: 'xhr',
        timestamp: Date.now()
      };

      this._originalOpenArgs = [method, url.toString(), async, username, password];

      // 调用原始 open
      return self.originalXHROpen.call(this, method, url, async, username, password);
    };

    // 重写 setRequestHeader
    XHR.prototype.setRequestHeader = function(
      this: XHRInstance,
      name: string,
      value: string
    ): void {
      if (this._interceptor) {
        this._interceptor.headers[name] = value;
      }
      return self.originalXHRSetRequestHeader.call(this, name, value);
    };

    // 重写 send
    XHR.prototype.send = async function(
      this: XHRInstance,
      body?: Document | XMLHttpRequestBodyInit | null
    ): Promise<void> {
      if (!this._interceptor) {
        return self.originalXHRSend.call(this, body);
      }

      this._interceptor.body = body;

      // 应用请求规则
      const modifiedContext = await self.applyRequestRules(
        this._interceptor,
        'xhr'
      );

      if (modifiedContext === false) {
        this.dispatchEvent(new Event('error'));
        return;
      }

      // 如果 URL 被修改，重新调用 open
      const [method, originalUrl, async, username, password] = this._originalOpenArgs!;
      if (modifiedContext.url !== originalUrl) {
        self.originalXHROpen.call(
          this,
          modifiedContext.method.toUpperCase(),
          modifiedContext.url,
          async,
          username,
          password
        );
      }

      // 重新设置 headers
      Object.entries(modifiedContext.headers).forEach(([name, value]) => {
        self.originalXHRSetRequestHeader.call(this, name, value);
      });

      // 保存响应上下文
      this._responseContext = modifiedContext;

      // 重写事件监听
      const originalOnLoad = this.onload;
      const originalOnError = this.onerror;

      this.onload = async function(this: XHRInstance, event: ProgressEvent) {
        const responseContext = {
          ...this._responseContext!,
          status: this.status,
          statusText: this.statusText,
          headers: {}, // XHR 无法直接获取所有响应头
          ok: this.status >= 200 && this.status < 300,
          redirected: false,
          type: 'basic' as ResponseType,
          url: this.responseURL,
          response: this.response,
          responseText: this.responseText,
          responseXML: this.responseXML,
          readyState: this.readyState,
          timeout: this.timeout,
          withCredentials: this.withCredentials
        };

        // 创建模拟的 Response 对象以便应用响应规则
        const mockResponse = new Response(this.responseText, {
          status: this.status,
          statusText: this.statusText
        });

        await self.applyResponseRules(mockResponse, responseContext, 'xhr');

        if (originalOnLoad) {
          originalOnLoad.call(this, event);
        }
      };

      this.onerror = function(this: XHRInstance, event: Event | ProgressEvent) {
        if (originalOnError) {
          originalOnError.call(this, event);
        }
      };

      return self.originalXHRSend.call(this, modifiedContext.body);
    };
  }
}

export default RequestInterceptor;
```

### 3. **预设规则和工具函数**

```typescript
// presets.ts
import { HttpMethod, RequestContext, ResponseContext } from './types';
import RequestInterceptor from './requestInterceptor';

export interface TokenProvider {
  (): string | null | Promise<string | null>;
}

export interface ErrorHandler {
  (error: { status: number; data: any; context: RequestContext }): void;
}

// 请求规则预设
export const requestPresets = {
  /**
   * 添加认证头
   */
  auth: (getToken: TokenProvider, headerName: string = 'Authorization') => ({
    match: '/api' as const,
    priority: 100,
    handler: async (ctx: RequestContext) => {
      const token = await getToken();
      if (token) {
        ctx.headers[headerName] = `Bearer ${token}`;
      }
      return ctx;
    }
  }),

  /**
   * 添加基础认证
   */
  basicAuth: (username: string, password: string) => ({
    match: '/api' as const,
    priority: 100,
    handler: (ctx: RequestContext) => {
      const credentials = btoa(`${username}:${password}`);
      ctx.headers['Authorization'] = `Basic ${credentials}`;
      return ctx;
    }
  }),

  /**
   * 添加时间戳防缓存
   */
  noCache: (methods: HttpMethod[] = ['get']) => ({
    match: /\.json|\/api/,
    method: methods,
    priority: 50,
    handler: (ctx: RequestContext) => {
      const url = new URL(ctx.url, window.location.origin);
      url.searchParams.set('_t', Date.now().toString());
      ctx.url = url.toString();
      return ctx;
    }
  }),

  /**
   * 添加公共查询参数
   */
  addQueryParams: (params: Record<string, string>) => ({
    match: '/api' as const,
    priority: 60,
    handler: (ctx: RequestContext) => {
      const url = new URL(ctx.url, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      ctx.url = url.toString();
      return ctx;
    }
  }),

  /**
   * 添加公共请求头
   */
  addHeaders: (headers: Record<string, string>) => ({
    match: '/api' as const,
    priority: 70,
    handler: (ctx: RequestContext) => {
      ctx.headers = { ...ctx.headers, ...headers };
      return ctx;
    }
  }),

  /**
   * 修改请求体
   */
  modifyBody: (modifier: (body: any) => any) => ({
    match: '/api' as const,
    method: ['post', 'put', 'patch'],
    priority: 80,
    handler: (ctx: RequestContext) => {
      if (ctx.body) {
        try {
          if (typeof ctx.body === 'string' && 
              ctx.headers['content-type']?.includes('application/json')) {
            const bodyObj = JSON.parse(ctx.body);
            ctx.body = JSON.stringify(modifier(bodyObj));
          } else if (ctx.body instanceof FormData) {
            // FormData 需要特殊处理，这里简化处理
            console.warn('FormData modification not implemented');
          }
        } catch (e) {
          console.error('Failed to modify body:', e);
        }
      }
      return ctx;
    }
  }),

  /**
   * 请求限流
   */
  rateLimit: (maxRequests: number = 10, timeWindow: number = 1000) => {
    const requestLog: number[] = [];
    
    return {
      match: '/api' as const,
      priority: 200,
      handler: (ctx: RequestContext) => {
        const now = Date.now();
        const windowStart = now - timeWindow;
        
        // 清理过期记录
        while (requestLog.length > 0 && requestLog[0] < windowStart) {
          requestLog.shift();
        }
        
        if (requestLog.length >= maxRequests) {
          console.warn('Rate limit exceeded, blocking request');
          return false;
        }
        
        requestLog.push(now);
        return ctx;
      }
    };
  }
};

// 响应规则预设
export const responsePresets = {
  /**
   * 统一错误处理
   */
  handleError: (errorHandler: ErrorHandler) => ({
    match: '/api' as const,
    priority: 100,
    handler: async (response: Response, ctx: ResponseContext) => {
      if (!response.ok) {
        try {
          const data = await response.clone().json();
          errorHandler({
            status: response.status,
            data,
            context: ctx
          });
        } catch {
          errorHandler({
            status: response.status,
            data: { message: response.statusText },
            context: ctx
          });
        }
      }
      return response;
    }
  }),

  /**
   * 统一响应格式
   */
  standardizeResponse: <T = any>() => ({
    match: '/api' as const,
    priority: 80,
    handler: async (response: Response) => {
      const clonedResponse = response.clone();
      
      try {
        const data = await clonedResponse.json();
        
        // 创建标准格式的响应
        const standardizedData = {
          success: response.ok,
          code: data.code || response.status,
          message: data.message || (response.ok ? 'success' : 'error'),
          data: data.data || data,
          timestamp: Date.now()
        };
        
        return new Response(JSON.stringify(standardizedData), {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'content-type': 'application/json'
          }
        });
      } catch {
        return response;
      }
    }
  }),

  /**
   * 自动重试
   */
  retry: (maxRetries: number = 3, delay: number = 1000) => ({
    match: '/api' as const,
    priority: 90,
    handler: async (response: Response, ctx: ResponseContext) => {
      if (!response.ok && response.status >= 500) {
        const retryCount = (ctx as any)._retryCount || 0;
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 重新发送请求
          const newResponse = await fetch(ctx.url, {
            method: ctx.method,
            headers: ctx.headers,
            body: ctx.body
          });
          
          (newResponse as any)._retryCount = retryCount + 1;
          return newResponse;
        }
      }
      return response;
    }
  }),

  /**
   * 缓存响应
   */
  cache: (ttl: number = 5 * 60 * 1000) => {
    const cache = new Map<string, { data: any; timestamp: number }>();
    
    return {
      match: '/api' as const,
      method: ['get'],
      priority: 70,
      handler: async (response: Response, ctx: ResponseContext) => {
        const cacheKey = `${ctx.method}:${ctx.url}`;
        
        if (response.ok) {
          try {
            const data = await response.clone().json();
            cache.set(cacheKey, {
              data,
              timestamp: Date.now()
            });
          } catch {
            // 不是 JSON，不缓存
          }
        }
        
        return response;
      }
    };
  },

  /**
   * 使用缓存的请求规则（配合上面的缓存使用）
   */
  useCache: (ttl: number = 5 * 60 * 1000) => {
    const cache = new Map<string, { data: any; timestamp: number }>();
    
    return {
      match: '/api' as const,
      method: ['get'],
      priority: 150,
      handler: (ctx: RequestContext) => {
        const cacheKey = `${ctx.method}:${ctx.url}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < ttl) {
          // 这里不能直接返回 false，需要特殊处理
          // 实际使用时需要配合响应拦截器
          (ctx as any)._useCache = true;
          (ctx as any)._cachedData = cached.data;
        }
        
        return ctx;
      }
    };
  },

  /**
   * 日志记录
   */
  logger: (logFn: (msg: string, data: any) => void = console.log) => ({
    match: /.*/,
    priority: -100,
    handler: (response: Response, ctx: ResponseContext) => {
      logFn(`[${ctx.type}] ${ctx.method.toUpperCase()} ${ctx.url}`, {
        request: {
          headers: ctx.headers,
          body: ctx.body
        },
        response: {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        },
        duration: Date.now() - ctx.timestamp
      });
      return response;
    }
  })
};
```

### 4. **使用示例**

```typescript
// main.ts
import RequestInterceptor from './requestInterceptor';
import { requestPresets, responsePresets } from './presets';

// 创建拦截器实例
const interceptor = new RequestInterceptor();

// 启动拦截器
interceptor.start();

// 配置请求拦截
interceptor
  .addRequestRule(requestPresets.auth(() => {
    return localStorage.getItem('access_token');
  }))
  .addRequestRule(requestPresets.noCache(['get']))
  .addRequestRule(requestPresets.addQueryParams({
    platform: 'web',
    version: '1.0.0'
  }))
  .addRequestRule(requestPresets.addHeaders({
    'X-Client-Type': 'browser',
    'X-Request-ID': () => crypto.randomUUID()
  }))
  .addRequestRule({
    match: '/api/upload',
    method: ['post'],
    priority: 200,
    handler: (ctx) => {
      if (ctx.body instanceof FormData) {
        ctx.body.append('upload_time', Date.now().toString());
        ctx.body.append('client_id', 'web-app');
      }
      return ctx;
    }
  })
  .addRequestRule(requestPresets.rateLimit(5, 1000));

// 配置响应拦截
interceptor
  .addResponseRule(responsePresets.handleError((error) => {
    console.error('请求错误:', error);
    
    switch (error.status) {
      case 401:
        // 重定向到登录页
        window.location.href = '/login';
        break;
      case 403:
        alert('没有权限');
        break;
      case 500:
        alert('服务器错误');
        break;
    }
  }))
  .addResponseRule(responsePresets.standardizeResponse())
  .addResponseRule(responsePresets.retry(3, 1000))
  .addResponseRule(responsePresets.cache())
  .addResponseRule(responsePresets.logger((msg, data) => {
    // 发送到日志服务
    if (import.meta.env.DEV) {
      console.log(msg, data);
    }
  }))
  .addResponseRule({
    match: '/api/user/profile',
    priority: 200,
    handler: async (response, ctx) => {
      const data = await response.clone().json();
      
      // 修改响应数据
      const modifiedData = {
        ...data,
        _clientInfo: {
          timestamp: Date.now(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      return new Response(JSON.stringify(modifiedData), {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'x-modified': 'true'
        }
      });
    }
  });

// 条件性配置（开发环境）
if (import.meta.env.DEV) {
  interceptor
    .addRequestRule({
      match: /.*/,
      priority: 1000,
      handler: (ctx) => {
        console.log('📤 Request:', {
          url: ctx.url,
          method: ctx.method,
          headers: ctx.headers,
          body: ctx.body
        });
        return ctx;
      }
    })
    .addResponseRule({
      match: /.*/,
      priority: 1000,
      handler: (response, ctx) => {
        console.log('📥 Response:', {
          url: ctx.url,
          status: response.status,
          duration: Date.now() - ctx.timestamp
        });
        return response;
      }
    });
}

// 可以在需要时停止拦截
// interceptor.stop();

// 可以在运行时动态添加/移除规则
const tempRule = requestPresets.addHeaders({ 'X-Temp': 'temp-value' });
interceptor.addRequestRule(tempRule);

// 获取规则数量
console.log('当前规则数:', interceptor.getRuleCount());

export default interceptor;
```

### 5. **React 集成示例**

```typescript
// hooks/useInterceptor.ts
import { useEffect } from 'react';
import interceptor from '../main';

export const useInterceptor = (enabled: boolean = true) => {
  useEffect(() => {
    if (enabled) {
      interceptor.start();
    }
    
    return () => {
      if (enabled) {
        interceptor.stop();
      }
    };
  }, [enabled]);
};

// 在组件中使用
// function App() {
//   useInterceptor(true);
//   return <div>App</div>;
// }
```

### 6. **Vue 插件形式**

```typescript
// vuePlugin.ts
import { App, Plugin } from 'vue';
import interceptor from './main';

export const InterceptorPlugin: Plugin = {
  install(app: App, options?: { autoStart?: boolean }) {
    // 提供拦截器实例
    app.config.globalProperties.$interceptor = interceptor;
    app.provide('interceptor', interceptor);
    
    // 自动启动
    if (options?.autoStart) {
      interceptor.start();
    }
  }
};

// 在 Vue 中使用
// app.use(InterceptorPlugin, { autoStart: true });
```

这个 TypeScript 版本提供了完整的类型安全、丰富的预设规则、灵活的配置选项，可以满足大部分请求拦截的需求。