/**
 * 极简静态服务器：用于跑 examples/ 下的跨三端示例。
 *
 * 用法：
 *   npm run serve          # 默认 http://localhost:5173
 *   npm run serve -- 8080  # 指定端口
 *
 * 只做三件事：把根目录当静态目录、补 WASM/模块所需的 MIME、禁止缓存方便改完刷新。
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.argv[2] ?? process.env.PORT ?? 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bin': 'application/octet-stream',
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  let target = resolve(join(root, relative));

  // 目录穿越保护：目标必须仍在项目根目录内
  if (target !== root && !target.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end(`404 ${url.pathname}`);
    return;
  }

  response.writeHead(200, {
    'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(response);
});

server.listen(port, () => {
  console.log(`minigfx 示例服务已启动: http://localhost:${port}/examples/`);
  console.log(`静态根目录: ${root}`);
});
