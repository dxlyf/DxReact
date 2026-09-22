/**
 * WebGPU 入口。
 *
 * WebGPU 的设备获取是异步的（requestAdapter → requestDevice），因此这里用顶层 await。
 * 同一份 createScene() 直接复用：属性 / uniform 块 / 纹理绑定的 binding 序号
 * 全部由管线布局自动分配（块 0、纹理 1、采样器 2）。
 */
import { createWebGPUDevice } from '../../dist/index.js';
import { startDemo } from './demo.js';

const canvas = document.getElementById('view');
const hud = document.getElementById('hud');

if (!(canvas instanceof HTMLCanvasElement) || !hud) {
  throw new Error('页面缺少 #view 画布或 #hud 输出区');
}

try {
  const device = await createWebGPUDevice({ canvas, label: 'demo-webgpu', debug: true });
  startDemo(device, { canvas, hud });
} catch (error) {
  hud.textContent = `WebGPU 初始化失败：${error instanceof Error ? error.message : String(error)}`;
  throw error;
}
