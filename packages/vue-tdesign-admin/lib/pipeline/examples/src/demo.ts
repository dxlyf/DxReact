/**
 * 与后端无关的演示循环：尺寸同步 → 开帧 → 画 → 结束帧 → 刷新 HUD。
 *
 * 三种 API 共用同一套调用顺序，差异体现在：
 *  - WebGL 的 beginFrame 会做一次全局状态 reset；
 *  - WebGPU 的画布纹理视图每帧只能取一次，beginFrame 内部会取好。
 */
import { rgba, type Device } from '../../dist/index.js';
import { createScene } from './scene.js';

export interface DemoOptions {
  canvas: HTMLCanvasElement;
  hud: HTMLElement;
}

/** 启动渲染循环，返回停止函数。 */
export function startDemo(device: Device, options: DemoOptions): () => void {
  const { canvas, hud } = options;
  let scene = createScene(device);
  let raf = 0;
  let hudAt = -1;
  let stopped = false;
  /** 上下文恢复后的临时提示，1.5 秒后回到常规 HUD */
  let notice = '';
  let noticeUntil = 0;

  // 丢失：此时所有原生对象已失效，循环靠 device.lost 自然停画，这里只提示
  const stopOnLost = device.onContextLost((event) => {
    hud.textContent = [
      `上下文已丢失：${event.reason}`,
      event.recoverable ? '等待 webglcontextrestored…' : 'WebGPU 设备不会恢复，请重建设备',
    ].join('\n');
  });

  // 恢复：库已经把失效的旧资源全部销毁，这里按同一份描述符重建整个场景
  const rebuild = device.onContextRestored(() => {
    scene = createScene(device);
    notice = '上下文已恢复，资源已重建';
    noticeUntil = performance.now() + 1500;
  });

  /** 按设备像素比同步画布像素尺寸；尺寸没变就跳过（避免冗余的 configure / viewport 调用）。 */
  const syncSize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    const current = device.canvasSize;
    if (current.width !== width || current.height !== height) device.setCanvasSize(width, height);
  };

  const describe = (): string => {
    const caps = device.capabilities;
    return [
      `api          : ${caps.api}`,
      `canvas       : ${device.canvasSize.width}x${device.canvasSize.height} (dpr=${window.devicePixelRatio})`,
      `原生 VAO      : ${caps.vertexArrayObjects}`,
      `uniform 块    : ${caps.uniformBuffers ? '原生 UBO' : '降级为逐个 uniform'}`,
      `instancing   : ${caps.instancing}`,
      '',
      device.report(),
    ].join('\n');
  };

  const frame = (now: number): void => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    try {
      if (device.lost) {
        hud.textContent = '上下文已丢失（WebGL CONTEXT_LOST / WebGPU device.lost）';
        return;
      }
      syncSize();
      const pass = device.beginFrame({ clearColor: rgba(0.06, 0.07, 0.1, 1) });
      scene.render(pass, now);
      pass.end();
      if (now - hudAt > 500) {
        hudAt = now;
        hud.textContent = (notice && now < noticeUntil ? `${notice}\n\n` : '') + describe();
      }
    } catch (error) {
      stopped = true;
      cancelAnimationFrame(raf);
      hud.textContent = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw error;
    }
  };

  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    stopOnLost();
    rebuild();
    scene.dispose();
    device.destroy();
  };
}
