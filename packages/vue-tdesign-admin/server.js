// framework.js - 轻量级 Koa 风格框架
import http from 'http';
import { Buffer } from 'buffer';
import querystring from 'querystring';

/**
 * 解析 multipart/form-data 格式的请求体
 * @param {Buffer} buffer - 原始请求体 Buffer
 * @param {string} boundary - 分隔符
 * @returns {Promise<Object>} 解析后的参数对象
 */
async function parseMultipart(buffer, boundary) {
    const result = { fields: {}, files: {} };
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const endBoundaryBuffer = Buffer.from(`--${boundary}--`);
    
    let start = 0;
    let parts = [];
    
    // 查找所有分隔符位置
    while (true) {
        const index = buffer.indexOf(boundaryBuffer, start);
        if (index === -1) break;
        
        if (start !== 0) {
            // 提取 part 内容（不包括开头的 \r\n）
            let partStart = start;
            if (buffer[start] === 13 && buffer[start + 1] === 10) {
                partStart = start + 2;
            }
            const partBuffer = buffer.slice(partStart, index - 2); // 去掉末尾的 \r\n
            parts.push(partBuffer);
        }
        start = index + boundaryBuffer.length;
        
        // 检查是否是结束边界
        if (buffer.slice(start, start + 2).toString() === '--') {
            break;
        }
        // 跳过 \r\n
        if (buffer[start] === 13 && buffer[start + 1] === 10) {
            start += 2;
        }
    }
    
    // 解析每个 part
    for (const partBuffer of parts) {
        // 查找头部和内容的分隔符
        const headerEndIndex = partBuffer.indexOf('\r\n\r\n');
        if (headerEndIndex === -1) continue;
        
        const headerBuffer = partBuffer.slice(0, headerEndIndex);
        const contentBuffer = partBuffer.slice(headerEndIndex + 4);
        
        const headers = headerBuffer.toString('utf8');
        
        // 提取字段名
        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);
        
        if (nameMatch) {
            const fieldName = nameMatch[1];
            
            if (filenameMatch) {
                // 文件字段
                const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
                result.files[fieldName] = {
                    filename: filenameMatch[1],
                    data: contentBuffer,
                    contentType: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
                    size: contentBuffer.length
                };
            } else {
                // 普通字段
                result.fields[fieldName] = contentBuffer.toString('utf8');
            }
        }
    }
    
    return result;
}

/**
 * 解析请求体中间件
 * 支持: JSON, x-www-form-urlencoded, multipart/form-data
 */
function bodyParser() {
    return async (ctx, next) => {
        return new Promise((resolve, reject) => {
            const chunks = [];
            let size = 0;
            
            ctx.req.on('data', chunk => {
                chunks.push(chunk);
                size += chunk.length;
            });
            
            ctx.req.on('end', async () => {
                try {
                    const contentType = ctx.req.headers['content-type'] || '';
                    const buffer = Buffer.concat(chunks, size);
                    
                    ctx.request.body = {};
                    ctx.request.files = {};
                    
                    if (buffer.length === 0) {
                        return next().then(resolve).catch(reject);
                    }
                    
                    // 根据 Content-Type 解析
                    if (contentType.includes('application/json')) {
                        try {
                            ctx.request.body = JSON.parse(buffer.toString('utf8'));
                        } catch (e) {
                            ctx.request.body = {};
                        }
                        await next();
                        resolve();
                    } 
                    else if (contentType.includes('application/x-www-form-urlencoded')) {
                        ctx.request.body = querystring.parse(buffer.toString('utf8'));
                        await next();
                        resolve();
                    }
                    else if (contentType.includes('multipart/form-data')) {
                        const boundaryMatch = contentType.match(/boundary=(.+)$/);
                        if (boundaryMatch) {
                            const parsed = await parseMultipart(buffer, boundaryMatch[1]);
                            ctx.request.body = parsed.fields;
                            ctx.request.files = parsed.files;
                        }
                        await next();
                        resolve();
                    }
                    else {
                        // 其他类型，原始 Buffer 保存在 raw 字段
                        ctx.request.rawBody = buffer;
                        await next();
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            });
            
            ctx.req.on('error', reject);
        });
    };
}

/**
 * 创建应用实例
 */
class Application {
    constructor() {
        this.middleware = [];
        this.context = Object.create(null);
        this.request = Object.create(null);
        this.response = Object.create(null);
    }
    
    /**
     * 创建上下文对象
     */
    createContext(req, res) {
        const ctx = Object.create(this.context);
        ctx.req = req;
        ctx.res = res;
        ctx.request = Object.create(this.request);
        ctx.response = Object.create(this.response);
        
        // 快捷方式
        ctx.method = req.method;
        ctx.url = req.url;
        ctx.path = req.url.split('?')[0];
        ctx.query = this.parseQuery(req.url);
        
        // 请求体快捷方式
        ctx.body = null;
        ctx.status = 404;
        
        // 绑定 request 辅助方法
        ctx.request.ctx = ctx;
        ctx.request.req = req;
        
        // 绑定 response 辅助方法
        ctx.response.ctx = ctx;
        ctx.response.res = res;
        
        return ctx;
    }
    
    /**
     * 解析查询参数
     */
    parseQuery(url) {
        const queryIndex = url.indexOf('?');
        if (queryIndex === -1) return {};
        const queryString = url.slice(queryIndex + 1);
        return querystring.parse(queryString);
    }
    
    /**
     * 设置响应
     */
    respond(ctx) {
        const res = ctx.res;
        let body = ctx.body;
        const status = ctx.status || 404;
        
        res.statusCode = status;
        
        if (body === null || body === undefined) {
            res.end();
            return;
        }
        
        if (typeof body === 'string') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(body);
        } else if (Buffer.isBuffer(body)) {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.end(body);
        } else if (typeof body === 'object') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(body));
        } else {
            res.end(String(body));
        }
    }
    
    /**
     * 使用中间件
     */
    use(fn) {
        this.middleware.push(fn);
        return this;
    }
    
    /**
     * 组合中间件
     */
    compose(middleware) {
        return (ctx, next) => {
            let index = -1;
            
            const dispatch = (i) => {
                if (i <= index) {
                    return Promise.reject(new Error('next() called multiple times'));
                }
                index = i;
                let fn = middleware[i];
                if (i === middleware.length) fn = next;
                if (!fn) return Promise.resolve();
                
                try {
                    return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
                } catch (err) {
                    return Promise.reject(err);
                }
            };
            
            return dispatch(0);
        };
    }
    
    /**
     * 处理请求
     */
    handleRequest(req, res) {
        const ctx = this.createContext(req, res);
        
        // 错误处理
        const onerror = (err) => {
            if (err) {
                console.error('Server error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
            }
        };
        
        // 组合所有中间件
        const fn = this.compose(this.middleware);
        
        fn(ctx).then(() => {
            this.respond(ctx);
        }).catch(onerror);
    }
    
    /**
     * 监听端口
     */
    listen(port, hostname, callback) {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        if (typeof hostname === 'function') {
            callback = hostname;
            hostname = undefined;
        }
        
        return server.listen(port, hostname, callback);
    }
}

/**
 * 路由中间件生成器
 */
class Router {
    constructor() {
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
            PATCH: {}
        };
        this.paramsCache = new Map();
    }
    
    /**
     * 注册路由
     */
    register(method, path, handler) {
        if (!this.routes[method]) {
            this.routes[method] = {};
        }
        this.routes[method][path] = handler;
    }
    
    /**
     * 匹配路由并解析参数
     */
    match(method, pathname) {
        const routes = this.routes[method];
        if (!routes) return null;
        
        // 精确匹配
        if (routes[pathname]) {
            return { handler: routes[pathname], params: {} };
        }
        
        // 参数匹配 (支持 :id 格式)
        for (const routePath in routes) {
            const paramNames = [];
            const regexPath = routePath.replace(/:([^\/]+)/g, (_, paramName) => {
                paramNames.push(paramName);
                return '([^\/]+)';
            });
            
            const regex = new RegExp(`^${regexPath}$`);
            const match = pathname.match(regex);
            
            if (match) {
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                return { handler: routes[routePath], params };
            }
        }
        
        return null;
    }
    
    /**
     * 返回中间件
     */
    routes() {
        return async (ctx, next) => {
            const method = ctx.method;
            const pathname = ctx.path;
            
            const matched = this.match(method, pathname);
            
            if (matched) {
                ctx.params = matched.params;
                await matched.handler(ctx);
            } else {
                await next();
            }
        };
    }
    
    // 快捷方法
    get(path, handler) { this.register('GET', path, handler); }
    post(path, handler) { this.register('POST', path, handler); }
    put(path, handler) { this.register('PUT', path, handler); }
    delete(path, handler) { this.register('DELETE', path, handler); }
    patch(path, handler) { this.register('PATCH', path, handler); }
}

export { Application, Router, bodyParser };