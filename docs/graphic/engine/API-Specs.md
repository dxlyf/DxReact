# API Specs（文件级接口规范）

> 与 `需求.md` 目录结构一一对应，为每个源文件定义类、属性、方法签名（API 签名级）。
> 统一约定见下文「全局约定」。待实现目录（renderers/*）给出接口约定而非完整实现。

## 全局约定

- **坐标系**：左上角原点，y 轴向下，逻辑像素单位（对齐 Canvas/DOM）
- **角度**：默认弧度制；提供 `degrees` 辅助（`MathUtils.degToRad`）
- **颜色**：`Color` 内部归一化 `r/g/b/a ∈ [0,1]`；`Color | string | number` 均可作填充入参
- **变换顺序**：`this = this × m`（后乘），`translate → rotate → scale` 依次后乘
- **对象销毁**：`destroy()` 幂等；销毁后不可再使用
- **事件命名**：小驼峰（`pointerdown`、`pointermove`），继承 `EventEmitter` 的对象都有 `on/off/once/emit`
- **属性风格**：公开字段 + `getX/setX`（如 `getBounds()`），支持链式（返回 `this`）
- **类型**：全部使用 TypeScript 严格模式，泛型提供类型安全

---

## 一、core

### 1.1 core/Engine.ts — 引擎类

```ts
type BackendType = 'canvas' | 'webgl2' | 'webgpu';

interface EngineOptions {
  canvas?: HTMLCanvasElement;      // 复用已有画布
  container?: HTMLElement;         // 指定容器，自动创建 canvas
  width?: number;                  // 逻辑宽（默认取容器/画布）
  height?: number;
  backend?: BackendType | 'auto';  // 默认 'auto'：webgpu→webgl2→canvas 降级
  autoStart?: boolean;             // 默认 true
  devicePixelRatio?: number;       // 默认 window.devicePixelRatio
  antialias?: boolean;             // GPU 后端 MSAA
  background?: Color | string;     // 清屏色
  debug?: boolean;                 // 开启 debug 日志与统计
}

class Engine {
  constructor(options?: EngineOptions);
  static create(options?: EngineOptions): Engine;   // 工厂方法

  // 生命周期
  init(): Promise<void>;                            // 初始化后端与各系统
  start(): void;                                    // 启动渲染循环（rAF）
  stop(): void;                                     // 停止渲染循环
  tick(deltaTime?: number): void;                   // 手动推进一帧（测试/离屏）
  resize(width?: number, height?: number): void;    // 自适应容器时可不传参
  destroy(): void;                                  // 停止、销毁全部子系统

  // 子系统访问（各系统在 init 后可用）
  get renderer(): Renderer;
  get stage(): Container;                           // 根场景容器
  get interaction(): InteractionSystem;
  get animation(): AnimationSystem;
  get assets(): AssetManager;
  get plugins(): PluginSystem;
  get picking(): PickupSystem;

  // 渲染循环控制
  paused: boolean;
  requestRender(): void;                            // 脏标记模式下手动请求重绘
  getFrameStats(): { fps: number; drawCalls: number; objectCount: number };

  // 后端查询
  getBackendType(): BackendType;
  static isBackendSupported(type: BackendType): boolean;

  // 事件（继承 EventEmitter）
  on(event: 'init' | 'start' | 'stop' | 'resize' | 'destroy', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}
```

### 1.2 core/Renderer.ts — 渲染器类

```ts
interface RenderStats {
  drawCalls: number;
  objectCount: number;        // 本次渲染对象数
  culledCount: number;        // 被剔除对象数
  visibleRectCount: number;   // Canvas 脏矩形数量（仅 canvas 后端）
}

class Renderer {
  constructor(backend: BackendAdapter, options?: RendererOptions);
  readonly backend: BackendType;
  width: number;
  height: number;
  devicePixelRatio: number;

  render(scene: Container, options?: { clear?: boolean }): void;
  resize(width: number, height: number): void;
  clear(color?: Color | string): void;
  createRenderTexture(width: number, height: number): RenderTexture;
  getStats(): RenderStats;
  get canvas(): HTMLCanvasElement;
  destroy(): void;
}
```

### 1.3 core/Element.ts — 元素类（场景节点基类）

```ts
class Element {
  static getCount(): number;                        // 存活实例数（调试）
  readonly id: number;
  name?: string;
  parent: Container | null;
  children: Element[];
  visible: boolean;
  alpha: number;                                    // [0,1]
  zIndex: number;                                   // 同层内排序（sortableChildren 时生效）
  blendMode?: BlendMode;                            // 'normal'|'multiply'|'screen'|'overlay'|'lighter' 等

  // 层级管理
  addChild(child: Element): Element;
  addChildAt(child: Element, index: number): Element;
  removeChild(child: Element): Element;
  removeChildAt(index: number): Element;
  removeChildren(begin?: number, end?: number): Element[];
  getChildAt(index: number): Element;
  getChildIndex(child: Element): number;
  setChildIndex(child: Element, index: number): void;
  contains(child: Element): boolean;
  getChildByName(name: string, deep?: boolean): Element | undefined;
  getChildren(): Element[];

  // 遍历
  forEach(visitor: (node: Element) => void, deep?: boolean): void;
  find(predicate: (node: Element) => boolean): Element | undefined;

  // 事件（继承 EventEmitter，泛型事件映射）
  on<K extends keyof ElementEvents>(event: K, listener: ElementEvents[K]): this;
  off<K extends keyof ElementEvents>(event: K, listener?: ElementEvents[K]): this;
  once<K extends keyof ElementEvents>(event: K, listener: ElementEvents[K]): this;

  // 生命周期（内部钩子）
  protected onAdded(parent: Container): void;
  protected onRemoved(parent: Container): void;
  protected onUpdate(deltaTime: number): void;      // 每帧回调，重写以扩展

  destroy(): void;
  get destroyed(): boolean;
}
```

---

## 二、events

### 2.1 events/EventEmitter.ts — 事件发射器

```ts
type Listener<Args extends unknown[] = any[]> = (...args: Args) => void;

class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  on<K extends keyof Events>(event: K, listener: Events[K]): this;
  on(event: string, listener: Listener): this;      // 未在映射中声明的事件也可监听
  once<K extends keyof Events>(event: K, listener: Events[K]): this;
  off<K extends keyof Events>(event: K, listener?: Events[K]): this;
  off(event?: string, listener?: Listener): this;   // 不传参则移除全部
  removeAllListeners(event?: string): void;
  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): boolean;
  emit(event: string, ...args: any[]): boolean;     // 返回是否有监听者消费
  listenerCount(event: string): number;
  listeners(event: string): Listener[];
  hasListeners(event: string): boolean;
}
```

---

## 三、math — 2D 数学库

### 3.1 math/Color.ts — 颜色

```ts
type ColorInput = Color | string | number;          // string: '#f00'/'#ff0000'/'red'/'rgb()/rgba()/hsl()'

class Color {
  r: number;                                        // 0-1
  g: number;
  b: number;
  a: number;                                        // 0-1，默认 1
  constructor(r?: number, g?: number, b?: number, a?: number);

  static fromHex(hex: string): Color;
  static fromRgb(r: number, g: number, b: number, a?: number): Color;      // 0-255
  static fromHsl(h: number, s: number, l: number, a?: number): Color;
  static fromHsv(h: number, s: number, v: number, a?: number): Color;
  static fromString(input: string): Color;
  static fromArray(arr: number[]): Color;
  static WHITE: Color; static BLACK: Color; static RED: Color;             // 预置色：GREEN/BLUE/YELLOW/CYAN/MAGENTA/TRANSPARENT 等

  clone(): Color;
  copy(c: Color): this;
  set(r: number, g: number, b: number, a?: number): this;
  setAlpha(a: number): this;
  getAlpha(): number;

  get hex(): string;                                // '#rrggbb'
  get hex8(): string;                               // '#rrggbbaa'
  get rgb(): { r: number; g: number; b: number };   // 0-255
  get rgbaString(): string;                         // 'rgba(255,0,0,1)'
  toHsl(): { h: number; s: number; l: number; a: number };
  toHsv(): { h: number; s: number; v: number; a: number };
  toArray(target?: number[]): number[];

  lerp(c: Color, t: number): this;
  multiply(c: Color): this;
  multiplyScalar(s: number): this;
  getLuminance(): number;                           // 相对亮度
  equals(c: Color): boolean;
  toString(): string;                               // '#rrggbb'
}
```

### 3.2 math/Gradient.ts — 渐变

```ts
interface GradientStop { offset: number; color: ColorInput; }

abstract class Gradient {
  readonly stops: GradientStop[];
  addColorStop(offset: number, color: ColorInput): this;   // offset∈[0,1]，按 offset 排序
  getStops(): GradientStop[];
  toCSS?(context: CanvasRenderingContext2D): CanvasGradient; // canvas 后端专用，默认不暴露
}

class LinearGradient extends Gradient {
  constructor(x0: number, y0: number, x1: number, y1: number);
  readonly start: Vector2;
  readonly end: Vector2;
}

class RadialGradient extends Gradient {
  constructor(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number);
  readonly innerCenter: Vector2; readonly innerRadius: number;
  readonly outerCenter: Vector2; readonly outerRadius: number;
}
```

### 3.3 math/Pattern.ts — 图案

```ts
type PatternSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;
type Repetition = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';

class Pattern {
  constructor(source: PatternSource, repetition?: Repetition);
  source: PatternSource;
  repetition: Repetition;
  transform?: Matrix2D;                             // 可选：图案自身的仿射变换
  setSource(source: PatternSource): this;
  setRepetition(repetition: Repetition): this;
}
```

### 3.4 math/Vector2.ts — 二维向量

```ts
class Vector2 {
  x: number;
  y: number;
  constructor(x?: number, y?: number);              // 默认 0,0

  static ZERO: Vector2; static ONE: Vector2; static UP: Vector2;
  static DOWN: Vector2; static LEFT: Vector2; static RIGHT: Vector2;
  static fromArray(arr: number[], offset?: number): Vector2;
  static fromAngle(angle: number, length?: number): Vector2;
  static random(min?: number, max?: number): Vector2;

  set(x: number, y: number): this;
  clone(): Vector2;
  copy(v: Vector2): this;
  add(v: Vector2): this;
  addScalar(s: number): this;
  addVectors(a: Vector2, b: Vector2): this;
  sub(v: Vector2): this;
  subScalar(s: number): this;
  subVectors(a: Vector2, b: Vector2): this;
  multiply(v: Vector2): this;
  multiplyScalar(s: number): this;
  divide(v: Vector2): this;
  divideScalar(s: number): this;
  negate(): this;
  min(v: Vector2): this;
  max(v: Vector2): this;
  clamp(min: Vector2, max: Vector2): this;
  clampScalar(min: number, max: number): this;
  clampLength(min: number, max: number): this;
  floor(): this;
  ceil(): this;
  round(): this;

  dot(v: Vector2): number;
  cross(v: Vector2): number;                        // z 分量标量
  length(): number;
  lengthSq(): number;
  manhattanLength(): number;
  distanceTo(v: Vector2): number;
  distanceToSquared(v: Vector2): number;
  manhattanDistanceTo(v: Vector2): number;
  angle(): number;                                  // 与 +x 轴夹角 [-π,π]
  angleTo(v: Vector2): number;
  normalize(): this;
  setLength(length: number): this;
  lerp(v: Vector2, alpha: number): this;
  lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this;
  rotateAround(center: Vector2, angle: number): this;
  projectOnVector(v: Vector2): this;
  reflect(normal: Vector2): this;
  equals(v: Vector2): boolean;
  toArray(target?: number[]): number[];
  toString(): string;
}
```

### 3.5 math/Matrix2D.ts — 二维仿射矩阵 (a,b,c,d,e,f)

```ts
class Matrix2D {
  a: number; b: number; c: number; d: number; e: number; f: number;
  constructor(a?: number, b?: number, c?: number, d?: number, e?: number, f?: number); // 默认单位矩阵

  static readonly IDENTITY: Matrix2D;
  static fromValues(a: number, b: number, c: number, d: number, e: number, f: number): Matrix2D;
  static fromTransform(t: Transform2D): Matrix2D;
  static fromTranslation(tx: number, ty: number): Matrix2D;
  static fromRotation(angle: number): Matrix2D;
  static fromScale(sx: number, sy: number): Matrix2D;

  set(a: number, b: number, c: number, d: number, e: number, f: number): this;
  clone(): Matrix2D;
  copy(m: Matrix2D): this;
  identity(): this;

  multiply(m: Matrix2D): this;                      // this = this * m
  premultiply(m: Matrix2D): this;                   // this = m * this
  multiplyMatrices(a: Matrix2D, b: Matrix2D): this; // this = a * b
  translate(tx: number, ty: number): this;
  translateV(v: Vector2): this;
  scale(sx: number, sy: number): this;
  scaleV(v: Vector2): this;
  rotate(angle: number): this;
  skew(sx: number, sy: number): this;

  determinant(): number;
  invert(): this;                                   // 失败（不可逆）时置零矩阵并返回 false 语义？
  getInverse(target?: Matrix2D): Matrix2D;          // 返回新矩阵，不修改自身

  applyToPoint(x: number, y: number, target?: Vector2): Vector2;   // 含平移（齐次坐标 [x,y,1]）
  applyToVector(x: number, y: number, target?: Vector2): Vector2;  // 忽略平移
  applyToBox(box: Box2, target?: Box2): Box2;       // 变换 AABB 得到新 AABB
  decompose(): { translation: Vector2; rotation: number; scale: Vector2; skew: Vector2 };

  isIdentity(): boolean;
  equals(m: Matrix2D): boolean;
  toArray(target?: number[]): number[];             // [a,b,c,d,e,f]
  toString(): string;
}
```

### 3.6 math/Box2.ts — 轴对齐包围盒 (AABB)

```ts
class Box2 {
  min: Vector2;
  max: Vector2;
  constructor(min?: Vector2, max?: Vector2);

  static readonly EMPTY: Box2;                      // min=+∞, max=-∞
  static fromPoints(points: Vector2[]): Box2;
  static fromCenterAndSize(center: Vector2, size: Vector2): Box2;

  clone(): Box2;
  copy(b: Box2): this;
  isEmpty(): boolean;
  makeEmpty(): this;
  set(min: Vector2, max: Vector2): this;
  setFromPoints(points: Vector2[]): this;
  setFromCenterAndSize(center: Vector2, size: Vector2): this;
  setFromBoxes(a: Box2, b: Box2): this;             // 覆盖两盒的最小盒

  expandByPoint(p: Vector2): this;
  expandByVector(v: Vector2): this;
  expandByScalar(s: number): this;
  expandByBox(b: Box2): this;

  containsPoint(p: Vector2): boolean;
  containsBox(b: Box2): boolean;
  intersectsBox(b: Box2): boolean;
  distanceToPoint(p: Vector2): number;              // 边界外为最近距离，内部为 0

  getCenter(target?: Vector2): Vector2;
  getSize(target?: Vector2): Vector2;
  getWidth(): number;
  getHeight(): number;
  getArea(): number;
  getPerimeter(): number;
  getCorner(index: 0 | 1 | 2 | 3, target?: Vector2): Vector2;  // 顺时针: 左下/右下/右上/左上

  clampPoint(p: Vector2, target?: Vector2): Vector2;
  union(b: Box2): this;
  intersect(b: Box2): this;
  translate(v: Vector2): this;
  equals(b: Box2): boolean;
}
```

### 3.7 math/OBB.ts — 有向包围盒

```ts
class OBB {
  center: Vector2;
  halfExtents: Vector2;                             // 半宽、半高
  rotation: number;                                 // 弧度
  constructor(center?: Vector2, halfExtents?: Vector2, rotation?: number);

  static fromAABB(box: Box2, rotation?: number): OBB;

  clone(): OBB;
  copy(obb: OBB): this;
  set(center: Vector2, halfExtents: Vector2, rotation: number): this;

  getAxisX(target?: Vector2): Vector2;              // 局部 x 轴（含旋转）
  getAxisY(target?: Vector2): Vector2;
  getCorners(): [Vector2, Vector2, Vector2, Vector2];  // 顺时针四角
  getAABB(target?: Box2): Box2;                     // 世界 AABB

  containsPoint(p: Vector2): boolean;
  intersectsOBB(obb: OBB): boolean;                 // SAT 分离轴
  intersectsAABB(box: Box2): boolean;
  intersectsCircle(center: Vector2, radius: number): boolean;
  intersects(shape: ShapePrimitive): boolean;

  getArea(): number;
  translate(v: Vector2): this;
  setRotation(angle: number): this;
  equals(obb: OBB): boolean;
}
```

### 3.8 math/Transform2D.ts — 仿射变换

```ts
class Transform2D {
  position: Vector2;
  scale: Vector2;                                   // 默认 (1,1)
  rotation: number;                                 // 弧度
  skew: Vector2;                                    // 默认 (0,0)
  pivot: Vector2;                                   // 变换锚点（局部坐标），默认 (0,0)

  constructor();

  clone(): Transform2D;
  copy(t: Transform2D): this;
  setPosition(x: number, y: number): this;
  setScale(x: number, y: number): this;
  setRotation(angle: number): this;
  setSkew(x: number, y: number): this;
  setPivot(x: number, y: number): this;
  translate(x: number, y: number): this;            // 增量位移
  rotate(angle: number): this;                      // 增量旋转
  scaleBy(x: number, y: number): this;              // 增量缩放

  toMatrix(target?: Matrix2D): Matrix2D;            // 组合：T(position) * R * Skew * S，围绕 pivot
  fromMatrix(m: Matrix2D): this;                    // 分解回各分量
  isIdentity(): boolean;
  equals(t: Transform2D): boolean;
}
```

### 3.9 math/Arc.ts — 弧线

```ts
class Arc {
  center: Vector2;
  radius: number;
  startAngle: number;                               // 弧度
  endAngle: number;
  anticlockwise: boolean;
  constructor(center: Vector2, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean);

  get angleSpan(): number;                          // 实际跨角
  get length(): number;                             // 弧长 = |angleSpan| * radius
  pointAt(t: number, target?: Vector2): Vector2;    // t∈[0,1] 弧上点
  containsPoint(p: Vector2): boolean;
  getBoundingBox(target?: Box2): Box2;
  toPathBuilder(path?: PathBuilder): PathBuilder;   // 追加 moveTo+arc 指令
}
```

### 3.10 math/Bezier.ts — 贝塞尔曲线（二次/三次）

```ts
class Bezier {
  readonly isQuadratic: boolean;
  startPoint: Vector2;
  control1: Vector2;
  control2: Vector2 | null;                         // 二次为 null
  endPoint: Vector2;

  constructor(start: Vector2, control1: Vector2, control2: Vector2 | null, end: Vector2);
  static quadratic(start: Vector2, control: Vector2, end: Vector2): Bezier;
  static cubic(start: Vector2, c1: Vector2, c2: Vector2, end: Vector2): Bezier;
  static fromPoints(points: Vector2[], order?: 2 | 3): Bezier;  // 拟合（可选，后置）

  pointAt(t: number, target?: Vector2): Vector2;
  derivativeAt(t: number, target?: Vector2): Vector2;
  normalAt(t: number, target?: Vector2): Vector2;
  split(t: number): [Bezier, Bezier];
  get length(): number;                             // 数值积分近似
  getBoundingBox(target?: Box2): Box2;
  getPoints(segments?: number): Vector2[];          // 细分采样
  toPathBuilder(path?: PathBuilder): PathBuilder;   // 追加 quadraticCurveTo / bezierCurveTo
}
```

### 3.11 math/PathInstruction.ts — 路径指令类型

```ts
type PathInstructionType =
  | 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'bezierCurveTo'
  | 'arc' | 'arcTo' | 'rect' | 'closePath';

// 带标签联合：编译器可穷尽校验
type PathInstruction =
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'lineTo'; x: number; y: number }
  | { type: 'quadraticCurveTo'; cpx: number; cpy: number; x: number; y: number }
  | { type: 'bezierCurveTo'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { type: 'arc'; x: number; y: number; radius: number; startAngle: number; endAngle: number; anticlockwise?: boolean }
  | { type: 'arcTo'; x1: number; y1: number; x2: number; y2: number; radius: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'closePath' };

type PathData = PathInstruction[];
```

### 3.12 math/PathBuilder.ts — 路径构建器

```ts
class PathBuilder {
  constructor(instructions?: PathData);

  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this;
  rect(x: number, y: number, width: number, height: number): this;
  closePath(): this;

  append(path: PathBuilder): this;                  // 合并指令序列
  addPath(path: PathBuilder, transform?: Matrix2D): this;  // 先变换再合并
  clear(): this;
  clone(): PathBuilder;

  get instructions(): PathData;                     // 只读副本（避免外部篡改）
  get length(): number;                             // 指令条数
  get currentPoint(): Vector2 | null;               // 当前画笔位置（无 moveTo 前为 null）
  isEmpty(): boolean;

  getBoundingBox(target?: Box2): Box2;
  getPoints(segments?: number): Vector2[];          // 曲线细分后的采样点
  toPathData(): PathData;
}
```

### 3.13 math/Path2D.ts — 路径 2D 类（可复用于渲染与几何）

```ts
class Path2D {
  constructor(data?: PathData | Path2D | PathBuilder);

  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this;
  rect(x: number, y: number, width: number, height: number): this;
  closePath(): this;

  addPath(path: Path2D | PathData, transform?: Matrix2D): this;
  transform(matrix: Matrix2D): this;                // 对全部控制点做变换

  getBoundingBox(target?: Box2): Box2;
  getPoints(segments?: number): Vector2[];          // 几何细分采样（用于三角化/拾取）
  get length(): number;
  clone(): Path2D;
  toPathData(): PathData;
  static fromPoints(points: Vector2[]): Path2D;     // 逐段 lineTo
  static fromRect(x: number, y: number, w: number, h: number, radius?: number): Path2D;
  static fromCircle(cx: number, cy: number, radius: number): Path2D;
}
```

### 3.14 math/PathStroker.ts — 描边生成器

```ts
type LineCap = 'butt' | 'round' | 'square';
type LineJoin = 'miter' | 'round' | 'bevel';

interface StrokeOptions {
  width?: number;                                   // 默认 1
  cap?: LineCap;                                    // 默认 'butt'
  join?: LineJoin;                                  // 默认 'miter'
  miterLimit?: number;                              // 默认 10
  dash?: number[];                                  // 虚线序列，如 [4, 2]
  dashOffset?: number;                              // 默认 0
}

class PathStroker {
  constructor(options?: StrokeOptions);
  setOptions(options: StrokeOptions): this;
  getOptions(): Required<StrokeOptions>;
  stroke(path: PathBuilder | PathData): PathBuilder;  // 由路径生成描边轮廓（闭合轮廓，供填充渲染）
  // 说明：GPU 后端描边统一走本类生成几何；Canvas 后端可跳过直接调用原生 stroke
}
```

### 3.15 math/shapes/ShapePrimitive.ts — 图形原始接口

```ts
abstract class ShapePrimitive {
  abstract getBoundingBox(target?: Box2): Box2;
  abstract containsPoint(p: Vector2): boolean;
  abstract getArea(): number;
  abstract getPoints(segments?: number): Vector2[];   // 采样轮廓点
  abstract toPathBuilder(path?: PathBuilder): PathBuilder;
  abstract intersects(other: ShapePrimitive): boolean;
  abstract clone(): ShapePrimitive;
}
```

### 3.16 math/shapes/Rectangle.ts — 矩形

```ts
class Rectangle extends ShapePrimitive {
  x: number; y: number; width: number; height: number;
  constructor(x?: number, y?: number, width?: number, height?: number);

  static fromBox2(box: Box2): Rectangle;
  static fromPoints(points: Vector2[]): Rectangle;

  get left(): number; get right(): number; get top(): number; get bottom(): number;
  get center(): Vector2;
  get size(): Vector2;
  setFromBox2(box: Box2): this;
  expandBy(x: number, y: number): this;
  intersectsRect(other: Rectangle): boolean;
  containsRect(other: Rectangle): boolean;
  containsPoint(p: Vector2): boolean;
  getBoundingBox(target?: Box2): Box2;
  getArea(): number;
  getPoints(segments?: number): Vector2[];          // 4 角点
  toPathBuilder(path?: PathBuilder): PathBuilder;
  intersects(other: ShapePrimitive): boolean;
  clone(): Rectangle;
}
```

### 3.17 math/shapes/Circle.ts — 圆

```ts
class Circle extends ShapePrimitive {
  x: number; y: number; radius: number;
  constructor(x?: number, y?: number, radius?: number);

  get center(): Vector2;
  containsPoint(p: Vector2): boolean;
  distanceToPoint(p: Vector2): number;
  intersectsCircle(other: Circle): boolean;
  intersectsRect(rect: Rectangle): boolean;
  getBoundingBox(target?: Box2): Box2;
  getArea(): number;
  getCircumference(): number;
  getPoints(segments?: number): Vector2[];          // 默认 32 段
  toPathBuilder(path?: PathBuilder): PathBuilder;
  intersects(other: ShapePrimitive): boolean;
  clone(): Circle;
}
```

### 3.18 math/shapes/Ellipse.ts — 椭圆

```ts
class Ellipse extends ShapePrimitive {
  x: number; y: number; radiusX: number; radiusY: number;
  rotation: number;                                 // 弧度，默认 0
  constructor(x?: number, y?: number, radiusX?: number, radiusY?: number, rotation?: number);

  get center(): Vector2;
  containsPoint(p: Vector2): boolean;
  getBoundingBox(target?: Box2): Box2;
  getArea(): number;
  getPoints(segments?: number): Vector2[];          // 默认 48 段（考虑旋转）
  toPathBuilder(path?: PathBuilder): PathBuilder;
  intersects(other: ShapePrimitive): boolean;
  clone(): Ellipse;
}
```

### 3.19 math/shapes/Polygon.ts — 多边形

```ts
class Polygon extends ShapePrimitive {
  readonly points: Vector2[];                       // 顶点（第一个点与最后一点不必闭合）
  constructor(points: Vector2[]);

  get vertexCount(): number;
  get centroid(): Vector2;
  get signedArea(): number;                         // 正=逆时针（y 向下坐标系中视约定）
  isClockwise(): boolean;

  containsPoint(p: Vector2): boolean;               // 射线法
  getBoundingBox(target?: Box2): Box2;
  getArea(): number;
  getPoints(segments?: number): Vector2[];
  toPathBuilder(path?: PathBuilder): PathBuilder;
  intersects(other: ShapePrimitive): boolean;       // 边相交检测
  clone(): Polygon;
}
```

### 3.20 math/shapes/Triangle.ts — 三角形

```ts
class Triangle extends ShapePrimitive {
  a: Vector2; b: Vector2; c: Vector2;
  constructor(a?: Vector2, b?: Vector2, c?: Vector2);

  get centroid(): Vector2;
  getArea(): number;                                // 有符号
  getCircumcenter(target?: Vector2): Vector2;       // 外心
  getCircumradius(): number;
  containsPoint(p: Vector2): boolean;               // 重心坐标法
  getBoundingBox(target?: Box2): Box2;
  getPoints(segments?: number): Vector2[];
  toPathBuilder(path?: PathBuilder): PathBuilder;
  intersects(other: ShapePrimitive): boolean;
  clone(): Triangle;
}
```

## 四、math — 3D 数学库

> **首版可选**（见需求「风险与开放问题」）：2D 核心不依赖。以下为保持完整性给出的接口约定。

### 4.1 math/Vector3.ts — 三维向量

```ts
class Vector3 {
  x: number; y: number; z: number;
  constructor(x?: number, y?: number, z?: number);

  static ZERO: Vector3; static ONE: Vector3;
  static UP: Vector3; static DOWN: Vector3; static LEFT: Vector3; static RIGHT: Vector3;
  static FORWARD: Vector3; static BACK: Vector3;
  static fromArray(arr: number[], offset?: number): Vector3;

  set(x: number, y: number, z: number): this;
  clone(): Vector3; copy(v: Vector3): this;
  add(v: Vector3): this; addScalar(s: number): this; addVectors(a: Vector3, b: Vector3): this;
  sub(v: Vector3): this; subScalar(s: number): this; subVectors(a: Vector3, b: Vector3): this;
  multiply(v: Vector3): this; multiplyScalar(s: number): this;
  divide(v: Vector3): this; divideScalar(s: number): this;
  negate(): this; min(v: Vector3): this; max(v: Vector3): this;
  clamp(min: Vector3, max: Vector3): this; clampScalar(min: number, max: number): this;
  floor(): this; ceil(): this; round(): this;

  dot(v: Vector3): number;
  cross(v: Vector3): this;                         // 叉积
  length(): number; lengthSq(): number; manhattanLength(): number;
  distanceTo(v: Vector3): number; distanceToSquared(v: Vector3): number;
  angleTo(v: Vector3): number;
  normalize(): this; setLength(length: number): this;
  lerp(v: Vector3, alpha: number): this; lerpVectors(v1: Vector3, v2: Vector3, alpha: number): this;
  projectOnVector(v: Vector3): this; projectOnPlane(n: Vector3): this;
  reflect(normal: Vector3): this;
  applyMatrix3(m: Matrix3): this;
  applyMatrix4(m: Matrix4): this;                  // 齐次坐标，含平移
  transformDirection(m: Matrix4): this;            // 仅方向（忽略平移）
  applyQuaternion(q: Quaternion): this;
  equals(v: Vector3): boolean;
  toArray(target?: number[]): number[];
  toString(): string;
}
```

### 4.2 math/Vector4.ts — 四维向量

```ts
class Vector4 {
  x: number; y: number; z: number; w: number;
  constructor(x?: number, y?: number, z?: number, w?: number);
  static fromArray(arr: number[], offset?: number): Vector4;
  set(x: number, y: number, z: number, w: number): this;
  clone(): Vector4; copy(v: Vector4): this;
  add(v: Vector4): this; addScalar(s: number): this;
  sub(v: Vector4): this; subScalar(s: number): this;
  multiply(v: Vector4): this; multiplyScalar(s: number): this;
  divide(v: Vector4): this; divideScalar(s: number): this;
  negate(): this; dot(v: Vector4): number;
  length(): number; lengthSq(): number;
  distanceTo(v: Vector4): number; distanceToSquared(v: Vector4): number;
  normalize(): this; lerp(v: Vector4, alpha: number): this;
  equals(v: Vector4): boolean; toArray(target?: number[]): number[];
}
```

### 4.3 math/Matrix3.ts — 3x3 矩阵（列主序）

```ts
class Matrix3 {
  elements: number[];                               // 9 个元素，列主序
  constructor();                                    // 单位矩阵

  static fromMatrix4(m: Matrix4): Matrix3;

  set(elements: number[]): this;
  clone(): Matrix3; copy(m: Matrix3): this;
  identity(): this;
  multiply(m: Matrix3): this; premultiply(m: Matrix3): this;
  multiplyMatrices(a: Matrix3, b: Matrix3): this;
  multiplyScalar(s: number): this;
  transpose(): this; getInverse(target?: Matrix3): Matrix3; invert(): this;
  determinant(): number;

  setFromMatrix4(m: Matrix4): this;
  setFromQuaternion(q: Quaternion): this;           // 旋转矩阵
  scale(sx: number, sy: number): this;
  rotate(angle: number): this;
  translate(tx: number, ty: number): this;

  applyToVector2(v: Vector2): Vector2;              // 返回新向量
  applyToPoint2(v: Vector2): Vector2;               // 齐次坐标
  equals(m: Matrix3): boolean;
  toArray(target?: number[]): number[];
}
```

### 4.4 math/Matrix4.ts — 4x4 矩阵（列主序）

```ts
class Matrix4 {
  elements: number[];                               // 16 个元素，列主序
  constructor();                                    // 单位矩阵

  set(elements: number[]): this;
  clone(): Matrix4; copy(m: Matrix4): this;
  identity(): this;
  multiply(m: Matrix4): this; premultiply(m: Matrix4): this;
  multiplyMatrices(a: Matrix4, b: Matrix4): this;
  multiplyScalar(s: number): this;
  transpose(): this; invert(): this; getInverse(target?: Matrix4): Matrix4;
  determinant(): number;
  getMaxScaleOnAxis(): number;

  compose(position: Vector3, quaternion: Quaternion, scale: Vector3): this;
  decompose(position: Vector3, quaternion: Quaternion, scale: Vector3): this;

  makeTranslation(x: number, y: number, z: number): this;
  makeScale(x: number, y: number, z: number): this;
  makeRotationFromQuaternion(q: Quaternion): this;
  makeRotationX(theta: number): this; makeRotationY(theta: number): this; makeRotationZ(theta: number): this;
  makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
  makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
  makeLookAt(eye: Vector3, target: Vector3, up: Vector3): this;

  applyToVector3(v: Vector3): Vector3;              // 返回新向量
  applyToPoint(v: Vector3): Vector3;
  transformDirection(v: Vector3): Vector3;
  equals(m: Matrix4): boolean;
  toArray(target?: number[]): number[];
}
```

### 4.5 math/Box3.ts — 三维包围盒

```ts
class Box3 {
  min: Vector3; max: Vector3;
  constructor(min?: Vector3, max?: Vector3);
  static readonly EMPTY: Box3;
  static fromPoints(points: Vector3[]): Box3;
  static fromCenterAndSize(center: Vector3, size: Vector3): Box3;

  clone(): Box3; copy(b: Box3): this;
  isEmpty(): boolean; makeEmpty(): this;
  set(min: Vector3, max: Vector3): this;
  setFromPoints(points: Vector3[]): this;
  setFromCenterAndSize(center: Vector3, size: Vector3): this;
  expandByPoint(p: Vector3): this; expandByVector(v: Vector3): this;
  expandByScalar(s: number): this; expandByBox(b: Box3): this;
  containsPoint(p: Vector3): boolean; containsBox(b: Box3): boolean;
  intersectsBox(b: Box3): boolean;
  distanceToPoint(p: Vector3): number;
  getCenter(target?: Vector3): Vector3; getSize(target?: Vector3): Vector3;
  getVolume(): number; getSurfaceArea(): number;
  getBoundingSphere(target?: Sphere): Sphere;
  clampPoint(p: Vector3, target?: Vector3): Vector3;
  union(b: Box3): this; intersect(b: Box3): this;
  translate(v: Vector3): this;
  applyMatrix4(m: Matrix4): this;                  // 变换后重算 AABB
  equals(b: Box3): boolean;
}
```

### 4.6 math/Sphere.ts — 球体

```ts
class Sphere {
  center: Vector3; radius: number;
  constructor(center?: Vector3, radius?: number);
  static fromPoints(points: Vector3[]): Sphere;
  clone(): Sphere; copy(s: Sphere): this;
  set(center: Vector3, radius: number): this;
  setFromPoints(points: Vector3[]): this;
  isEmpty(): boolean; makeEmpty(): this;
  containsPoint(p: Vector3): boolean;
  distanceToPoint(p: Vector3): number;
  intersectsSphere(s: Sphere): boolean;
  clampPoint(p: Vector3, target?: Vector3): Vector3;
  getBoundingBox(target?: Box3): Box3;
  applyMatrix4(m: Matrix4): this;
  translate(v: Vector3): this;
  equals(s: Sphere): boolean;
}
```

### 4.7 math/Ray.ts — 射线

```ts
class Ray {
  origin: Vector3; direction: Vector3;              // direction 保持单位向量
  constructor(origin?: Vector3, direction?: Vector3);
  clone(): Ray; copy(r: Ray): this;
  set(origin: Vector3, direction: Vector3): this;
  at(t: number, target?: Vector3): Vector3;         // origin + t * direction
  recast(t: number): this;                          // 沿方向移动 origin
  closestPointToPoint(p: Vector3, target?: Vector3): Vector3;
  distanceToPoint(p: Vector3): number;
  distanceSqToPoint(p: Vector3): number;
  distanceSqToSegment(v0: Vector3, v1: Vector3): number;
  intersectsSphere(s: Sphere): boolean;
  intersectsBox(b: Box3): boolean;
  intersectsPlane(p: Plane): boolean;
  intersectSphere(s: Sphere, target?: Vector3): Vector3 | null;
  intersectBox(b: Box3, target?: Vector3): Vector3 | null;
  intersectPlane(p: Plane, target?: Vector3): Vector3 | null;
  intersectTriangle(a: Vector3, b: Vector3, c: Vector3, backfaceCulling?: boolean, target?: Vector3): Vector3 | null;
  applyMatrix4(m: Matrix4): this;
  equals(r: Ray): boolean;
}
```

### 4.8 math/Plane.ts — 平面

```ts
class Plane {
  normal: Vector3;                                  // 单位向量
  constant: number;                                 // ax+by+cz+d=0 的 d
  constructor(normal?: Vector3, constant?: number);
  clone(): Plane; copy(p: Plane): this;
  set(normal: Vector3, constant: number): this;
  setFromNormalAndCoplanarPoint(normal: Vector3, point: Vector3): this;
  setFromCoplanarPoints(a: Vector3, b: Vector3, c: Vector3): this;
  normalize(): this;
  distanceToPoint(p: Vector3): number;
  distanceToSphere(s: Sphere): number;
  projectPoint(p: Vector3, target?: Vector3): Vector3;
  intersectLine(line: Line3, target?: Vector3): Vector3 | null;
  intersectsLine(line: Line3): boolean;
  intersectsBox(b: Box3): boolean;
  intersectsSphere(s: Sphere): boolean;
  coplanarPoint(target?: Vector3): Vector3;
  applyMatrix4(m: Matrix4): this;                   // 变换后重新归一化
  translate(offset: Vector3): this;
  equals(p: Plane): boolean;
}
```

### 4.9 math/Frustum.ts — 视锥体

```ts
class Frustum {
  planes: Plane[];                                  // 6 个平面：近远/左/右/上/下
  constructor(planes?: Plane[]);
  clone(): Frustum; copy(f: Frustum): this;
  setFromProjectionMatrix(m: Matrix4): this;
  containsPoint(p: Vector3): boolean;
  intersectsBox(b: Box3): boolean;
  intersectsSphere(s: Sphere): boolean;
  intersectsObject?(bounds: Box3): boolean;         // 与渲染对象相交判定入口
  equals(f: Frustum): boolean;
}
```

### 4.10 math/Quaternion.ts — 四元数

```ts
class Quaternion {
  x: number; y: number; z: number; w: number;
  constructor(x?: number, y?: number, z?: number, w?: number);
  static slerp(a: Quaternion, b: Quaternion, t: number, target?: Quaternion): Quaternion;
  static fromAxisAngle(axis: Vector3, angle: number): Quaternion;
  static fromEuler(euler: Euler): Quaternion;
  static fromRotationMatrix(m: Matrix4): Quaternion;

  set(x: number, y: number, z: number, w: number): this;
  clone(): Quaternion; copy(q: Quaternion): this;
  identity(): this;
  setFromAxisAngle(axis: Vector3, angle: number): this;
  setFromEuler(euler: Euler): this;
  setFromRotationMatrix(m: Matrix4): this;
  setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this;
  multiply(q: Quaternion): this; premultiply(q: Quaternion): this;
  multiplyQuaternions(a: Quaternion, b: Quaternion): this;
  dot(q: Quaternion): number;
  invert(): this; conjugate(): this;
  normalize(): this; length(): number; lengthSq(): number;
  slerp(q: Quaternion, t: number): this;
  slerpQuaternions(a: Quaternion, b: Quaternion, t: number): this;
  angleTo(q: Quaternion): number;
  rotateTowards(q: Quaternion, step: number): this;
  equals(q: Quaternion): boolean;
  toArray(target?: number[]): number[];
}
```

### 4.11 math/Euler.ts — 欧拉角

```ts
type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';
class Euler {
  x: number; y: number; z: number;
  order: EulerOrder;                                // 默认 'XYZ'
  constructor(x?: number, y?: number, z?: number, order?: EulerOrder);
  set(x: number, y: number, z: number, order?: EulerOrder): this;
  clone(): Euler; copy(e: Euler): this;
  setFromQuaternion(q: Quaternion, order?: EulerOrder): this;
  setFromRotationMatrix(m: Matrix4, order?: EulerOrder): this;
  setFromVector3(v: Vector3, order?: EulerOrder): this;
  reorder(newOrder: EulerOrder): this;              // 保持旋转结果不变
  equals(e: Euler): boolean;
  toArray(target?: number[]): number[];
}
```

### 4.12 math/Spherical.ts — 球面坐标

```ts
class Spherical {
  radius: number;                                    // 默认 1
  phi: number;                                       // 与 +y 夹角（极角）
  theta: number;                                     // 绕 y 轴方位角
  constructor(radius?: number, phi?: number, theta?: number);
  set(radius: number, phi: number, theta: number): this;
  clone(): Spherical; copy(s: Spherical): this;
  makeSafe(): this;                                  // 限制 phi 避免极点奇异
  setFromVector3(v: Vector3): this;
  setFromCartesianCoords(x: number, y: number, z: number): this;
  toVector3(target?: Vector3): Vector3;
}
```

### 4.13 math/Triangle.ts — 三角形（3D）

```ts
class Triangle {
  a: Vector3; b: Vector3; c: Vector3;
  constructor(a?: Vector3, b?: Vector3, c?: Vector3);
  static getNormal(a: Vector3, b: Vector3, c: Vector3, target?: Vector3): Vector3;
  static getBarycoord(point: Vector3, a: Vector3, b: Vector3, c: Vector3, target?: Vector3): Vector3;
  static containsPoint(point: Vector3, a: Vector3, b: Vector3, c: Vector3): boolean;
  static getInterpolation?(...): ...;                // 可选：重心插值

  set(a: Vector3, b: Vector3, c: Vector3): this;
  clone(): Triangle; copy(t: Triangle): this;
  getArea(): number;
  getMidpoint(target?: Vector3): Vector3;
  getNormal(target?: Vector3): Vector3;
  getBarycoord(point: Vector3, target?: Vector3): Vector3;
  containsPoint(point: Vector3): boolean;
  closestPointToPoint(p: Vector3, target?: Vector3): Vector3;
  intersectsRay(ray: Ray): boolean;
  applyMatrix4(m: Matrix4): this;
  equals(t: Triangle): boolean;
}
```

### 4.14 math/Line3.ts — 三维线段

```ts
class Line3 {
  start: Vector3; end: Vector3;
  constructor(start?: Vector3, end?: Vector3);
  set(start: Vector3, end: Vector3): this;
  clone(): Line3; copy(l: Line3): this;
  at(t: number, target?: Vector3): Vector3;
  getCenter(target?: Vector3): Vector3;
  delta(target?: Vector3): Vector3;                 // end - start
  distanceSqToPoint(p: Vector3): number;
  distanceToPoint(p: Vector3): number;
  distanceSqToSegment(v0: Vector3, v1: Vector3): number;
  closestPointToPoint(p: Vector3, clampToLine: boolean, target?: Vector3): Vector3;
  applyMatrix4(m: Matrix4): this;
  equals(l: Line3): boolean;
}
```

### 4.15 math/Cylindrical.ts — 圆柱坐标

```ts
class Cylindrical {
  radius: number; theta: number; y: number;
  constructor(radius?: number, theta?: number, y?: number);
  set(radius: number, theta: number, y: number): this;
  clone(): Cylindrical; copy(c: Cylindrical): this;
  setFromVector3(v: Vector3): this;
  setFromCartesianCoords(x: number, y: number, z: number): this;
  toVector3(target?: Vector3): Vector3;
}
```

---

## 五、math — utils

### 5.1 math/utils/MathUtils.ts — 数学工具

```ts
class MathUtils {
  static readonly DEG2RAD: number;
  static readonly RAD2DEG: number;
  static readonly EPSILON: number;                  // 1e-6

  static degToRad(deg: number): number;
  static radToDeg(rad: number): number;

  static clamp(value: number, min: number, max: number): number;
  static clamp01(value: number): number;
  static lerp(a: number, b: number, t: number): number;
  static inverseLerp(a: number, b: number, value: number): number;
  static lerpAngle(a: number, b: number, t: number): number;   // 最短角度插值
  static normalizeAngle(angle: number): number;     // 归一化到 [-π, π]
  static smoothstep(x: number, min: number, max: number): number;

  static random(min?: number, max?: number): number;            // 默认 [0,1)
  static randomInt(min: number, max: number): number;           // 含端点
  static randomSign(): number;
  static shuffle<T>(arr: T[]): T[];

  static sign(value: number): number;
  static fract(value: number): number;
  static floor(v: number): number;
  static ceil(v: number): number;
  static round(v: number): number;

  static isPowerOfTwo(value: number): boolean;
  static nextPowerOfTwo(value: number): number;

  static distance(x1: number, y1: number, x2: number, y2: number): number;
  static distanceSq(x1: number, y1: number, x2: number, y2: number): number;

  static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
}
```

### 5.2 math/utils/earcut.ts — 耳剪三角剖分

```ts
// 内部实现为 earcut 算法（可内置，零运行时依赖）
function triangulate(
  vertices: ArrayLike<number>,                      // 顶点坐标扁平数组 [x0,y0,x1,y1,...]
  holeIndices?: number[],                           // 孔洞起始索引
  dim?: number,                                     // 维度，默认 2
): number[];                                        // 三角形顶点索引（每 3 个一组）

// 面向场景的封装：
function triangulatePolygon(points: Vector2[], holes?: Vector2[][], target?: number[]): number[];
```

### 5.3 math/utils/delaunator.ts — Delaunay 三角剖分

```ts
class Delaunator {
  static from(points: Vector2[] | ArrayLike<number>, getX?: (p: Vector2) => number, getY?: (p: Vector2) => number): Delaunator;
  readonly triangles: Uint32Array;                  // 三角形索引，每 3 个一组
  readonly halfedges: Int32Array;                   // 半边对
  readonly hull: Uint32Array;                       // 凸包顶点索引
  readonly coords: Float64Array;                    // 扁平坐标
  update(): void;                                   // 坐标变更后重建
}
```

---

## 六、scenes

> 层级：`Element(core) → DisplayObject → Shape → 具体图形`；`Container → Group`。
> 场景对象均支持 `on/off/once/emit`（继承 EventEmitter）。

### 6.1 scenes/DisplayObject.ts — 可显示对象

```ts
type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'lighter' | 'source-atop' | 'source-in' | 'source-out' | 'destination-over' | 'destination-in' | 'destination-out';

class DisplayObject extends Element {
  x: number;                                          // 本地坐标
  y: number;
  rotation: number;                                   // 弧度
  scaleX: number;                                     // 默认 1
  scaleY: number;
  skewX: number;                                      // 默认 0
  skewY: number;
  pivotX: number;                                     // 锚点（局部），默认 0
  pivotY: number;
  transform: Transform2D;                             // 组合变换（与以上字段互操作）

  visible: boolean;                                   // 默认 true
  alpha: number;                                      // [0,1]，默认 1
  interactive: boolean;                               // 默认 false，是否参与拾取/交互
  cursor: string;                                     // 悬停光标样式（CSS）
  hitArea?: ShapePrimitive;                           // 自定义命中区域
  mask?: DisplayObject | Path2D;                      // 裁剪遮罩
  blendMode: BlendMode;
  renderable: boolean;                                // false 时跳过渲染但保留在树中

  // 坐标变换
  getWorldTransform(target?: Matrix2D): Matrix2D;
  getLocalTransform(target?: Matrix2D): Matrix2D;
  localToGlobal(local: Vector2, target?: Vector2): Vector2;
  globalToLocal(global: Vector2, target?: Vector2): Vector2;

  // 包围盒
  getBounds(target?: Box2): Box2;                     // 世界包围盒
  getLocalBounds(target?: Box2): Box2;                // 本地包围盒

  // 命中
  hitTest(localPoint: Vector2): boolean;              // 本地坐标命中检测
  containsGlobalPoint(p: Vector2): boolean;

  // 渲染（内部，子类重写）
  protected render(renderer: Renderer): void;
  protected updateTransform(): void;                  // 脏标记时更新

  destroy(): void;
}
```

### 6.2 scenes/Container.ts — 容器

```ts
class Container extends DisplayObject {
  readonly children: DisplayObject[];
  sortableChildren: boolean;                          // 默认 false；true 时按 zIndex 排序
  width?: number;                                     // 可选：显式尺寸（影响 getBounds）
  height?: number;

  addChild<T extends DisplayObject>(child: T): T;
  addChildAt<T extends DisplayObject>(child: T, index: number): T;
  removeChild<T extends DisplayObject>(child: T): T;
  removeChildAt(index: number): DisplayObject;
  removeChildren(begin?: number, end?: number): DisplayObject[];
  getChildAt(index: number): DisplayObject;
  getChildIndex(child: DisplayObject): number;
  setChildIndex(child: DisplayObject, index: number): void;
  swapChildren(a: DisplayObject, b: DisplayObject): void;
  getChildByName(name: string, deep?: boolean): DisplayObject | undefined;
  sortChildren(): void;                               // 手动触发 zIndex 排序

  contains(child: DisplayObject): boolean;
  getChildren(): DisplayObject[];

  // 聚合包围盒 / 命中
  getBounds(target?: Box2): Box2;                     // 含子级
  hitTest(localPoint: Vector2): DisplayObject | null; // 逆序遍历子级，返回最上层命中
  hitTestAll(localPoint: Vector2): DisplayObject[];   // 命中链（从深到浅）

  protected renderChildren(renderer: Renderer): void;
  destroy(): void;                                    // 递归销毁子级
}
```

### 6.3 scenes/Group.ts — 组

```ts
// 与 Container 能力一致，提供逻辑分组语义；可附加统一的本地变换矩阵
class Group extends Container {
  localMatrix?: Matrix2D;                             // 可选：整体矩阵变换（与 transform 二选一）
  setMatrix(m: Matrix2D): this;
  clearMatrix(): this;
}
```

### 6.4 scenes/Shape.ts — 图形基类

```ts
type FillStyle = Color | Gradient | Pattern | string | null;
interface StrokeStyle {
  color?: ColorInput;
  width?: number;                                     // 默认 1
  cap?: LineCap;                                      // 'butt' | 'round' | 'square'
  join?: LineJoin;                                    // 'miter' | 'round' | 'bevel'
  miterLimit?: number;                                // 默认 10
  dash?: number[];
  dashOffset?: number;
  alignment?: 'inner' | 'center' | 'outer';           // 默认 'center'（GPU 后端近似）
}
interface ShadowStyle {
  color: ColorInput;                                  // 默认 '#000'
  blur: number;                                       // 默认 0
  offsetX: number;
  offsetY: number;
}

abstract class Shape extends DisplayObject {
  fill: FillStyle;
  stroke: StrokeStyle | null;
  shadow: ShadowStyle | null;
  opacity: number;                                    // [0,1]，等价 alpha 的渲染别名
  roundPixels: boolean;                               // 像素对齐，减少锯齿（Canvas 可选）

  setFill(fill: FillStyle): this;
  setStroke(stroke: StrokeStyle | null): this;
  setShadow(shadow: ShadowStyle | null): this;
  setBlendMode(mode: BlendMode): this;

  abstract getGeometry(): ShapePrimitive;             // 几何描述（供拾取/包围盒）
  abstract getLocalBounds(target?: Box2): Box2;
}
```

### 6.5 scenes/Rectangle.ts — 矩形

```ts
interface RectangleOptions {
  x?: number; y?: number; width?: number; height?: number;
  radius?: number | [number, number, number, number]; // 圆角：单值或 4 角
  fill?: FillStyle;
  stroke?: StrokeStyle;
  shadow?: ShadowStyle;
  rotation?: number; scaleX?: number; scaleY?: number; pivotX?: number; pivotY?: number;
}

class Rectangle extends Shape {
  constructor(options?: RectangleOptions);
  static create(options?: RectangleOptions): Rectangle;

  x: number; y: number; width: number; height: number;
  radius: number | [number, number, number, number];

  get left(): number; get right(): number; get top(): number; get bottom(): number;
  get center(): Vector2;
  setSize(width: number, height: number): this;
  setRadius(radius: number | number[]): this;
  getGeometry(): ShapePrimitive;                      // math/shapes/Rectangle
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.6 scenes/Circle.ts — 圆

```ts
interface CircleOptions {
  x?: number; y?: number; radius?: number;
  fill?: FillStyle; stroke?: StrokeStyle; shadow?: ShadowStyle;
  rotation?: number; scaleX?: number; scaleY?: number;
}

class Circle extends Shape {
  constructor(options?: CircleOptions);
  static create(options?: CircleOptions): Circle;
  x: number; y: number; radius: number;
  get center(): Vector2;
  setRadius(radius: number): this;
  getGeometry(): ShapePrimitive;                      // math/shapes/Circle
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.7 scenes/Ellipse.ts — 椭圆

```ts
interface EllipseOptions {
  x?: number; y?: number; radiusX?: number; radiusY?: number;
  rotation?: number;
  fill?: FillStyle; stroke?: StrokeStyle; shadow?: ShadowStyle;
}

class Ellipse extends Shape {
  constructor(options?: EllipseOptions);
  static create(options?: EllipseOptions): Ellipse;
  x: number; y: number; radiusX: number; radiusY: number;
  rotation: number;
  get center(): Vector2;
  getGeometry(): ShapePrimitive;                      // math/shapes/Ellipse
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.8 scenes/Polygon.ts — 多边形

```ts
interface PolygonOptions {
  points?: Vector2[] | number[];                      // 支持 [x0,y0,x1,y1,...]
  x?: number; y?: number;                             // 整体偏移（可选）
  fill?: FillStyle; stroke?: StrokeStyle; shadow?: ShadowStyle;
}

class Polygon extends Shape {
  constructor(options?: PolygonOptions);
  static fromPoints(points: Vector2[]): Polygon;
  readonly points: Vector2[];
  get vertexCount(): number;
  get centroid(): Vector2;
  setPoints(points: Vector2[]): this;
  addPoint(p: Vector2): this;
  getGeometry(): ShapePrimitive;                      // math/shapes/Polygon
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.9 scenes/Path.ts — 路径

```ts
class Path extends Shape {
  constructor(data?: PathData | PathBuilder | Path2D, options?: { fill?; stroke?; shadow? });
  static fromData(data: PathData): Path;

  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this;
  rect(x: number, y: number, width: number, height: number): this;
  closePath(): this;
  clear(): this;

  get instructions(): PathData;
  getGeometry(): ShapePrimitive;                      // 细分后的多边形近似
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.10 scenes/Image.ts — 图像

```ts
type ImageSource = Asset | HTMLImageElement | HTMLCanvasElement | ImageBitmap | string;  // string: url

interface ImageOptions {
  x?: number; y?: number; width?: number; height?: number;
  source?: ImageSource;
  fit?: 'none' | 'contain' | 'cover' | 'fill';        // 默认 'none'（拉伸到 width/height）
  flipX?: boolean; flipY?: boolean;
  tint?: ColorInput;                                  // 可选着色
  round?: number;                                     // 圆角裁剪（可选）
  alpha?: number;
}

class Image extends DisplayObject {
  constructor(options?: ImageOptions);
  source: ImageSource;
  width: number; height: number;
  fit: 'none' | 'contain' | 'cover' | 'fill';
  flipX: boolean; flipY: boolean;
  tint: Color | null;

  setSource(source: ImageSource): this;
  setSize(width: number, height: number): this;
  get naturalWidth(): number;
  get naturalHeight(): number;
  getLocalBounds(target?: Box2): Box2;
  // 事件：'load' | 'error'
  on(event: 'load', listener: () => void): this;
}
```

### 6.11 scenes/Text.ts — 文本

```ts
interface TextStyle {
  fontFamily: string | string[];                      // 回退列表，默认 'sans-serif'
  fontSize: number;                                   // px，默认 16
  fontWeight?: number | 'normal' | 'bold' | 'lighter' | 'bolder';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  lineHeight?: number;                                // 默认 1.2 * fontSize
  letterSpacing?: number;                             // 默认 0
  align?: 'left' | 'center' | 'right';                // 默认 'left'
  baseline?: 'top' | 'middle' | 'bottom';             // 默认 'top'
  maxWidth?: number;                                  // 超出截断/缩放（默认 0=不限）
  whiteSpace?: 'normal' | 'nowrap' | 'pre';           // 换行策略，默认 'normal'
  wordWrap?: boolean;                                 // 默认 true（whiteSpace='normal' 时）
  breakWords?: boolean;                               // 强制断词
}

interface TextOptions extends TextStyle {
  x?: number; y?: number;
  text?: string;
  fill?: FillStyle;
  stroke?: StrokeStyle;
  shadow?: ShadowStyle;
  rotation?: number; scaleX?: number; scaleY?: number;
}

class Text extends DisplayObject {
  constructor(options?: TextOptions);
  text: string;
  style: TextStyle;                                   // 赋值即触发脏标记

  setText(text: string): this;
  setStyle(style: Partial<TextStyle>): this;

  get textWidth(): number;                            // 测量宽度（本地坐标系）
  get textHeight(): number;
  measureText(style?: Partial<TextStyle>): { width: number; height: number; fontMetrics: { ascent: number; descent: number; lineHeight: number } };
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.12 scenes/Star.ts — 星形

```ts
interface StarOptions {
  x?: number; y?: number;
  points?: number;                                    // 角数，默认 5，最小 3
  outerRadius?: number;                               // 外接半径
  innerRadius?: number;                               // 内接半径；缺省 = outer * 0.5
  rotation?: number;                                  // 初始旋转角
  fill?: FillStyle; stroke?: StrokeStyle; shadow?: ShadowStyle;
}

class Star extends Shape {
  constructor(options?: StarOptions);
  points: number; outerRadius: number; innerRadius: number;
  rotation: number;
  setPoints(points: number): this;
  setRadius(outer: number, inner?: number): this;
  getGeometry(): ShapePrimitive;                      // 由顶点构造 Polygon
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.13 scenes/Line.ts — 线段

```ts
interface LineOptions {
  points?: Vector2[] | number[];                      // 至少 2 点
  x?: number; y?: number;                             // 整体偏移
  closePath?: boolean;                                // 默认 false
  curve?: boolean;                                    // 默认 false；true 时平滑曲线连接（可选）
  stroke: StrokeStyle;                                // 线段必须有描边
  shadow?: ShadowStyle;
}

class Line extends Shape {
  constructor(options?: LineOptions);
  readonly points: Vector2[];
  closePath: boolean;
  curve: boolean;
  setPoints(points: Vector2[]): this;
  addPoint(p: Vector2): this;
  getLength(): number;                                // 路径累计长度
  getLocalBounds(target?: Box2): Box2;
}
```

### 6.14 scenes/GraphicPath.ts — 自定义路径图形

```ts
// 组合 PathBuilder 能力 + Shape 样式，独立画布式绘制入口
class GraphicPath extends Shape {
  constructor(options?: { fill?; stroke?; shadow? });

  moveTo(x: number, y: number): this;
  lineTo(x: number, y: number): this;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): this;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): this;
  rect(x: number, y: number, width: number, height: number): this;
  closePath(): this;

  beginPath(): this;                                  // 清空当前路径
  clear(): this;

  getLocalBounds(target?: Box2): Box2;
}
```

---

## 七、assets — 资产系统

### 7.1 assets/AssetType.ts — 资产类型

```ts
enum AssetType {
  Image = 'image',        // HTMLImageElement / ImageBitmap
  Texture = 'texture',    // GPU 纹理（后端创建）
  JSON = 'json',
  Binary = 'binary',      // ArrayBuffer
  SVG = 'svg',            // 解析为图像（可选）
  Font = 'font',          // 转交字体系统
  DataURL = 'dataurl',    // 可选
}
```

### 7.2 assets/Asset.ts — 资产类

```ts
type AssetState = 'idle' | 'loading' | 'ready' | 'error';

class Asset {
  readonly id: string;
  readonly type: AssetType;
  readonly url?: string;
  data: unknown;                                      // 解码后的数据（Image/JSON/ArrayBuffer...）
  state: AssetState;
  error?: Error;

  constructor(id: string, type: AssetType, url?: string, data?: unknown);

  load(): Promise<Asset>;                             // 通过 AssetLoader 加载并写入 data
  get<T>(): T;                                        // 类型化取数据：asset.get<HTMLImageElement>()
  get isReady(): boolean;
  get isError(): boolean;
  dispose(): void;                                    // 释放数据引用（如 revokeObjectURL）
  destroy(): void;
}
```

### 7.3 assets/AssetLoader.ts — 资产加载系统

```ts
type AssetLoaderFn = (url: string, options?: LoadOptions) => Promise<unknown>;

interface LoadOptions {
  crossOrigin?: string;                               // 图片跨域，默认 'anonymous'
  timeout?: number;                                   // 默认 0（不限）
  headers?: Record<string, string>;                   // fetch 类请求
}

class AssetLoader {
  load(url: string, type: AssetType, options?: LoadOptions): Promise<unknown>;
  loadImage(url: string, options?: LoadOptions): Promise<HTMLImageElement>;
  loadJson(url: string, options?: LoadOptions): Promise<unknown>;
  loadBinary(url: string, options?: LoadOptions): Promise<ArrayBuffer>;

  // 自定义加载器注册
  static registerLoader(type: AssetType, loader: AssetLoaderFn): void;
  static unregisterLoader(type: AssetType): void;
  static getLoader(type: AssetType): AssetLoaderFn;
}
```

### 7.4 assets/AssetManager.ts — 资产管理器

```ts
interface LoadOptionsEx extends LoadOptions { type?: AssetType; }

class AssetManager {
  load(id: string, url: string, options?: LoadOptionsEx): Promise<Asset>;
  loadMultiple(entries: Array<{ id: string; url: string; type?: AssetType }>, options?: LoadOptions): Promise<Asset[]>;  // 并行加载
  get(id: string): Asset | undefined;
  getOrLoad(id: string, url: string, options?: LoadOptionsEx): Promise<Asset>;  // 已有则直接返回
  has(id: string): boolean;
  release(id: string): boolean;                       // 移除并 dispose
  releaseAll(): void;

  get isLoading(): boolean;
  get progress(): number;                             // 0-1（当前批次）
  get size(): number;                                 // 已缓存资产数

  on(event: 'progress', listener: (p: { loaded: number; total: number }) => void): this;
  on(event: 'complete', listener: (assets: Asset[]) => void): this;
  on(event: 'error', listener: (e: { id: string; url: string; error: Error }) => void): this;
  destroy(): void;
}
```

### 7.5 assets/AssetCache.ts — 资产缓存

```ts
class AssetCache {
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  get size(): number;
  keys(): string[];
  values(): unknown[];
  forEach(callback: (value: unknown, key: string) => void): void;
}
```

---

## 八、fonts — 字体系统

### 8.1 fonts/FontType.ts — 字体类型

```ts
enum FontType {
  TTF = 'ttf',
  OTF = 'otf',
  WOFF = 'woff',
  WOFF2 = 'woff2',
  EOT = 'eot',
}
```

### 8.2 fonts/Font.ts — 字体类

```ts
interface FontOptions {
  family: string;                                     // 注册名（如 'Roboto'）
  weight?: number | 'normal' | 'bold';                // 默认 'normal'
  style?: 'normal' | 'italic';                        // 默认 'normal'
  urls?: string[];                                    // 字体文件地址（可多个格式）
  source?: ArrayBuffer | string;                      // 直接传入数据（可选）
  preload?: boolean;                                  // 默认 false
}

class Font {
  readonly family: string;
  readonly weight: number | 'normal' | 'bold';
  readonly style: 'normal' | 'italic';
  readonly urls: string[];
  state: AssetState;

  constructor(options: FontOptions);
  static fromFamily(family: string): Font;            // 仅声明系统字体，不加载文件

  load(): Promise<Font>;
  get isLoaded(): boolean;
  get cssFont(): string;                              // 'normal bold 16px "Roboto"' 的字体简写（weight/style 部分）
  dispose(): void;
}
```

### 8.3 fonts/FontLoader.ts — 字体加载系统

```ts
class FontLoader {
  load(font: Font): Promise<Font>;                    // 通过 FontFace API 注册
  static isFontFaceSupported(): boolean;
  // 兜底：不支持 FontFace 时用 @font-face 注入 <style>（可选）
}
```

### 8.4 fonts/FontManager.ts — 字体管理器

```ts
class FontManager {
  register(font: Font): void;                         // 同名（family+weight+style）覆盖
  registerMany(fonts: Font[]): void;
  get(family: string, weight?: number | string, style?: string): Font | undefined;
  has(family: string, weight?: number | string, style?: string): boolean;
  loadAll(): Promise<Font[]>;
  isLoaded(family: string, weight?: number | string, style?: string): boolean;

  measureText(text: string, style: { fontFamily; fontSize; fontWeight?; fontStyle?; lineHeight?; letterSpacing? }): {
    width: number; height: number;
    ascent: number; descent: number; lineHeight: number;
  };
  clear(): void;
}
```

### 8.5 fonts/FontCache.ts — 字体缓存

```ts
// 缓存 FontFace 实例与文本测量结果（LRU）
class FontCache {
  get(key: string): Font | undefined;
  set(key: string, font: Font): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  get size(): number;
}
```

---

## 九、animation — 动画系统

### 9.1 animation/AnimationInterpolator.ts — 动画插值器

```ts
class AnimationInterpolator {
  // 按值类型自动选择插值实现（number/Vector2/Vector3/Color/boolean）
  static interpolate(from: unknown, to: unknown, t: number, type?: AnimationInterpolatorType): unknown;

  // 显式类型入口
  static number(from: number, to: number, t: number): number;
  static angle(from: number, to: number, t: number): number;        // 最短角路径
  static vector2(from: Vector2, to: Vector2, t: number, target?: Vector2): Vector2;
  static vector3(from: Vector3, to: Vector3, t: number, target?: Vector3): Vector3;
  static color(from: Color, to: Color, t: number, target?: Color): Color;
  static boolean(from: boolean, to: boolean, t: number): boolean;   // t<1 取 from
  static step(from: unknown, to: unknown, t: number): unknown;      // t<1 取 from

  // 批量插值（数组逐元素）
  static array(from: unknown[], to: unknown[], t: number): unknown[];

  static detectType(value: unknown): AnimationInterpolatorType;     // 值类型推断
}
```

### 9.2 animation/AnimationInterpolatorType.ts — 插值器类型

```ts
enum AnimationInterpolatorType {
  Number = 'number',      // 数值
  Vector2 = 'vector2',    // Vector2 / {x,y}
  Vector3 = 'vector3',
  Color = 'color',        // Color / string
  Boolean = 'boolean',    // step 跳变
  Step = 'step',          // 离散跳变
  Angle = 'angle',        // 最短角路径插值
}
```

### 9.3 animation/AnimationKeyFrame.ts — 动画关键帧

```ts
type EasingFunction = (t: number) => number;          // 定义见 Easing.ts

class AnimationKeyFrame {
  time: number;                                       // 秒（>=0）
  value: number | Vector2 | Vector3 | Color | string | boolean | Record<string, unknown>;
  easing?: EasingFunction | string;                   // 该帧的缓动（默认由轨道/动画提供）
  constructor(time: number, value: unknown, easing?: EasingFunction | string);
  clone(): AnimationKeyFrame;
}
```

### 9.4 animation/AnimationTrack.ts — 动画轨道

```ts
class AnimationTrack {
  target: unknown;                                    // 动画目标对象
  property: string;                                   // 'x' | 'scale.x'（点路径）
  keyframes: AnimationKeyFrame[];                     // 按 time 升序
  interpolator?: AnimationInterpolatorType;           // 默认按值类型推断

  constructor(target?: unknown, property?: string, keyframes?: AnimationKeyFrame[]);

  addKeyframe(keyframe: AnimationKeyFrame): this;
  addKey(time: number, value: unknown, easing?: EasingFunction | string): this;
  removeKeyframe(time: number): boolean;
  sortKeyframes(): void;

  sample(time: number, target?: unknown): unknown;    // 插值结果
  evaluate(time: number): void;                       // 写入 this.target[property]
  get duration(): number;                             // 末帧时间
  get isEmpty(): boolean;
  clone(): AnimationTrack;
}
```

### 9.5 animation/AnimationClip.ts — 动画剪辑

```ts
class AnimationClip {
  readonly id: number;
  name?: string;
  duration: number;                                   // 秒
  tracks: AnimationTrack[];

  constructor(name?: string, duration?: number, tracks?: AnimationTrack[]);
  static fromJSON(data: AnimationClipJSON): AnimationClip;
  static fromTracks(tracks: AnimationTrack[]): AnimationClip;

  addTrack(track: AnimationTrack): this;
  removeTrack(track: AnimationTrack): boolean;
  getTrack(name?: string): AnimationTrack | undefined;
  get durationSeconds(): number;                      // 重算（取各轨末帧 max）
  sample(time: number): void;                         // 应用到所有轨道
  toJSON(): AnimationClipJSON;
  clone(): AnimationClip;
}
```

### 9.6 animation/Animation.ts — 动画实例

```ts
class Animation {
  readonly id: number;
  clip: AnimationClip;
  target?: unknown;                                   // 覆盖 clip 轨道目标（可选）
  loop: boolean | number;                             // true=无限，number=次数，默认 false
  playbackRate: number;                               // 默认 1
  paused: boolean;
  time: number;                                       // 当前播放时间（秒）

  constructor(clip: AnimationClip | { name?; duration?; tracks? }, options?: AnimationOptions);
  static fromJSON(data: AnimationClipJSON): Animation;

  play(): this;
  pause(): this;
  resume(): this;
  stop(reset?: boolean): this;                        // 停止；reset=true 归零（默认 true）
  seek(time: number): this;                           // 跳转（自动采样）
  setTarget(target: unknown): this;                   // 未用 clip.target 时指定

  get isPlaying(): boolean;
  get progress(): number;                             // 0-1
  get completed(): boolean;

  on(event: 'start' | 'complete' | 'stop' | 'loop', listener: () => void): this;
  on(event: 'update', listener: (time: number) => void): this;
  destroy(): void;
}
```

### 9.7 animation/AnimationSystem.ts — 动画系统

```ts
class AnimationSystem {
  add(animation: Animation): void;
  addClip(clip: AnimationClip, target?: unknown): Animation;   // 便捷：clip→动画实例并加入
  remove(animation: Animation): void;
  removeAll(): void;
  pauseAll(): void;
  resumeAll(): void;
  stopAll(): void;
  seekAll(time: number): void;
  get(id: number): Animation | undefined;

  get isPlaying(): boolean;
  get count(): number;

  update(deltaTime: number): void;                    // 引擎每帧调用
  destroy(): void;
}
```

### 9.8 animation/Easing.ts — 缓动函数

```ts
const Easing: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInSine, easeOutSine, easeInOutSine,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeInCirc, easeOutCirc, easeInOutCirc,
  easeInBack, easeOutBack, easeInOutBack,
  easeInElastic, easeOutElastic, easeInOutElastic,
  easeInBounce, easeOutBounce, easeInOutBounce,
};

// 工具
function getEasing(nameOrFn: string | EasingFunction): EasingFunction;  // 无效名回退 linear
function easingInOut(ease: EasingFunction): EasingFunction;             // 组合平滑
```

---

## 十、interaction — 交互系统

### 10.1 interaction/PointerEvent.ts — 指针事件（引擎对象）

```ts
type PointerEventType =
  | 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'
  | 'pointerover' | 'pointerout' | 'pointerenter' | 'pointerleave';

class PointerEvent {
  readonly type: PointerEventType;
  readonly pointerId: number;
  readonly pointerType: 'mouse' | 'touch' | 'pen';
  readonly isPrimary: boolean;
  readonly button: number;                            // 0/1/2...
  readonly buttons: number;                           // 位掩码
  readonly x: number;                                 // 舞台坐标
  readonly y: number;
  readonly localX: number;                            // 相对 currentTarget
  readonly localY: number;
  readonly pressure: number;                          // 0-1
  readonly width: number; readonly height: number;    // 触点尺寸
  readonly altKey: boolean; readonly ctrlKey: boolean;
  readonly metaKey: boolean; readonly shiftKey: boolean;
  readonly target: DisplayObject | null;
  readonly currentTarget: DisplayObject | null;
  readonly originalEvent: globalThis.PointerEvent;    // DOM 原始事件

  stopPropagation(): void;
  preventDefault(): void;
  get propagationStopped(): boolean;
}
```

### 10.2 interaction/KeyboardEvent.ts — 键盘事件

```ts
type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';

class KeyboardEvent {
  readonly type: KeyboardEventType;
  readonly key: string;                               // 'a' / 'Enter'
  readonly code: string;                              // 'KeyA' / 'Enter'
  readonly keyCode: number;                           // 已废弃 DOM 值，兼容保留
  readonly repeat: boolean;
  readonly altKey: boolean; readonly ctrlKey: boolean;
  readonly metaKey: boolean; readonly shiftKey: boolean;
  readonly target: Element | null;
  readonly originalEvent: globalThis.KeyboardEvent;

  stopPropagation(): void;
  preventDefault(): void;
}
```

### 10.3 interaction/PointerEventHandler.ts — DOM 指针事件处理

```ts
class PointerEventHandler {
  constructor(canvas: HTMLCanvasElement, interaction: InteractionSystem, options?: { pointermoveThrottle?: number });
  enable(): void;                                     // 绑定 pointerdown/move/up/cancel/over/out 等
  disable(): void;
  // 内部：将 DOM PointerEvent 转译为引擎 PointerEvent 并分发
  handlePointerDown(e: globalThis.PointerEvent): void;
  handlePointerMove(e: globalThis.PointerEvent): void;
  handlePointerUp(e: globalThis.PointerEvent): void;
  handlePointerCancel(e: globalThis.PointerEvent): void;
  destroy(): void;
}
```

### 10.4 interaction/KeyboardEventHandler.ts — DOM 键盘事件处理

```ts
class KeyboardEventHandler {
  constructor(target: Window | HTMLElement, interaction: InteractionSystem);
  enable(): void;                                     // 绑定 keydown/keyup/keypress
  disable(): void;
  handleKeyDown(e: globalThis.KeyboardEvent): void;
  handleKeyUp(e: globalThis.KeyboardEvent): void;
  destroy(): void;
}
```

### 10.5 interaction/InteractionSystem.ts — 交互系统

```ts
class InteractionSystem {
  enabled: boolean;
  cursor: string;                                     // 命中 interactive 对象时应用的光标

  enable(): void;
  disable(): void;

  hitTest(x: number, y: number): DisplayObject | null;  // 舞台坐标 → 顶层命中对象
  hitTestAll(x: number, y: number): DisplayObject[];    // 命中链

  // 事件分发（对象上监听）
  // 对象侧：shape.on('pointerdown', (e: PointerEvent) => {}) 等
  // 引擎全局侧（根容器可监听）：stage.on('pointermove', ...)

  setPointerOverCursor(cursor: string): this;
  destroy(): void;
}
```

---

## 十一、particles — 粒子系统

### 11.1 particles/ParticleEmitter.ts — 粒子发射器

```ts
interface EmitterOptions {
  position?: Vector2 | { x: number; y: number };
  emissionRate?: number;                              // 每秒发射数，默认 10
  maxParticles?: number;                              // 默认 1000
  lifetime?: [number, number];                        // 粒子寿命范围（秒），默认 [1, 1]
  angle?: number;                                     // 发射基准角（弧度），默认 0
  spread?: number;                                    // 发射角度散布（弧度），默认 2π
  speed?: [number, number];                           // 初速范围
  acceleration?: Vector2;                             // 恒定加速度（如重力 {0, 200}）
  gravity?: number;                                   // 简化重力（可选，与 acceleration 二选一）
  startSize?: [number, number];                       // 初始尺寸范围
  endSize?: [number, number];                         // 结束时尺寸范围（0 = 保持 startSize）
  startColor?: ColorInput;                            // 初始颜色
  endColor?: ColorInput;                              // 结束时颜色（渐变过渡）
  startAlpha?: [number, number];                      // 初始透明度范围，默认 [1, 1]
  endAlpha?: number;                                  // 结束时透明度，默认 0
  startRotation?: [number, number];                   // 初始旋转范围
  rotationSpeed?: [number, number];                   // 角速度范围
  texture?: ImageSource;                              // 粒子贴图；缺省为圆形色块
  blendMode?: BlendMode;                              // 默认 'normal'
  autoStart?: boolean;                                // 默认 true
}

class ParticleEmitter {
  constructor(options?: EmitterOptions);
  readonly position: Vector2;
  options: Required<Omit<EmitterOptions, 'texture'>>; // 修改后需 emit 前生效

  start(): void;
  stop(clearExisting?: boolean): void;                // clearExisting 默认 false
  pause(): void;
  resume(): void;
  emitOne(): void;                                    // 手动发射单个粒子
  emitBurst(count: number): void;                     // 一次性爆发

  update(deltaTime: number): void;                    // 引擎每帧调用
  get isPlaying(): boolean;
  get particleCount(): number;
  clear(): void;                                      // 清除所有存活粒子
  destroy(): void;
}
```

### 11.2 particles/ParticleContainer.ts — 粒子容器

```ts
class ParticleContainer extends Container {
  readonly emitters: ParticleEmitter[];
  autoUpdate: boolean;                                // 默认 true；引擎自动调用 update

  addEmitter(emitter: ParticleEmitter): this;
  removeEmitter(emitter: ParticleEmitter): this;
  removeAllEmitters(): void;
  getEmitter(index: number): ParticleEmitter | undefined;
  get particleCount(): number;

  update(deltaTime: number): void;                    // 更新全部发射器
  updateAndRender(deltaTime: number, renderer: Renderer): void;  // 独立渲染通道（GPU 后端批处理优化点）
  clear(): void;
  destroy(): void;
}
```

---

## 十二、plugins — 插件系统

### 12.1 plugins/PluginSystem.ts — 插件系统

```ts
interface Plugin {
  name: string;
  version?: string;
  install?(engine: Engine): void;                     // 注册时调用（同步）
  init?(engine: Engine): void | Promise<void>;        // 引擎 init 后调用
  update?(deltaTime: number, engine: Engine): void;   // 每帧
  render?(renderer: Renderer, engine: Engine): void;  // 渲染后钩子
  destroy?(engine: Engine): void;
}

class PluginSystem {
  use(plugin: Plugin | ((engine: Engine) => Plugin)): this;  // 函数式插件
  unuse(name: string): this;                          // 调用其 destroy 并移除
  get(name: string): Plugin | undefined;
  has(name: string): boolean;
  get count(): number;
  get names(): string[];

  initAll(): Promise<void>;                           // 引擎 init 后由 Engine 调用
  updateAll(deltaTime: number): void;                 // 每帧
  renderAll(renderer: Renderer): void;
  destroyAll(): void;
}
```

---

## 十三、picking — 图形拾取系统

### 13.1 picking/Pickup.ts — 拾取基类

```ts
abstract class Pickup {
  readonly type: 'color' | 'shape';
  abstract hitTest(x: number, y: number, scene: Container): DisplayObject | null;
  abstract destroy(): void;
}
```

### 13.2 picking/ShapePickup.ts — 几何拾取

```ts
class ShapePickup extends Pickup {
  constructor(options?: { cullByBounds?: boolean });   // 默认先 AABB 预筛
  readonly type: 'shape';

  hitTest(x: number, y: number, scene: Container): DisplayObject | null;   // 仅检测 interactive 对象
  hitTestAll(x: number, y: number, scene: Container): DisplayObject[];     // 命中链（深→浅）
  setCullByBounds(enable: boolean): this;
  destroy(): void;
}
```

### 13.3 picking/ColorPickup.ts — 颜色拾取

```ts
class ColorPickup extends Pickup {
  constructor(renderer: Renderer, options?: { scale?: number });  // 离屏缓冲默认按渲染尺寸 1:1
  readonly type: 'color';

  // 将对象的稳定 id 编码为 RGBA 颜色，离屏渲染后按像素颜色反查
  hitTest(x: number, y: number, scene: Container): DisplayObject | null;
  register(obj: DisplayObject, id?: number): void;    // 显式注册 id（可选；默认自动分配）
  unregister(obj: DisplayObject): void;
  rebuild(scene: Container): void;                    // 场景结构变化后重建编码表与缓冲
  clearBuffer(): void;
  destroy(): void;
}
```

### 13.4 picking/PickupSystem.ts — 拾取系统

```ts
type PickupStrategy = 'shape' | 'color' | 'auto';

class PickupSystem {
  constructor(engine: Engine, options?: { strategy?: PickupStrategy });
  readonly strategy: PickupStrategy;

  hitTest(x: number, y: number): DisplayObject | null;
  hitTestAll(x: number, y: number): DisplayObject[];
  setStrategy(strategy: PickupStrategy): void;
  // 'auto'：GPU 后端 → color；canvas 后端 → shape（可配置）
  // 场景变更后无需手动调用 rebuild（引擎自动同步）
  destroy(): void;
}
```

---

## 十四、renderers — 渲染后端

> 三端目录**待实现**。本节定义公共接口约定，各后端实现 `BackendAdapter`。

### 14.1 renderers/BackendAdapter.ts（公共接口，新增）

```ts
interface BackendAdapter {
  readonly type: BackendType;
  init(canvas: HTMLCanvasElement, options: RendererOptions): void | Promise<void>;
  resize(width: number, height: number, dpr: number): void;
  clear(color: Color): void;
  render(commands: RenderCommand[], viewport: { width: number; height: number }): void;
  createTexture(source: ImageSource): BackendTexture;   // 上传纹理
  createRenderTexture(width: number, height: number): RenderTexture;
  getContext(): WebGL2RenderingContext | GPUDevice | CanvasRenderingContext2D | null;
  getStats(): RenderStats;
  destroy(): void;
}
```

### 14.2 renderers/RenderCommand.ts（公共接口，新增）

```ts
type RenderCommand =
  | { kind: 'fill'; path: PathData; fill: FillStyle; transform: Matrix2D; alpha: number; blendMode: BlendMode; shadow?: ShadowStyle }
  | { kind: 'stroke'; path: PathData; stroke: StrokeStyle; transform: Matrix2D; alpha: number; blendMode: BlendMode; shadow?: ShadowStyle }
  | { kind: 'drawImage'; image: ImageSource; frame: { x; y; width; height }; transform: Matrix2D; alpha: number; blendMode: BlendMode; tint?: Color }
  | { kind: 'text'; text: string; style: TextStyle; transform: Matrix2D; fill: FillStyle; alpha: number; blendMode: BlendMode };
```

### 14.3 renderers/RenderTexture.ts（公共接口，新增）

```ts
class RenderTexture {
  constructor(backend: BackendAdapter, width: number, height: number);
  readonly width: number;
  readonly height: number;
  render(scene: Container, options?: { clear?: boolean }): void;  // 离屏渲染场景
  toImage(): HTMLCanvasElement | ImageBitmap;          // 作为 Image.source 使用
  toTexture(): BackendTexture;
  resize(w: number, h: number): void;
  destroy(): void;
}
```

### 14.4 renderers/canvas — Canvas 2D 后端

```ts
class CanvasRenderer implements BackendAdapter {
  constructor(canvas: HTMLCanvasElement, options?: RendererOptions);
  readonly type: 'canvas';
  get context(): CanvasRenderingContext2D;
  // 特性：脏矩形局部重绘（可选）、roundPixels 像素对齐
  setClearColor(color: Color): void;
  destroy(): void;
}
```

### 14.5 renderers/webgl2 — WebGL2 后端

```ts
class WebGL2Renderer implements BackendAdapter {
  constructor(canvas: HTMLCanvasElement, options?: RendererOptions);
  readonly type: 'webgl2';
  get gl(): WebGL2RenderingContext;
  // 特性：路径三角化（earcut）、静态几何批处理、MSAA、颜色拾取离屏缓冲
  static isSupported(): boolean;
  destroy(): void;
}
```

### 14.6 renderers/webgpu — WebGPU 后端

```ts
class WebGPURenderer implements BackendAdapter {
  constructor(canvas: HTMLCanvasElement, options?: RendererOptions);
  readonly type: 'webgpu';
  get device(): GPUDevice;
  get context(): GPUCanvasContext;
  // 特性：WGSL 着色器、资源池、compute 粒子（可选）
  static isSupported(): Promise<boolean>;
  destroy(): void;
}
```

---

## 十五、utils — 工具

### 15.1 utils/logger.ts — 日志系统

```ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const logger = {
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  isEnabled(level: LogLevel): boolean;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  // 生产构建可 tree-shake；debug 默认关闭
};
```

### 15.2 utils/merge.ts — 浅合并

```ts
function merge<T extends object, U extends object[]>(target: T, ...sources: U): T & U[number];
// 行为：仅合并自身可枚举属性；后者覆盖前者；返回新对象（不修改入参）
```

### 15.3 utils/deepMerge.ts — 深合并

```ts
function deepMerge<T>(target: T, ...sources: Partial<T>[]): T;
// 行为：递归合并普通对象；数组整体替换；日期/正则等原样拷贝
```

### 15.4 utils/cloneDeep.ts — 深拷贝

```ts
function cloneDeep<T>(value: T): T;
// 支持：普通对象、数组、Date、RegExp、Map、Set、循环引用
```

---

## 附录：文件覆盖清单

> 与 `需求.md` 目录结构逐项对照（✔ = 已定义 spec，◇ = 接口约定/待实现）。

| 模块 | 文件 | 章节 | 状态 |
|---|---|---|---|
| core | Engine / Renderer / Element | §1.1–1.3 | ✔ |
| events | EventEmitter | §2.1 | ✔ |
| math | Color / Gradient / Pattern | §3.1–3.3 | ✔ |
| math 2d | Vector2 / Matrix2D / Box2 / OBB / Transform2D | §3.4–3.8 | ✔ |
| math 2d | Arc / Bezier | §3.9–3.10 | ✔ |
| math 2d | PathInstruction / PathBuilder / Path2D / PathStroker | §3.11–3.14 | ✔ |
| math 2d shapes | ShapePrimitive / Rectangle / Circle / Ellipse / Polygon / Triangle | §3.15–3.20 | ✔ |
| math 3d | Vector3 / Vector4 / Matrix3 / Matrix4 / Box3 / Sphere / Ray / Plane / Frustum / Quaternion / Euler / Spherical / Triangle / Line3 / Cylindrical | §4.1–4.15 | ✔（首版可选） |
| math utils | MathUtils / earcut / delaunator | §5.1–5.3 | ✔ |
| scenes | DisplayObject / Container / Group / Shape / Rectangle / Circle / Ellipse / Polygon / Path / Image / Text / Star / Line / GraphicPath | §6.1–6.14 | ✔ |
| assets | AssetType / Asset / AssetLoader / AssetManager / AssetCache | §7.1–7.5 | ✔ |
| fonts | FontType / Font / FontLoader / FontManager / FontCache | §8.1–8.5 | ✔ |
| animation | AnimationInterpolator / InterpolatorType / KeyFrame / Track / Clip / Animation / System / Easing | §9.1–9.8 | ✔ |
| interaction | PointerEvent / KeyboardEvent / PointerEventHandler / KeyboardEventHandler / InteractionSystem | §10.1–10.5 | ✔ |
| particles | ParticleEmitter / ParticleContainer | §11.1–11.2 | ✔ |
| plugins | PluginSystem | §12.1 | ✔ |
| picking | Pickup / ShapePickup / ColorPickup / PickupSystem | §13.1–13.4 | ✔ |
| renderers | BackendAdapter / RenderCommand / RenderTexture / canvas / webgl2 / webgpu | §14.1–14.6 | ◇ 接口约定 |
| utils | logger / merge / deepMerge / cloneDeep | §15.1–15.4 | ✔ |

**新增文件（不在原目录结构中，属架构需要）**：`renderers/BackendAdapter.ts`、`renderers/RenderCommand.ts`、`renderers/RenderTexture.ts`（需求「多端统一渲染架构」依赖这些接口）。



