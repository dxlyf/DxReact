/**
 * WebGL / WebGL2 入口。
 *
 * 用 `?gl=1` 可强制走 WebGL1（关闭 preferWebGL2），用来观察降级行为：
 *  - capabilities.vertexArrayObjects === false 时，VAO 退化为属性指针重放
 *  - capabilities.uniformBuffers === false 时，uniform 块退化为逐个 uniform 上传
 */
import { createWebGLDevice } from '../../dist/index.js';
import { startDemo } from './demo.js';

const canvas = document.getElementById('view');
const hud = document.getElementById('hud');

if (!(canvas instanceof HTMLCanvasElement) || !hud) {
  throw new Error('页面缺少 #view 画布或 #hud 输出区');
}

const preferWebGL2 = new URLSearchParams(location.search).get('gl') !== '1';

const device = createWebGLDevice({
  canvas,
  label: 'demo-webgl',
  preferWebGL2,
  debug: true,
});

startDemo(device, { canvas, hud });
