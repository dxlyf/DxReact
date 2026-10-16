export type ColorFormat =
  | 'hex'      // #fff / #ffffff / #ffff / #ffffffff
  | 'rgb'      // rgb(255, 0, 0) / rgb(255 0 0)
  | 'rgba'     // rgba(255, 0, 0, 0.5)
  | 'hsl'      // hsl(120, 50%, 50%)
  | 'hsla'     // hsla(120, 50%, 50%, 0.5)
  | 'hwb'      // hwb(120 30% 20%)
  | 'lab'      // lab(50% 40 59.5)
  | 'lch'      // lch(52% 58.5 50)
  | 'named'    // red / rebeccapurple
  | 'transparent';

export interface ValidateColorOptions {
  /** 允许的格式，默认全部允许 */
  formats?: ColorFormat[];
  /** 是否允许透明关键字 transparent，默认 true（也可通过 formats 控制） */
  allowTransparent?: boolean;
  /** 是否去掉首尾空格后再校验，默认 true */
  trim?: boolean;
  /** 是否大小写不敏感，默认 true */
  caseInsensitive?: boolean;
}
const ALL_FORMATS: ColorFormat[] = [
  'hex',
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'named',
  'transparent',
];

/** 常用 CSS 颜色关键字，按需可扩充 */
const NAMED_COLORS = new Set([
  'aliceblue','antiquewhite','aqua','aquamarine','azure','beige','bisque','black',
  'blanchedalmond','blue','blueviolet','brown','burlywood','cadetblue','chartreuse',
  'chocolate','coral','cornflowerblue','cornsilk','crimson','cyan','darkblue',
  'darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey','darkkhaki',
  'darkmagenta','darkolivegreen','darkorange','darkorchid','darkred','darksalmon',
  'darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise',
  'darkviolet','deeppink','deepskyblue','dimgray','dimgrey','dodgerblue',
  'firebrick','floralwhite','forestgreen','fuchsia','gainsboro','ghostwhite',
  'gold','goldenrod','gray','green','greenyellow','grey','honeydew','hotpink',
  'indianred','indigo','ivory','khaki','lavender','lavenderblush','lawngreen',
  'lemonchiffon','lightblue','lightcoral','lightcyan','lightgoldenrodyellow',
  'lightgray','lightgreen','lightgrey','lightpink','lightsalmon','lightseagreen',
  'lightskyblue','lightslategray','lightslategrey','lightsteelblue','lightyellow',
  'lime','limegreen','linen','magenta','maroon','mediumaquamarine','mediumblue',
  'mediumorchid','mediumpurple','mediumseagreen','mediumslateblue','mediumspringgreen',
  'mediumturquoise','mediumvioletred','midnightblue','mintcream','mistyrose',
  'moccasin','navajowhite','navy','oldlace','olive','olivedrab','orange','orangered',
  'orchid','palegoldenrod','palegreen','paleturquoise','palevioletred','papayawhip',
  'peachpuff','peru','pink','plum','powderblue','purple','rebeccapurple','red',
  'rosybrown','royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell',
  'sienna','silver','skyblue','slateblue','slategray','slategrey','snow','springgreen',
  'steelblue','tan','teal','thistle','tomato','turquoise','violet','wheat','white',
  'whitesmoke','yellow','yellowgreen',
]);

/** 数字：整数或小数 */
const NUM = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)`;
/** 百分比 */
const PCT = String.raw`${NUM}%`;
/** alpha：0~1 数字或百分比 */
const ALPHA = String.raw`(?:${NUM}|${PCT})`;

export function isValidColor(
  value: unknown,
  options: ValidateColorOptions = {},
): boolean {
  if (typeof value !== 'string') return false;

  const {
    formats = ALL_FORMATS,
    allowTransparent = true,
    trim = true,
    caseInsensitive = true,
  } = options;

  let input = trim ? value.trim() : value;
  if (input === '') return false;
  if (caseInsensitive) input = input.toLowerCase();

  const allowed = new Set(formats);

  // transparent 单独处理
  if (input === 'transparent') {
    return allowTransparent && allowed.has('transparent');
  }

  // hex
  if (allowed.has('hex') && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(input)) {
    return true;
  }

  // 函数式：rgb / rgba / hsl / hsla / hwb / lab / lch
  const fnMatch = input.match(/^([a-z]+)\((.*)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1];
    const args = fnMatch[2].trim();

    // rgb / rgba：三通道 + 可选 alpha
    if ((fn === 'rgb' || fn === 'rgba') && allowed.has(fn)) {
      return matchRgb(args);
    }
    // hsl / hsla：h + s% + l% + 可选 alpha
    if ((fn === 'hsl' || fn === 'hsla') && allowed.has(fn)) {
      return matchHsl(args);
    }
    // hwb：h + w% + b% + 可选 alpha
    if (fn === 'hwb' && allowed.has('hwb')) {
      return matchHwb(args);
    }
    // lab：L% a b + 可选 alpha
    if (fn === 'lab' && allowed.has('lab')) {
      return matchLab(args);
    }
    // lch：L% C h + 可选 alpha
    if (fn === 'lch' && allowed.has('lch')) {
      return matchLch(args);
    }
    return false;
  }

  // named
  if (allowed.has('named') && NAMED_COLORS.has(input)) {
    return true;
  }

  return false;
}

/** 把逗号或空格分隔的参数拆出来，兼容 rgb(255 0 0 / .5) */
function splitArgs(args: string): string[] {
  // 先按 "/" 拆 alpha
  const [main, alphaPart] = args.split('/').map((s) => s.trim());
  const mainParts = main.split(/[\s,]+/).filter(Boolean);
  const parts = alphaPart ? [...mainParts, alphaPart] : mainParts;
  return parts;
}

function isAlpha(token: string): boolean {
  return new RegExp(`^${ALPHA}$`).test(token);
}

function matchRgb(args: string): boolean {
  const parts = splitArgs(args);
  if (parts.length !== 3 && parts.length !== 4) return false;
  const [r, g, b, a] = parts;

  // 三通道：数字 0~255 或百分比
  const channel = (t: string) =>
    new RegExp(`^(?:${NUM}|${PCT})$`).test(t);
  if (!channel(r) || !channel(g) || !channel(b)) return false;

  // alpha 可选
  if (parts.length === 4 && !isAlpha(a)) return false;
  return true;
}

function matchHsl(args: string): boolean {
  const parts = splitArgs(args);
  if (parts.length !== 3 && parts.length !== 4) return false;
  const [h, s, l, a] = parts;

  // h：数字（可带 deg / grad / rad / turn）
  const hue = new RegExp(`^${NUM}(?:deg|grad|rad|turn)?$`).test(h);
  const pct = new RegExp(`^${PCT}$`).test;
  if (!hue || !pct(s) || !pct(l)) return false;
  if (parts.length === 4 && !isAlpha(a)) return false;
  return true;
}

function matchHwb(args: string): boolean {
  const parts = splitArgs(args);
  if (parts.length !== 3 && parts.length !== 4) return false;
  const [h, w, b, a] = parts;
  const hue = new RegExp(`^${NUM}(?:deg|grad|rad|turn)?$`).test(h);
  const pct = new RegExp(`^${PCT}$`).test;
  if (!hue || !pct(w) || !pct(b)) return false;
  if (parts.length === 4 && !isAlpha(a)) return false;
  return true;
}

function matchLab(args: string): boolean {
  const parts = splitArgs(args);
  if (parts.length !== 3 && parts.length !== 4) return false;
  const [l, aAxis, bAxis, alpha] = parts;
  const numOrPct = new RegExp(`^(?:${NUM}|${PCT})$`).test;
  // L 通常是百分比，a/b 是数字
  if (!numOrPct(l) || !new RegExp(`^${NUM}$`).test(aAxis) || !new RegExp(`^${NUM}$`).test(bAxis)) {
    return false;
  }
  if (parts.length === 4 && !isAlpha(alpha)) return false;
  return true;
}

function matchLch(args: string): boolean {
  const parts = splitArgs(args);
  if (parts.length !== 3 && parts.length !== 4) return false;
  const [l, c, h, alpha] = parts;
  const numOrPct = new RegExp(`^(?:${NUM}|${PCT})$`).test;
  if (!numOrPct(l) || !new RegExp(`^${NUM}$`).test(c) || !new RegExp(`^${NUM}(?:deg|grad|rad|turn)?$`).test(h)) {
    return false;
  }
  if (parts.length === 4 && !isAlpha(alpha)) return false;
  return true;
}


//type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsv';

interface ValidationResult {
  valid: boolean;
  format?: ColorFormat;
}

// 各格式的正则
const patterns: Record<ColorFormat, RegExp> = {
  // #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  hex: /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,

  // rgb(255, 0, 0) 或 rgb(100% 0% 0%)
  rgb: /^rgb\(\s*(\d{1,3}%?)\s*[, ]\s*(\d{1,3}%?)\s*[, ]\s*(\d{1,3}%?)\s*\)$/,

  // rgba(255, 0, 0, 0.5)
  rgba: /^rgba\(\s*(\d{1,3}%?)\s*[, ]\s*(\d{1,3}%?)\s*[, ]\s*(\d{1,3}%?)\s*[,/]\s*(0|1|0?\.\d+|\d{1,3}%)\s*\)$/,

  // hsl(120, 50%, 50%) 或 hsl(120deg 50% 50%)
  hsl: /^hsl\(\s*(-?\d{1,3}(?:\.\d+)?)(?:deg|rad|grad|turn)?\s*[, ]\s*(\d{1,3}(?:\.\d+)?%)\s*[, ]\s*(\d{1,3}(?:\.\d+)?%)\s*\)$/,

  // hsv(120, 50%, 50%) 或 hsv(120deg 50% 50%)
  hsv: /^hsv\(\s*(-?\d{1,3}(?:\.\d+)?)(?:deg|rad|grad|turn)?\s*[, ]\s*(\d{1,3}(?:\.\d+)?%)\s*[, ]\s*(\d{1,3}(?:\.\d+)?%)\s*\)$/,
};

/**
 * 校验颜色值是否合法
 * @param value 颜色字符串
 * @param targetFormat 可选，指定只校验某一格式
 */
export function validateColor(
  value: string,
  targetFormat?: ColorFormat
): ValidationResult {
  if (typeof value !== 'string') return { valid: false };

  const trimmed = value.trim();
  if (!trimmed) return { valid: false };

  const formats: ColorFormat[] = targetFormat
    ? [targetFormat]
    : ['hex', 'rgb', 'rgba', 'hsl', 'hsv'];

  for (const format of formats) {
    const match = patterns[format].exec(trimmed);
    if (match && checkRange(format, match)) {
      return { valid: true, format };
    }
  }

  return { valid: false };
}

/**
 * 数值范围校验（正则只能保证格式，范围需要额外判断）
 */
function checkRange(format: ColorFormat, match: RegExpExecArray): boolean {
  const toNum = (s: string) => parseFloat(s);

  if (format === 'rgb' || format === 'rgba') {
    // R/G/B：0-255 或 0%-100%
    for (let i = 1; i <= 3; i++) {
      const v = match[i];
      const num = toNum(v);
      if (v.endsWith('%')) {
        if (num < 0 || num > 100) return false;
      } else {
        if (num < 0 || num > 255 || !Number.isInteger(num)) return false;
      }
    }
    // Alpha：0-1 或 0%-100%
    if (format === 'rgba') {
      const a = match[4];
      const num = toNum(a);
      if (a.endsWith('%')) {
        if (num < 0 || num > 100) return false;
      } else {
        if (num < 0 || num > 1) return false;
      }
    }
  }

  if (format === 'hsl' || format === 'hsv') {
    // Hue: 任意数值（通常 0-360，允许超出循环）
    // Saturation / Value / Lightness: 0%-100%
    for (let i = 2; i <= 3; i++) {
      const num = toNum(match[i]);
      if (num < 0 || num > 100) return false;
    }
  }

  return true;
}