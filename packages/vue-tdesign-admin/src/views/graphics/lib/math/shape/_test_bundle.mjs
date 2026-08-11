// src/views/graphics/lib/math/pool.ts
var Pool = class _Pool {
  static create(options) {
    return new _Pool(options);
  }
  pool;
  options;
  constructor(options) {
    this.options = {
      maxSize: 10,
      initialSize: 0,
      ...options
    };
    this.pool = [];
    if (this.options.initialSize) {
      for (let i = 0; i < this.options.initialSize; i++) {
        this.pool.push(this.options.create());
      }
    }
  }
  release(obj) {
    if (this.pool.length < this.options.maxSize) {
      this.options.release(obj);
      this.pool.push(obj);
    }
  }
  acquire() {
    if (this.pool.length > 0) {
      const obj = this.pool.pop();
      return obj;
    }
    return this.options.create();
  }
};

// src/views/graphics/lib/math/vector2.ts
var Vector2 = class _Vector2 {
  static pool = Pool.create({
    initialSize: 20,
    create: () => new _Vector2(0, 0),
    release: (obj) => {
      obj.set(0, 0);
    }
  });
  static create(x, y) {
    return new _Vector2(x, y);
  }
  static default() {
    return this.create(0, 0);
  }
  static from(obj) {
    return this.create(obj.x, obj.y);
  }
  _x;
  _y;
  constructor(x, y) {
    this._x = x;
    this._y = y;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  set x(value) {
    this._x = value;
  }
  set y(value) {
    this._y = value;
  }
  set(x, y) {
    this._x = x;
    this._y = y;
    return this;
  }
  copy(source) {
    return this.set(source.x, source.y);
  }
  clone() {
    return this.constructor.create(this.x, this.y);
  }
  addVectors(a, b) {
    return this.set(a.x + b.x, a.y + b.y);
  }
  multiplyVectors(a, b) {
    return this.set(a.x * b.x, a.y * b.y);
  }
  subtractVectors(a, b) {
    return this.set(a.x - b.x, a.y - b.y);
  }
  divideVectors(a, b) {
    return this.set(a.x / b.x, a.y / b.y);
  }
  add(a) {
    return this.addVectors(this, a);
  }
  multiply(a) {
    return this.multiplyVectors(this, a);
  }
  subtract(a) {
    return this.subtractVectors(this, a);
  }
  divide(a) {
    return this.divideVectors(this, a);
  }
  multiplyScalar(scalar) {
    return this.set(this.x * scalar, this.y * scalar);
  }
  dot(a) {
    return this.x * a.x + this.y * a.y;
  }
  cross(a) {
    return this.x * a.y - this.y * a.x;
  }
  squaredLength() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.squaredLength());
  }
  normalize() {
    const length = this.length();
    if (length === 0) {
      return this;
    }
    const inverseLength = 1 / length;
    return this.multiplyScalar(inverseLength);
  }
  distanceTo(a) {
    return Math.sqrt((this.x - a.x) ** 2 + (this.y - a.y) ** 2);
  }
  perpendicular() {
    return this.set(-this.y, this.x);
  }
  negate() {
    return this.set(-this.x, -this.y);
  }
  translate(x, y) {
    return this.set(this.x + x, this.y + y);
  }
  rotate(angle, origin = _Vector2.default()) {
    const x = this.x - origin.x;
    const y = this.y - origin.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return this.set(x * cos - y * sin + origin.x, x * sin + y * cos + origin.y);
  }
  scale(sx, sy) {
    return this.set(this.x * sx, this.y * sy);
  }
  min(a) {
    return this.set(Math.min(this.x, a.x), Math.min(this.y, a.y));
  }
  max(a) {
    return this.set(Math.max(this.x, a.x), Math.max(this.y, a.y));
  }
  isZero() {
    return this.x === 0 && this.y === 0;
  }
  isOne() {
    return this.x === 1 && this.y === 1;
  }
  equals(a) {
    return this.x === a.x && this.y === a.y;
  }
  equalsEpsilon(a, epsilon = 1e-6) {
    return Math.abs(this.x - a.x) <= epsilon && Math.abs(this.y - a.y) <= epsilon;
  }
};

// src/views/graphics/lib/math/bounding_rect.ts
var BoundingRect = class _BoundingRect {
  static default() {
    return new _BoundingRect();
  }
  min = Vector2.create(0, 0);
  max = Vector2.create(0, 0);
  constructor() {
    this.setEmpty();
  }
  get left() {
    return this.min.x;
  }
  get top() {
    return this.min.y;
  }
  get right() {
    return this.max.x;
  }
  get bottom() {
    return this.max.y;
  }
  get width() {
    return this.right - this.left;
  }
  get height() {
    return this.bottom - this.top;
  }
  setEmpty() {
    this.min.set(Infinity, Infinity);
    this.max.set(-Infinity, -Infinity);
  }
  setZero() {
    this.min.set(0, 0);
    this.max.set(0, 0);
  }
  expandPoints(points) {
    for (let i = 0; i < points.length; i++) {
      this.min.min(points[i]);
      this.max.max(points[i]);
    }
  }
  expandPoint(point) {
    this.min.min(point);
    this.max.max(point);
  }
  fromPoints(points) {
    this.setEmpty();
    this.expandPoints(points);
  }
  fromLTRB(left, top, right, bottom) {
    this.setEmpty();
    this.expandPoint(Vector2.create(left, top));
    this.expandPoint(Vector2.create(right, bottom));
  }
  fromXYWH(x, y, width, height) {
    this.setEmpty();
    this.expandPoint(Vector2.create(x, y));
    this.expandPoint(Vector2.create(x + width, y + height));
  }
  copy(rect) {
    this.min.copy(rect.min);
    this.max.copy(rect.max);
    return this;
  }
  clone() {
    return new _BoundingRect().copy(this);
  }
  containsPoint(point) {
    return this.containsXY(point.x, point.y);
  }
  containsXY(x, y) {
    return !(x < this.left || x > this.right || y < this.top || y > this.bottom);
  }
  contains(rect) {
    return !(rect.left < this.left || rect.right > this.right || rect.top < this.top || rect.bottom > this.bottom);
  }
  intersection(rect) {
    this.min.max(rect.min);
    this.max.min(rect.max);
    return this;
  }
  union(rect) {
    this.min.min(rect.min);
    this.max.max(rect.max);
    return this;
  }
  outset(offset) {
    this.min.subtract(offset);
    this.max.add(offset);
    return this;
  }
  inset(offset) {
    this.min.add(offset);
    this.max.subtract(offset);
    return this;
  }
  isEmpty() {
    return this.width <= 0 || this.height <= 0;
  }
};

// src/views/graphics/lib/math/shape/shape_primitive.ts
var STROKE_ALIGN_CENTER = 0;
var STROKE_ALIGN_INNER = 1;
var STROKE_ALIGN_OUTER = 2;
var ShapePrimitive = class {
  bounds = BoundingRect.default();
  constructor() {
  }
  /**
   * 带符号距离场。默认不在任何形状内（返回 -Infinity）。
   * 子类必须重写：>0 内部，<0 外部，绝对值 = 到边界的距离。
   */
  signedDistance(x, y) {
    return -Infinity;
  }
  /** 点是否在形状内（含边界） */
  contains(x, y) {
    return this.signedDistance(x, y) >= 0;
  }
  /**
   * 点是否在描边内。
   * 描边宽度 width 的带：到边界距离 |sd| ∈ [0, width]，
   * 按对齐方式对齐到边界两侧：
   *   center —— |sd| ≤ width/2
   *   inner  —— 在内部且 sd ≤ width
   *   outer  —— 在外部且 |sd| ≤ width
   */
  containsStroke(x, y, width, align) {
    if (width <= 0) return false;
    const sd = this.signedDistance(x, y);
    const dist = Math.abs(sd);
    switch (align) {
      case STROKE_ALIGN_INNER:
        return sd >= 0 && dist <= width;
      case STROKE_ALIGN_OUTER:
        return sd <= 0 && dist <= width;
      case STROKE_ALIGN_CENTER:
      default:
        return dist <= width / 2;
    }
  }
  getBounds() {
    return this.bounds;
  }
};

// src/views/graphics/lib/math/shape/circle.ts
var Circle = class extends ShapePrimitive {
  cx;
  cy;
  r;
  constructor(cx = 0, cy = 0, r2 = 0) {
    super();
    this.cx = cx;
    this.cy = cy;
    this.r = r2;
    this.updateBounds();
  }
  set(cx, cy, r2) {
    this.cx = cx;
    this.cy = cy;
    this.r = r2;
    return this.updateBounds();
  }
  updateBounds() {
    this.bounds.fromXYWH(this.cx - this.r, this.cy - this.r, this.r * 2, this.r * 2);
    return this;
  }
  /**
   * SDF：sd = r − dist(点, 圆心)。
   * 圆心处最大（= r），边界上 0，向外为负。
   */
  signedDistance(x, y) {
    return this.r - Math.hypot(x - this.cx, y - this.cy);
  }
};

// src/views/graphics/lib/math/shape/rect.ts
var Rect = class extends ShapePrimitive {
  x;
  y;
  width;
  height;
  constructor(x = 0, y = 0, width = 0, height = 0) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.updateBounds();
  }
  get cx() {
    return this.x + this.width / 2;
  }
  get cy() {
    return this.y + this.height / 2;
  }
  set(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this.updateBounds();
  }
  updateBounds() {
    this.bounds.fromXYWH(this.x, this.y, this.width, this.height);
    return this;
  }
  /**
   * 矩形 SDF（标准公式，对角圆润近似）：
   *   q = |p − 中心| − 半尺寸，再对 q 的负分量取 0 求长度，
   *   加上对角部分 min(max(qx,qy), 0) 处理内部距离。
   */
  signedDistance(x, y) {
    const qx = Math.abs(x - this.cx) - this.width / 2;
    const qy = Math.abs(y - this.cy) - this.height / 2;
    const ax = Math.max(qx, 0);
    const ay = Math.max(qy, 0);
    return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0);
  }
};

// src/views/graphics/lib/math/shape/ellipse.ts
var Ellipse = class extends ShapePrimitive {
  cx;
  cy;
  rx;
  ry;
  constructor(cx = 0, cy = 0, rx = 0, ry = 0) {
    super();
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
    this.updateBounds();
  }
  set(cx, cy, rx, ry) {
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
    return this.updateBounds();
  }
  updateBounds() {
    this.bounds.fromXYWH(this.cx - this.rx, this.cy - this.ry, this.rx * 2, this.ry * 2);
    return this;
  }
  /**
   * 椭圆 SDF（近似）：
   *   归一化坐标 n = ((x−cx)/rx, (y−cy)/ry)，
   *   sd = (1 − |n|) · min(rx, ry)。
   * 在轴上精确；45° 附近略有误差（最小半径缩放近似）。
   */
  signedDistance(x, y) {
    const nx = (x - this.cx) / this.rx;
    const ny = (y - this.cy) / this.ry;
    const d = Math.hypot(nx, ny);
    return (1 - d) * Math.min(this.rx, this.ry);
  }
};

// src/views/graphics/lib/math/shape/round_rect.ts
var RoundRect = class extends ShapePrimitive {
  x;
  y;
  width;
  height;
  /** 圆角半径数组 [tl, tr, br, bl] */
  radii;
  constructor(x = 0, y = 0, width = 0, height = 0, r2 = 0) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.radii = this.normalizeRadii(r2);
    this.updateBounds();
  }
  get cx() {
    return this.x + this.width / 2;
  }
  get cy() {
    return this.y + this.height / 2;
  }
  set(x, y, width, height, r2) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    if (r2 !== void 0) this.radii = this.normalizeRadii(r2);
    return this.updateBounds();
  }
  /** number → 四角相同；数组 → [tl,tr,br,bl] */
  normalizeRadii(r2) {
    if (typeof r2 === "number") return [r2, r2, r2, r2];
    return [r2[0], r2[1], r2[2], r2[3]];
  }
  /** 当前象限的圆角半径（y 轴向下，像素坐标） */
  radiusOf(px, py) {
    const [tl, tr, br, bl] = this.radii;
    if (px < 0) return py < 0 ? tl : bl;
    return py < 0 ? tr : br;
  }
  updateBounds() {
    this.bounds.fromXYWH(this.x, this.y, this.width, this.height);
    return this;
  }
  /**
   * 圆角矩形 SDF：
   *   q = |p − 中心| − (半尺寸 − 圆角半径)，按象限选对应半径，
   *   sd = |max(q,0)| − r + min(max(qx,qy), 0)。
   * 矩形内部按最近边距离计，四角按对应圆弧计。
   */
  signedDistance(x, y) {
    const px = x - this.cx;
    const py = y - this.cy;
    const r2 = this.radiusOf(px, py);
    const hw = this.width / 2;
    const hh = this.height / 2;
    const qx = Math.abs(px) - (hw - r2);
    const qy = Math.abs(py) - (hh - r2);
    const ax = Math.max(qx, 0);
    const ay = Math.max(qy, 0);
    return Math.hypot(ax, ay) - r2 + Math.min(Math.max(qx, qy), 0);
  }
};

// src/views/graphics/lib/math/shape/triangle.ts
var Triangle = class extends ShapePrimitive {
  a;
  b;
  c;
  constructor(a, b, c2) {
    super();
    this.a = { x: a.x, y: a.y };
    this.b = { x: b.x, y: b.y };
    this.c = { x: c2.x, y: c2.y };
    this.updateBounds();
  }
  set(a, b, c2) {
    this.a = { x: a.x, y: a.y };
    this.b = { x: b.x, y: b.y };
    this.c = { x: c2.x, y: c2.y };
    return this.updateBounds();
  }
  updateBounds() {
    this.bounds.fromPoints([this.a, this.b, this.c]);
    return this;
  }
  /**
   * 三角形 SDF：三条边半平面距离的最小值。
   * 边 (P0,P1) 的带符号距离 d = cross(P1−P0, P−P0) / |P1−P0|，
   * 统一为逆时针绕向（内部为正），内部任一点 sd > 0，最小值为 0 即落在边上。
   */
  signedDistance(x, y) {
    const { a, b, c: c2 } = this;
    const area2 = (b.x - a.x) * (c2.y - a.y) - (c2.x - a.x) * (b.y - a.y);
    const sign = area2 >= 0 ? 1 : -1;
    const d0 = crossDist(a, b, x, y);
    const d1 = crossDist(b, c2, x, y);
    const d2 = crossDist(c2, a, x, y);
    return Math.min(d0, d1, d2) * sign;
  }
};
function crossDist(p0, p1, x, y) {
  const ex = p1.x - p0.x;
  const ey = p1.y - p0.y;
  const len = Math.hypot(ex, ey);
  if (len === 0) return Infinity;
  return ((p1.x - p0.x) * (y - p0.y) - (p1.y - p0.y) * (x - p0.x)) / len;
}

// src/views/graphics/lib/math/shape/polygon.ts
var Polygon = class extends ShapePrimitive {
  points;
  constructor(points) {
    super();
    this.points = points.map((p) => ({ x: p.x, y: p.y }));
    this.updateBounds();
  }
  set(points) {
    this.points = points.map((p) => ({ x: p.x, y: p.y }));
    return this.updateBounds();
  }
  updateBounds() {
    this.bounds.fromPoints(this.points);
    return this;
  }
  /**
   * 多边形 SDF（鲁棒版，对凹多边形也成立）：
   *   先射线法判内外；内部 → +到最近边的距离，外部 → −到最近边的距离。
   * 注意：内部 SDF 在凹顶点附近不是精确的距离场（到边的距离 ≤ 真实边界距离），
   * 但用于 contains / containsStroke 判据足够。
   */
  signedDistance(x, y) {
    const d = this.distanceToEdges(x, y);
    return this.containsByRayCast(x, y) ? d : -d;
  }
  /** 点到所有边的最近距离（点到线段） */
  distanceToEdges(x, y) {
    const n = this.points.length;
    if (n < 2) return Infinity;
    let min = Infinity;
    for (let i = 0; i < n; i++) {
      const p0 = this.points[i];
      const p1 = this.points[(i + 1) % n];
      min = Math.min(min, pointSegmentDistance(x, y, p0, p1));
    }
    return min;
  }
  /** 射线投射法（even-odd 规则），支持凹多边形与自交 */
  containsByRayCast(x, y) {
    const pts = this.points;
    const n = pts.length;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }
};
function pointSegmentDistance(x, y, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(x - a.x, y - a.y);
  const t3 = Math.max(0, Math.min(1, ((x - a.x) * abx + (y - a.y) * aby) / len2));
  return Math.hypot(x - (a.x + t3 * abx), y - (a.y + t3 * aby));
}

// src/views/graphics/lib/math/shape/_test_shape.ts
var check = (name, actual, expect) => {
  const ok = actual === expect;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got=${actual} expect=${expect}`);
};
var c = new Circle(5, 5, 3);
check("circle \u5706\u5FC3", c.contains(5, 5), true);
check("circle \u8FB9\u754C", c.contains(8, 5), true);
check("circle \u5916", c.contains(9, 5), false);
check("circle stroke center", c.containsStroke(6.5, 5, 2, STROKE_ALIGN_CENTER), true);
check("circle stroke center2", c.containsStroke(6.8, 5, 2, STROKE_ALIGN_CENTER), true);
var r = new Rect(0, 0, 10, 5);
check("rect \u5185\u90E8", r.contains(5, 2), true);
check("rect \u8FB9\u754C", r.contains(10, 2), true);
check("rect \u5916", r.contains(11, 2), false);
check("rect stroke outer", r.containsStroke(11, 2, 2, STROKE_ALIGN_OUTER), true);
check("rect stroke inner \u5185\u90E8\u70B9", r.containsStroke(8, 2, 2, STROKE_ALIGN_INNER), true);
check("rect stroke inner \u6DF1\u5185\u90E8", r.containsStroke(5, 2, 2, STROKE_ALIGN_INNER), false);
var e = new Ellipse(5, 5, 4, 2);
check("ellipse \u4E2D\u5FC3", e.contains(5, 5), true);
check("ellipse \u5185\u90E8", e.contains(7, 5), true);
check("ellipse \u5916 x", e.contains(10, 5), false);
var rr = new RoundRect(0, 0, 10, 10, 3);
check("roundrect \u4E2D\u5FC3", rr.contains(5, 5), true);
check("roundrect \u89D2\u5185", rr.contains(1.2, 1.2), true);
check("roundrect \u89D2\u5916", rr.contains(0.5, 0.5), false);
check("roundrect \u8FB9", rr.contains(0, 5), true);
var t = new Triangle({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 });
check("triangle \u5185\u90E8", t.contains(0.5, 0.5), true);
check("triangle \u659C\u8FB9\u5916", t.contains(2.5, 2.5), false);
check("triangle \u659C\u8FB9\u4E0A", t.contains(2, 2), true);
var t2 = new Triangle({ x: 0, y: 0 }, { x: 0, y: 4 }, { x: 4, y: 0 });
check("triangle CW \u5185\u90E8", t2.contains(0.5, 0.5), true);
check("triangle CW \u5916", t2.contains(2.5, 2.5), false);
var poly = new Polygon([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 4 }, { x: 0, y: 4 }]);
check("polygon L \u5185\u90E8", poly.contains(0.5, 3), true);
check("polygon L \u51F9\u69FD\u5916", poly.contains(3, 3), false);
check("polygon L \u8FB9\u754C", poly.contains(0, 2), true);
console.log("polygon bounds", JSON.stringify({ l: poly.getBounds().left, t: poly.getBounds().top, r: poly.getBounds().right, b: poly.getBounds().bottom }));
