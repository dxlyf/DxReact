// ══════════════════════════════════════════════
// SVG Arc 参数化转换
// 参考：https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
// ══════════════════════════════════════════════

/** SVG 弧线的端点参数化 */
export interface EndpointArcParams {
  x1: number
  y1: number
  x2: number
  y2: number
  /** 椭圆 x 半轴 */
  rx: number
  /** 椭圆 y 半轴 */
  ry: number
  /** x 轴旋转角（弧度） */
  xAxisRotation: number
  /** 是否走大弧（> 180°） */
  largeArcFlag: boolean
  /** 是否逆时针方向 */
  sweepFlag: boolean
}

/** 弧线的中心参数化 */
export interface CenterArcParams {
  /** 椭圆中心 x */
  cx: number
  /** 椭圆中心 y */
  cy: number
  /** 椭圆 x 半轴 */
  rx: number
  /** 椭圆 y 半轴 */
  ry: number
  /** 起始角（弧度） */
  startAngle: number
  /** 扫描角（弧度），正值为逆时针 */
  sweepAngle: number
  /** x 轴旋转角（弧度） */
  xAxisRotation: number
}

/** 中心参数化转回端点时的返回类型 */
export interface EndpointArcResult {
  x1: number
  y1: number
  x2: number
  y2: number
  largeArcFlag: boolean
  sweepFlag: boolean
}

export function normalizeAngles(startAngle: number, endAngle: number, ccw: boolean = false) {
    const tau = Math.PI * 2
    let newStartAngle = startAngle % tau;
    if (newStartAngle <= 0) {
        newStartAngle += tau;
    }
    let delta = newStartAngle - startAngle;
    startAngle = newStartAngle;
    endAngle += delta;

    if (!ccw && (endAngle - startAngle) >= tau) {
        endAngle = startAngle + tau;
    }
    else if (ccw && (startAngle - endAngle) >= tau) {
        endAngle = startAngle - tau;
    }
    else if (!ccw && startAngle > endAngle) {
        endAngle = startAngle + (tau - (startAngle - endAngle) % tau);
    }
    else if (ccw && startAngle < endAngle) {
        endAngle = startAngle - (tau - (endAngle - startAngle) % tau);
    }
    return { startAngle, endAngle }
}

/**
 * 将 SVG 端点参数化转换为中心参数化。
 *
 * 算法步骤（对应 SVG 规范 F.6.5）：
 * 1. 将端点变换到椭圆局部坐标系
 * 2. 修正 rx/ry（如果太小无法连接两端点，按比例放大）
 * 3. 计算椭圆中心在局部坐标系中的位置
 * 4. 将中心变换回全局坐标系
 * 5. 计算 startAngle 和 sweepAngle
 */
export function endpointToCenter(params: EndpointArcParams): CenterArcParams {
  let { x1, y1, x2, y2, rx, ry, xAxisRotation, largeArcFlag, sweepFlag } = params

  // 预计算旋转角的正弦和余弦
  const sinRot = Math.sin(xAxisRotation)
  const cosRot = Math.cos(xAxisRotation)

  // 步骤 1: 将端点转换到旋转后的中间坐标系
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cosRot * dx + sinRot * dy
  const y1p = -sinRot * dx + cosRot * dy

  // 步骤 2: 确保 rx/ry 足够大以连接两端点
  // 按 SVG 规范 F.6.5 Step 2: Λ = x1'²/rx² + y1'²/ry²
  let rxSq = rx * rx
  let rySq = ry * ry
  const x1pSq = x1p * x1p
  const y1pSq = y1p * y1p

  const lambda = x1pSq / rxSq + y1pSq / rySq
  if (lambda > 1) {
    const s = Math.sqrt(lambda)
    rx *= s
    ry *= s
    rxSq = rx * rx
    rySq = ry * ry
  }

  // 计算中心因子：(rx²*ry² - rx²*y1'² - ry²*x1'²) / (rx²*y1'² + ry²*x1'²)
  const radicant = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq)

  // 步骤 3: 计算中心点 (cxp, cyp) 在局部坐标系中
  // largeArcFlag === sweepFlag 时取负号，否则取正号
  const coeff = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(radicant)
  const cxp = coeff * ((rx * y1p) / ry)
  const cyp = coeff * ((-ry * x1p) / rx)

  // 步骤 4: 将中心点变换回全局坐标系
  const cx = cosRot * cxp - sinRot * cyp + (x1 + x2) / 2
  const cy = sinRot * cxp + cosRot * cyp + (y1 + y2) / 2

  // 步骤 5: 计算 startAngle 和 sweepAngle
  const startAngle = angleBetween(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let sweepAngle = angleBetween(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  )

  // 根据 sweepFlag 调整 sweepAngle 使其方向正确
  if (!sweepFlag && sweepAngle > 0) {
    sweepAngle -= 2 * Math.PI
  } else if (sweepFlag && sweepAngle < 0) {
    sweepAngle += 2 * Math.PI
  }

  return { cx, cy, rx, ry, startAngle, sweepAngle, xAxisRotation }
}

/**
 * 将中心参数化转换回端点参数化（endpointToCenter 的逆运算）。
 *
 * 算法步骤：
 * 1. 在局部坐标系中根据 startAngle 和 sweepAngle 计算两端点
 * 2. 将端点旋转回全局坐标系
 * 3. 根据 sweepAngle 推导 largeArcFlag 和 sweepFlag
 */
export function centerToEndpoint(params: CenterArcParams): EndpointArcResult {
  const { cx, cy, rx, ry, startAngle, sweepAngle, xAxisRotation } = params

  const sinRot = Math.sin(xAxisRotation)
  const cosRot = Math.cos(xAxisRotation)

  const endAngle = startAngle + sweepAngle

  // 步骤 1: 在局部坐标系中计算起点和终点
  const x1p = rx * Math.cos(startAngle)
  const y1p = ry * Math.sin(startAngle)
  const x2p = rx * Math.cos(endAngle)
  const y2p = ry * Math.sin(endAngle)

  // 步骤 2: 旋转变换到全局坐标系，并平移到中心
  const x1 = cosRot * x1p - sinRot * y1p + cx
  const y1 = sinRot * x1p + cosRot * y1p + cy
  const x2 = cosRot * x2p - sinRot * y2p + cx
  const y2 = sinRot * x2p + cosRot * y2p + cy

  // 步骤 3: 推导 flag
  const largeArcFlag = Math.abs(sweepAngle) > Math.PI
  const sweepFlag = sweepAngle > 0

  return { x1, y1, x2, y2, largeArcFlag, sweepFlag }
}

/** 椭圆弧的几何表示 */
export interface ArcOvalResult {
  /** 椭圆中心 x */
  cx: number
  /** 椭圆中心 y */
  cy: number
  /** 椭圆 x 半轴 */
  rx: number
  /** 椭圆 y 半轴 */
  ry: number
  /** 起始角（弧度） */
  startAngle: number
  /** 结束角（弧度） */
  endAngle: number
  /** 是否逆时针 */
  counterclockwise: boolean
  /** x 轴旋转角（弧度） */
  xAxisRotation: number
}

/**
 * 将 SVG 弧线端点参数转换为椭圆弧几何表示。
 *
 * 组合 endpointToCenter，输出 startAngle 和 endAngle（而非 sweepAngle），
 * 方便直接用于 canvas arc() 等 API。
 */
export function arcToOval(params: EndpointArcParams): ArcOvalResult {
  const center = endpointToCenter(params)
  return {
    cx: center.cx,
    cy: center.cy,
    rx: center.rx,
    ry: center.ry,
    startAngle: center.startAngle,
    endAngle: center.startAngle + center.sweepAngle,
    counterclockwise: center.sweepAngle < 0,
    xAxisRotation: center.xAxisRotation,
  }
}

// ══════════════════════════════════════════════
// 弧线 → 三次贝塞尔曲线近似
// ══════════════════════════════════════════════

/** 三次贝塞尔曲线段 */
export interface CubicBezier {
  /** 起点 */
  p1: { x: number; y: number }
  /** 控制点 1 */
  cp1: { x: number; y: number }
  /** 控制点 2 */
  cp2: { x: number; y: number }
  /** 终点 */
  p2: { x: number; y: number }
}

/**
 * 将椭圆弧近似为三次贝塞尔曲线。
 *
 * 基于公式 k = (4/3) * tan(θ/4)：
 * 1. 在单位圆上计算切点及切线方向的缩放因子
 * 2. 按 rx/ry 缩放到椭圆
 * 3. 按 xAxisRotation 旋转
 * 4. 平移到 (cx, cy)
 *
 * @param cx        椭圆中心 x
 * @param cy        椭圆中心 y
 * @param rx        椭圆 x 半轴
 * @param ry        椭圆 y 半轴
 * @param startAngle 起始角（弧度）
 * @param deltaAngle 角度跨度（弧度），正值逆时针
 * @param xAxisRotation x 轴旋转角（弧度）
 */
export function arcToCubic(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  deltaAngle: number,
  xAxisRotation: number,
): CubicBezier {
  const sinRot = Math.sin(xAxisRotation)
  const cosRot = Math.cos(xAxisRotation)

  // 峰值切线距离系数：k = (4/3) * tan(θ/4)
  const k = (4 / 3) * Math.tan(deltaAngle / 4)

  // 单位圆上起点和终点
  const cosA0 = Math.cos(startAngle)
  const sinA0 = Math.sin(startAngle)
  const cosA1 = Math.cos(startAngle + deltaAngle)
  const sinA1 = Math.sin(startAngle + deltaAngle)

  // 起点、终点在椭圆局部坐标系中
  const p1LocalX = rx * cosA0
  const p1LocalY = ry * sinA0
  const p2LocalX = rx * cosA1
  const p2LocalY = ry * sinA1

  // 控制点 1：起点 + k * 切线，切线方向 = (-rx*sinA0, ry*cosA0)
  const cp1LocalX = p1LocalX + k * (-rx * sinA0)
  const cp1LocalY = p1LocalY + k * (ry * cosA0)

  // 控制点 2：终点 - k * 切线，切线方向 = (-rx*sinA1, ry*cosA1)
  const cp2LocalX = p2LocalX - k * (-rx * sinA1)
  const cp2LocalY = p2LocalY - k * (ry * cosA1)

  // 旋转变换到全局坐标系并平移
  const p1 = {
    x: cosRot * p1LocalX - sinRot * p1LocalY + cx,
    y: sinRot * p1LocalX + cosRot * p1LocalY + cy,
  }
  const cp1 = {
    x: cosRot * cp1LocalX - sinRot * cp1LocalY + cx,
    y: sinRot * cp1LocalX + cosRot * cp1LocalY + cy,
  }
  const cp2 = {
    x: cosRot * cp2LocalX - sinRot * cp2LocalY + cx,
    y: sinRot * cp2LocalX + cosRot * cp2LocalY + cy,
  }
  const p2 = {
    x: cosRot * p2LocalX - sinRot * p2LocalY + cx,
    y: sinRot * p2LocalX + cosRot * p2LocalY + cy,
  }

  return { p1, cp1, cp2, p2 }
}

/**
 * 将椭圆（或椭圆弧）近似为多段三次贝塞尔曲线。
 *
 * 会自动将弧度按每段不超过 segmentAngle（默认 π/2，即 90°）切分，
 * 保证每段近似精度。
 *
 * @param cx        椭圆中心 x
 * @param cy        椭圆中心 y
 * @param rx        椭圆 x 半轴
 * @param ry        椭圆 y 半轴
 * @param startAngle 起始角（弧度）
 * @param endAngle   结束角（弧度）
 * @param counterclockwise 是否逆时针，默认 false（顺时针）
 * @param xAxisRotation x 轴旋转角（弧度）
 * @param segmentAngle 每段最大角度（弧度），默认 π/2（90°）
 */
export function ellipseToCubics(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  counterclockwise: boolean = false,
  xAxisRotation: number = 0,
  segmentAngle: number = Math.PI / 2,
): CubicBezier[] {
  const result: CubicBezier[] = []

  // 根据方向计算扫描角
  // Canvas 坐标系 y 向下，数学正角 = 视觉顺时针
  // counterclockwise=false → 视觉顺时针 → sweepAngle 为正
  // counterclockwise=true  → 视觉逆时针 → sweepAngle 为负
  let sweepAngle: number = endAngle - startAngle
  if (!counterclockwise && sweepAngle < 0) {
    sweepAngle += 2 * Math.PI
  } else if (counterclockwise && sweepAngle > 0) {
    sweepAngle -= 2 * Math.PI
  }

  if (Math.abs(sweepAngle) < 1e-15) return result

  const totalAngle = Math.abs(sweepAngle)
  // 计算分段数，保证每段不超过 segmentAngle
  const count = Math.max(1, Math.ceil(totalAngle / segmentAngle))
  const delta = sweepAngle / count

  let angle = startAngle
  for (let i = 0; i < count; i++) {
    const seg = arcToCubic(cx, cy, rx, ry, angle, delta, xAxisRotation)
    result.push(seg)
    angle += delta
  }

  return result
}

/**
 * 计算从向量 u 到向量 v 的有向角（弧度），范围 [-π, π]。
 * 正值表示从 u 逆时针旋转到 v。
 */
function angleBetween(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy
  const cross = ux * vy - uy * vx
  return Math.atan2(cross, dot)
}
