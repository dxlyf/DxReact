/**
 * Canvas2D CPU 渲染器 —— 类 Canvas 2D API 的立即模式矢量光栅化。
 *
 * 目录结构：
 * - math.ts    2D 仿射矩阵 Mat2D（用户坐标 → 设备坐标）
 * - path.ts    Path2D 路径命令 + 曲线自适应细分转多边形
 * - canvas.ts  Canvas2DRenderer：状态栈 / 扫描线填充 / 描边膨胀 / drawImage / alpha 混合
 *
 * 用法（对齐真实 canvas 2D）：
 *   const ctx = new Canvas2DRenderer(320, 240)
 *   ctx.fillStyle = '#f00'
 *   ctx.beginPath(); ctx.arc(160, 120, 60, 0, Math.PI * 2); ctx.fill()
 *   ctx.strokeStyle = 'rgba(0,0,255,0.5)'; ctx.lineWidth = 4
 *   ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(320, 240); ctx.stroke()
 *   const imageData = ctx.toImageData()
 */
export * from './math'
export * from './path'
export * from './canvas'
