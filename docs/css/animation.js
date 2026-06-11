/**
 * 基于 requestAnimationFrame 的 CSS Animation 模拟引擎
 *
 * 入参（与 CSS animation 属性对齐）：
 *   @param {Object} keyframes        - 关键帧对象，支持 0%~100%、from、to
 *   @param {number|string} duration  - 持续时间（ms 或 '2s'）
 *   @param {string} [easing]         - 缓动函数
 *   @param {number|string} [delay]   - 延迟时间
 *   @param {number|string} [iterationCount] - 迭代次数 / 'infinite'
 *   @param {string} [direction]      - 方向
 *   @param {string} [fillMode]       - 填充模式
 *   @param {string} [playState]      - 播放状态
 *   @param {string} [name]           - 动画名称
 *   @param {Function} onUpdate       - 每帧回调，接收当前样式对象
 *   @param {Function} [onFinish]     - 动画完成回调
 * @returns {AnimationController}
 */

// ==================== 工具函数 ====================

/** 解析时间值：'2s' → 2000，'500ms' → 500，数字直接返回 */
function parseTime(time) {
  if (typeof time === 'number') return time;
  if (typeof time === 'string') {
    const s = time.trim();
    if (s.endsWith('ms')) return parseFloat(s) || 0;
    if (s.endsWith('s')) return (parseFloat(s) || 0) * 1000;
    return parseFloat(s) || 0;
  }
  return 0;
}

/** 标准化 time */
const toMs = parseTime;

// ==================== 缓动函数 ====================

/** 三次贝塞尔曲线实现 */
function createCubicBezier(x1, y1, x2, y2) {
  const bezierX = (t) =>
    3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const bezierY = (t) =>
    3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  const derivativeX = (t) =>
    3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);

  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let guess = t;
    for (let i = 0; i < 12; i++) {
      const xVal = bezierX(guess) - t;
      if (Math.abs(xVal) < 1e-7) break;
      const deriv = derivativeX(guess);
      if (Math.abs(deriv) < 1e-7) break;
      guess -= xVal / deriv;
      guess = Math.min(1, Math.max(0, guess));
    }
    return bezierY(guess);
  };
}

/** 步进函数（steps） */
function createSteps(count = 1, position = 'end') {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const step = position === 'start'
      ? Math.floor(t * count) / count
      : Math.ceil(t * count) / count;
    return Math.min(1, Math.max(0, step));
  };
}

/** 缓动函数表 */
const EASING_FUNCTIONS = {
  linear: (t) => t,
  ease: createCubicBezier(0.25, 0.1, 0.25, 1),
  'ease-in': createCubicBezier(0.42, 0, 1, 1),
  'ease-out': createCubicBezier(0, 0, 0.58, 1),
  'ease-in-out': createCubicBezier(0.42, 0, 0.58, 1),
};

/** 获取缓动函数，支持 cubic-bezier(...) 和 steps(...) 自定义 */
function getEasingFunction(easing) {
  if (typeof easing !== 'string') return EASING_FUNCTIONS.linear;

  const trim = easing.trim();

  // 预定义
  if (EASING_FUNCTIONS[trim]) return EASING_FUNCTIONS[trim];

  // cubic-bezier(x1, y1, x2, y2)
  const cbMatch = trim.match(
    /^cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/
  );
  if (cbMatch) {
    return createCubicBezier(
      parseFloat(cbMatch[1]),
      parseFloat(cbMatch[2]),
      parseFloat(cbMatch[3]),
      parseFloat(cbMatch[4])
    );
  }

  // steps(n, start|end) 或 steps(n)
  const stMatch = trim.match(
    /^steps\(\s*(\d+)\s*(?:,\s*(start|end)\s*)?\)$/
  );
  if (stMatch) {
    return createSteps(parseInt(stMatch[1], 10), stMatch[2] || 'end');
  }

  // 回退 linear
  return EASING_FUNCTIONS.linear;
}

// ==================== 关键帧解析 ====================

/**
 * 将 { '0%': {...}, '50%': {...}, '100%': {...}, from: {...}, to: {...} }
 * 转换为排序后的帧数组 [{ offset, props }, ...]
 */
function parseKeyframes(keyframes) {
  const frames = [];

  for (const key of Object.keys(keyframes)) {
    const k = key.trim();
    let offset;

    if (k === 'from' || k === '0%') {
      offset = 0;
    } else if (k === 'to' || k === '100%') {
      offset = 1;
    } else if (/%$/.test(k)) {
      offset = parseFloat(k) / 100;
    } else if (!isNaN(Number(k))) {
      offset = Number(k);
    } else {
      continue;
    }

    frames.push({ offset: Math.min(1, Math.max(0, offset)), props: { ...keyframes[key] } });
  }

  // 按 offset 排序
  frames.sort((a, b) => a.offset - b.offset);

  // 补全首尾
  if (frames.length === 0) return [];
  if (frames[0].offset > 0) {
    frames.unshift({ offset: 0, props: {} });
  }
  if (frames[frames.length - 1].offset < 1) {
    frames.push({ offset: 1, props: {} });
  }

  return frames;
}

// ==================== 属性值插值 ====================

const HEX_SHORT_RE = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG_RE = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGBA_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

/** 颜色字符串 → { r, g, b, a } */
function parseColor(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();

  // #fff
  let m = s.match(HEX_SHORT_RE);
  if (m) {
    return {
      r: parseInt(m[1] + m[1], 16),
      g: parseInt(m[2] + m[2], 16),
      b: parseInt(m[3] + m[3], 16),
      a: 1,
    };
  }

  // #ffffff
  m = s.match(HEX_LONG_RE);
  if (m) {
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
      a: 1,
    };
  }

  // rgba(r, g, b, a) / rgb(r, g, b)
  m = s.match(RGBA_RE);
  if (m) {
    return {
      r: Math.min(255, Math.max(0, parseInt(m[1], 10) || 0)),
      g: Math.min(255, Math.max(0, parseInt(m[2], 10) || 0)),
      b: Math.min(255, Math.max(0, parseInt(m[3], 10) || 0)),
      a: m[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(m[4]))) : 1,
    };
  }

  return null;
}

/** { r, g, b, a } → 'rgba(r, g, b, a)' */
function colorToRgba(color) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${color.a})`;
}

/** 插值两个颜色 */
function interpolateColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
    a: c1.a + (c2.a - c1.a) * t,
  };
}

/** 解析属性值为类型化信息 */
function parsePropValue(value) {
  if (typeof value === 'number') return { type: 'number', value };

  if (typeof value === 'string') {
    const s = value.trim();

    // 颜色
    const color = parseColor(s);
    if (color) return { type: 'color', value: color };

    // 数字 + 单位（如 100px, 50%, 2rem, 45deg, 1.5s）
    const numMatch = s.match(/^(-?\d+(?:\.\d+)?)([a-zA-Z%]*)$/);
    if (numMatch) {
      return {
        type: 'unit',
        number: parseFloat(numMatch[1]),
        unit: numMatch[2] || '',
      };
    }

    // 纯数字字符串
    if (!isNaN(Number(s))) {
      return { type: 'number', value: Number(s) };
    }

    return { type: 'string', value: s };
  }

  return { type: 'string', value: String(value) };
}

/** 插值两个属性值 */
function interpolatePropValue(from, to, t) {
  const parsedFrom = parsePropValue(from);
  const parsedTo = parsePropValue(to);

  // 类型不同时，直接返回目标值
  if (parsedFrom.type !== parsedTo.type) return to;

  switch (parsedFrom.type) {
    case 'number':
      return parsedFrom.value + (parsedTo.value - parsedFrom.value) * t;

    case 'unit':
      if (parsedFrom.unit !== parsedTo.unit) return to;
      return parsedFrom.number + (parsedTo.number - parsedFrom.number) * t + parsedFrom.unit;

    case 'color':
      return colorToRgba(interpolateColor(parsedFrom.value, parsedTo.value, t));

    default:
      return t < 0.5 ? from : to;
  }
}

// ==================== 动画引擎 ====================

/**
 * 创建动画实例
 * @param {Object} opts
 * @param {Object}  opts.keyframes        - 关键帧对象
 * @param {number|string} [opts.duration=0] - 持续时间
 * @param {string}  [opts.easing='ease']     - 缓动函数
 * @param {number|string} [opts.delay=0]     - 延迟
 * @param {number|string} [opts.iterationCount=1] - 迭代次数
 * @param {string}  [opts.direction='normal']     - 方向
 * @param {string}  [opts.fillMode='none']        - 填充模式
 * @param {string}  [opts.playState='running']    - 播放状态
 * @param {string}  [opts.name='']                - 动画名称
 * @param {Function} opts.onUpdate          - 每帧回调 (styles) => void
 * @param {Function} [opts.onFinish]        - 完成回调 () => void
 * @returns {AnimationController}
 */
export function animate(opts) {
  // ---------- 合并默认值 ----------
  const options = {
    keyframes: opts.keyframes || {},
    duration: toMs(opts.duration) || 0,
    easing: opts.easing || 'ease',
    delay: toMs(opts.delay) || 0,
    iterationCount: opts.iterationCount ?? 1,
    direction: opts.direction || 'normal',
    fillMode: opts.fillMode || 'none',
    playState: opts.playState || 'running',
    name: opts.name || '',
    onUpdate: opts.onUpdate || (() => {}),
    onFinish: opts.onFinish || (() => {}),
  };

  // ---------- 解析 ----------
  const easingFn = getEasingFunction(options.easing);
  const frames = parseKeyframes(options.keyframes);
  const isInfinite = options.iterationCount === 'infinite';
  const maxIterations = isInfinite ? Infinity : Number(options.iterationCount);

  // ---------- 状态 ----------
  let _state = 'idle'; // idle | running | paused | finished
  let _rafId = null;
  let _elapsed = 0; // 已播放时间（不含暂停停顿）
  let _lastTimestamp = 0;
  let _pausedAt = 0; // 暂停时的时间快照
  let _currentIteration = 0;
  let _direction = options.direction;

  // 记录初始关键帧样式（用于 backwards / both）
  const _initialStyles = frames.length > 0 ? { ...frames[0].props } : {};
  // 记录最终关键帧样式（用于 forwards / both）
  const _finalStyles = frames.length > 0 ? { ...frames[frames.length - 1].props } : {};

  // ---------- 关键帧插值 ----------
  function getInterpolatedStyles(progress) {
    if (frames.length === 0) return {};

    // 边界
    if (progress <= 0) return { ...frames[0].props };
    if (progress >= 1) return { ...frames[frames.length - 1].props };

    // 找到两个包围帧
    let lower = frames[0];
    let upper = frames[frames.length - 1];

    for (let i = 0; i < frames.length - 1; i++) {
      if (progress >= frames[i].offset && progress <= frames[i + 1].offset) {
        lower = frames[i];
        upper = frames[i + 1];
        break;
      }
    }

    // 帧内进度
    const range = upper.offset - lower.offset;
    const localProgress = range === 0 ? 0 : (progress - lower.offset) / range;

    // 合并所有属性
    const allProps = new Set([
      ...Object.keys(lower.props),
      ...Object.keys(upper.props),
    ]);

    const result = {};
    for (const prop of allProps) {
      const fromVal = lower.props[prop];
      const toVal = upper.props[prop];

      if (fromVal === undefined && toVal !== undefined) {
        result[prop] = toVal;
      } else if (toVal === undefined && fromVal !== undefined) {
        result[prop] = fromVal;
      } else {
        result[prop] = interpolatePropValue(fromVal, toVal, localProgress);
      }
    }

    return result;
  }

  // ---------- 方向 / 进度计算 ----------
  function getEffectiveProgress(iterationProgress, iteration) {
    let dir = _direction;

    if (dir === 'alternate') {
      dir = iteration % 2 === 0 ? 'normal' : 'reverse';
    } else if (dir === 'alternate-reverse') {
      dir = iteration % 2 === 0 ? 'reverse' : 'normal';
    }

    return dir === 'reverse' ? 1 - iterationProgress : iterationProgress;
  }

  // ---------- 样式计算（含 fillMode） ----------
  function computeStyles(iterationProgress, iteration, isActive) {
    const rawProgress = getEffectiveProgress(iterationProgress, iteration);
    const easedProgress = easingFn(rawProgress);
    return getInterpolatedStyles(easedProgress);
  }

  // ---------- 渲染一帧 ----------
  function renderFrame(iterationProgress, iteration) {
    const styles = computeStyles(iterationProgress, iteration, true);
    options.onUpdate(styles);
  }

  // ---------- 应用 fillMode ----------
  function applyFillMode(isFinished) {
    if (!isFinished) return;
    if (options.fillMode === 'forwards' || options.fillMode === 'both') {
      options.onUpdate({ ..._finalStyles });
    }
  }

  function applyBackfill() {
    if (options.fillMode === 'backwards' || options.fillMode === 'both') {
      if (frames.length > 0) {
        const rawProgress = getEffectiveProgress(0, 0);
        const easedProgress = easingFn(rawProgress);
        options.onUpdate(getInterpolatedStyles(easedProgress));
      }
    }
  }

  // ---------- 动画循环 ----------
  function tick(timestamp) {
    if (_state !== 'running') return;

    if (_lastTimestamp === 0) {
      _lastTimestamp = timestamp;
      _rafId = requestAnimationFrame(tick);
      return;
    }

    const delta = timestamp - _lastTimestamp;
    _lastTimestamp = timestamp;
    _elapsed += delta;

    // 延迟阶段
    if (_elapsed < options.delay) {
      applyBackfill();
      _rafId = requestAnimationFrame(tick);
      return;
    }

    // 超过延迟后的时间
    const afterDelay = _elapsed - options.delay;
    const iterationDuration = options.duration;
    const totalDuration = isInfinite ? Infinity : iterationDuration * maxIterations;

    if (afterDelay >= totalDuration) {
      // 动画结束
      if (isInfinite) {
        // 理论上不会到这里，但以防万一
        _elapsed = options.delay;
        _rafId = requestAnimationFrame(tick);
        return;
      }

      // 最后一次迭代
      const lastIteration = maxIterations - 1;
      renderFrame(1, lastIteration);
      applyFillMode(true);
      _state = 'finished';
      options.onFinish();
      return;
    }

    // 计算当前迭代
    _currentIteration = Math.floor(afterDelay / iterationDuration);
    let iterationProgress = (afterDelay % iterationDuration) / iterationDuration;

    // 修复浮点精度
    if (iterationProgress > 1) iterationProgress = 1;
    if (iterationProgress < 0) iterationProgress = 0;

    renderFrame(iterationProgress, _currentIteration);
    _rafId = requestAnimationFrame(tick);
  }

  // ---------- 控制器 ----------
  const controller = {
    get state() { return _state; },
    get currentIteration() { return _currentIteration; },
    get direction() { return _direction; },

    play() {
      if (_state === 'running') return this;

      if (_state === 'finished') {
        // 重新开始
        _elapsed = 0;
        _currentIteration = 0;
        _state = 'running';
        _lastTimestamp = 0;
        _rafId = requestAnimationFrame(tick);
        return this;
      }

      if (_state === 'paused') {
        _state = 'running';
        _lastTimestamp = 0;
        _rafId = requestAnimationFrame(tick);
        return this;
      }

      // idle
      _state = 'running';
      _elapsed = 0;
      _currentIteration = 0;
      _lastTimestamp = 0;
      _rafId = requestAnimationFrame(tick);
      return this;
    },

    pause() {
      if (_state !== 'running') return this;
      _state = 'paused';
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      return this;
    },

    stop() {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      _state = 'idle';
      _elapsed = 0;
      _currentIteration = 0;
      _lastTimestamp = 0;

      // fillMode none 时清除样式
      if (options.fillMode === 'none' || options.fillMode === 'backwards') {
        options.onUpdate({});
      }
      return this;
    },

    reverse() {
      _direction =
        _direction === 'normal'
          ? 'reverse'
          : _direction === 'reverse'
            ? 'normal'
            : _direction === 'alternate'
              ? 'alternate-reverse'
              : 'alternate';
      return this;
    },

    restart() {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      _state = 'idle';
      _elapsed = 0;
      _currentIteration = 0;
      _lastTimestamp = 0;
      _direction = options.direction;
      this.play();
      return this;
    },

    destroy() {
      if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
      }
      _state = 'idle';
      options.onUpdate({});
    },
  };

  // ---------- 初始启动 ----------
  if (options.playState === 'running') {
    controller.play();
  } else if (options.fillMode === 'backwards' || options.fillMode === 'both') {
    applyBackfill();
  }

  return controller;
}
