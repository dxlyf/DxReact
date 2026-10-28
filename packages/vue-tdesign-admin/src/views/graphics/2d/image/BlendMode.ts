/**
 * 像素混合与合成（CPU 手动实现）
 * 输入为直通 alpha（straight alpha）的 RGBA8 像素数据，全部公式手写实现，不使用 canvas / WebGL 的原生混合能力：
 * - canvas：全部 globalCompositeOperation 取值（Porter-Duff 合成 11 种 + 混合模式 15 种），
 *   混合模式含可分离 12 种与不可分离 4 种（hue / saturation / color / luminosity）
 * - WebGL：固定管线混合，等价 gl.blendEquation / gl.blendEquationSeparate +
 *   gl.blendFunc / gl.blendFuncSeparate + gl.blendColor，覆盖全部方程与因子（含 WebGL2 常量色因子）
 */

/** 直通 alpha 的 RGBA 颜色，各分量 0~255（与 ImageData / Pixmap 一致） */
export type RGBA = [number, number, number, number]

/** RGB 颜色，各分量 0~255 */
export type RGB = [number, number, number]

/** 可分离混合模式：逐通道独立计算 */
export type SeparableBlendMode =
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'

/** 不可分离混合模式：依赖三通道整体的亮度 / 饱和度 */
export type NonSeparableBlendMode = 'hue' | 'saturation' | 'color' | 'luminosity'

/** 混合模式（对应 CSS mix-blend-mode） */
export type BlendMode = SeparableBlendMode | NonSeparableBlendMode

/** Porter-Duff 合成操作 */
export type CompositeOperator =
    | 'source-over'
    | 'source-in'
    | 'source-out'
    | 'source-atop'
    | 'destination-over'
    | 'destination-in'
    | 'destination-out'
    | 'destination-atop'
    | 'lighter'
    | 'copy'
    | 'xor'

/** canvas globalCompositeOperation 的全部取值（合成操作 + 混合模式，normal 等价 source-over） */
export type GlobalCompositeOperation = CompositeOperator | BlendMode

/** 0~1 浮点三通道 */
type Vec3 = [number, number, number]

/** 限制到 0~1 */
function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

/** soft-light 的 D(Cb) 分段函数 */
function softLightD(cb: number): number {
    return cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb)
}

/**
 * 可分离混合模式的单通道公式（0~1）
 * dst 为下层颜色 Cb，src 为上层颜色 Cs，返回混合色 B(Cb, Cs)
 */
export function blendChannel(mode: SeparableBlendMode, dst: number, src: number): number {
    const cb = clamp01(dst)
    const cs = clamp01(src)
    switch (mode) {
        case 'normal':
            return cs
        case 'multiply':
            return cb * cs
        case 'screen':
            return cb + cs - cb * cs
        case 'overlay':
            return cb <= 0.5 ? 2 * cb * cs : 1 - 2 * (1 - cb) * (1 - cs)
        case 'darken':
            return Math.min(cb, cs)
        case 'lighten':
            return Math.max(cb, cs)
        case 'color-dodge':
            return cb <= 0 ? 0 : cs >= 1 ? 1 : Math.min(1, cb / (1 - cs))
        case 'color-burn':
            return cb >= 1 ? 1 : cs <= 0 ? 0 : 1 - Math.min(1, (1 - cb) / cs)
        case 'hard-light':
            return cs <= 0.5 ? 2 * cb * cs : 1 - 2 * (1 - cb) * (1 - cs)
        case 'soft-light':
            return cs <= 0.5
                ? cb - (1 - 2 * cs) * cb * (1 - cb)
                : cb + (2 * cs - 1) * (softLightD(cb) - cb)
        case 'difference':
            return Math.abs(cb - cs)
        case 'exclusion':
            return cb + cs - 2 * cb * cs
    }
}

/** 亮度 Lum(C) = 0.3R + 0.59G + 0.11B */
function lum(c: Vec3): number {
    return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
}

/** 饱和度 Sat(C) = max - min */
function sat(c: Vec3): number {
    return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2])
}

/** 把颜色压回 0~1 且亮度不变（W3C ClipColor） */
function clipColor(c: Vec3): Vec3 {
    const l = lum(c)
    const n = Math.min(c[0], c[1], c[2])
    const x = Math.max(c[0], c[1], c[2])
    let r = c[0]
    let g = c[1]
    let b = c[2]
    if (n < 0) {
        r = l + (r - l) * l / (l - n)
        g = l + (g - l) * l / (l - n)
        b = l + (b - l) * l / (l - n)
    }
    if (x > 1) {
        r = l + (r - l) * (1 - l) / (x - l)
        g = l + (g - l) * (1 - l) / (x - l)
        b = l + (b - l) * (1 - l) / (x - l)
    }
    return [r, g, b]
}

/** 设置亮度且保持色相与饱和度（W3C SetLum） */
function setLum(c: Vec3, l: number): Vec3 {
    const d = l - lum(c)
    return clipColor([c[0] + d, c[1] + d, c[2] + d])
}

/** 设置饱和度且保持色相（W3C SetSat） */
function setSat(c: Vec3, s: number): Vec3 {
    const out: Vec3 = [0, 0, 0]
    // 升序排列后：idx[0] 最小、idx[1] 中间、idx[2] 最大
    const idx = [0, 1, 2].sort((a, b) => c[a] - c[b])
    const min = c[idx[0]]
    const mid = c[idx[1]]
    const max = c[idx[2]]
    if (max > min) {
        out[idx[1]] = (mid - min) * s / (max - min)
        out[idx[2]] = s
    }
    return out
}

/** 不可分离混合模式（0~1 浮点） */
function blendNonSeparable(mode: NonSeparableBlendMode, cb: Vec3, cs: Vec3): Vec3 {
    switch (mode) {
        case 'hue':
            return setLum(setSat(cs, sat(cb)), lum(cb))
        case 'saturation':
            return setLum(setSat(cb, sat(cs)), lum(cb))
        case 'color':
            return setLum(cs, lum(cb))
        case 'luminosity':
            return setLum(cb, lum(cs))
    }
}

/** 任意混合模式的三通道混合（0~1 浮点） */
function blendRGB(mode: BlendMode, cb: Vec3, cs: Vec3): Vec3 {
    switch (mode) {
        case 'normal':
            return [cs[0], cs[1], cs[2]]
        case 'hue':
        case 'saturation':
        case 'color':
        case 'luminosity':
            return blendNonSeparable(mode, cb, cs)
        default:
            return [
                blendChannel(mode, cb[0], cs[0]),
                blendChannel(mode, cb[1], cs[1]),
                blendChannel(mode, cb[2], cs[2]),
            ]
    }
}

/**
 * 混合模式取色（不含 alpha 合成），输入输出均为 0~255
 * 等价于 CSS mix-blend-mode 对上下两层颜色做的混合
 */
export function blendColor(mode: BlendMode, dst: RGB, src: RGB): RGB {
    if (mode === 'normal') {
        return [src[0], src[1], src[2]]
    }
    const cb: Vec3 = [clamp01(dst[0] / 255), clamp01(dst[1] / 255), clamp01(dst[2] / 255)]
    const cs: Vec3 = [clamp01(src[0] / 255), clamp01(src[1] / 255), clamp01(src[2] / 255)]
    const out = blendRGB(mode, cb, cs)
    return [
        Math.round(clamp01(out[0]) * 255),
        Math.round(clamp01(out[1]) * 255),
        Math.round(clamp01(out[2]) * 255),
    ]
}

/**
 * Porter-Duff 权重 [Fa, Fb]
 * 返回 null 表示该 op 是混合模式，按 source-over 的权重参与合成
 */
function factors(op: GlobalCompositeOperation, as: number, ab: number): [number, number] | null {
    switch (op) {
        case 'normal':
        case 'source-over':
            return [1, 1 - as]
        case 'source-in':
            return [ab, 0]
        case 'source-out':
            return [1 - ab, 0]
        case 'source-atop':
            return [ab, 1 - as]
        case 'destination-over':
            return [1 - ab, 1]
        case 'destination-in':
            return [0, as]
        case 'destination-out':
            return [0, 1 - as]
        case 'destination-atop':
            return [1 - ab, as]
        case 'lighter':
            return [1, 1]
        case 'copy':
            return [1, 0]
        case 'xor':
            return [1 - ab, 1 - as]
        default:
            return null
    }
}

/**
 * 单像素合成（直通 alpha），结果写入 out 并返回 out
 * 混合模式下先把源色替换为 Cs' = (1-ab)Cs + ab*B(Cb,Cs)，再套 Porter-Duff 权重：
 * ao = as*Fa + ab*Fb
 * co = as*Fa*Cs' + ab*Fb*Cb（预乘），输出直通色 = co / ao
 */
function composite(dstColor: RGBA, srcColor: RGBA, op: GlobalCompositeOperation, out: RGBA): RGBA {
    const ab = dstColor[3] / 255
    const as = srcColor[3] / 255
    const cb: Vec3 = [dstColor[0] / 255, dstColor[1] / 255, dstColor[2] / 255]
    const cs: Vec3 = [srcColor[0] / 255, srcColor[1] / 255, srcColor[2] / 255]

    const f = factors(op, as, ab)
    const fa = f ? f[0] : 1
    const fb = f ? f[1] : 1 - as

    // 混合色彩源；纯合成操作直接用源色
    let blended = cs
    if (!f) {
        const b = blendRGB(op as BlendMode, cb, cs)
        blended = [
            (1 - ab) * cs[0] + ab * b[0],
            (1 - ab) * cs[1] + ab * b[1],
            (1 - ab) * cs[2] + ab * b[2],
        ]
    }

    const ao = Math.min(1, as * fa + ab * fb)
    if (ao <= 0) {
        out[0] = 0
        out[1] = 0
        out[2] = 0
        out[3] = 0
        return out
    }
    for (let i = 0; i < 3; i++) {
        const co = Math.min(1, as * fa * blended[i] + ab * fb * cb[i])
        out[i] = Math.round(clamp01(co / ao) * 255)
    }
    out[3] = Math.round(ao * 255)
    return out
}

/**
 * 单像素混合 / 合成
 * dstColor 为下层当前像素颜色，srcColor 为上层当前像素颜色，均为直通 alpha 0~255
 * op 为 canvas globalCompositeOperation 取值
 */
export function compositePixel(
    dstColor: RGBA,
    srcColor: RGBA,
    op: GlobalCompositeOperation = 'source-over',
): RGBA {
    return composite(dstColor, srcColor, op, [0, 0, 0, 0])
}

/**
 * 两个 RGBA8 缓冲逐像素合成，原地写回 dstData 并返回
 * 长度必须相同且为 4 的倍数，行主序排列：data[(y * width + x) * 4 + 0..3] = r, g, b, a
 */
export function compositeCanvas(
    dstData: Uint8ClampedArray,
    srcData: Uint8ClampedArray,
    op: GlobalCompositeOperation = 'source-over',
): Uint8ClampedArray {
    if (dstData.length !== srcData.length || dstData.length % 4 !== 0) {
        throw new Error('dstData 与 srcData 必须是长度相同且为 4 的倍数的 RGBA8 缓冲')
    }
    const dstColor: RGBA = [0, 0, 0, 0]
    const srcColor: RGBA = [0, 0, 0, 0]
    const out: RGBA = [0, 0, 0, 0]
    for (let i = 0; i < dstData.length; i += 4) {
        dstColor[0] = dstData[i]
        dstColor[1] = dstData[i + 1]
        dstColor[2] = dstData[i + 2]
        dstColor[3] = dstData[i + 3]
        srcColor[0] = srcData[i]
        srcColor[1] = srcData[i + 1]
        srcColor[2] = srcData[i + 2]
        srcColor[3] = srcData[i + 3]
        composite(dstColor, srcColor, op, out)
        dstData[i] = out[0]
        dstData[i + 1] = out[1]
        dstData[i + 2] = out[2]
        dstData[i + 3] = out[3]
    }
    return dstData
}

/* -------------------------------------------------------------------------------------------------
 * WebGL 固定管线混合（CPU 模拟）
 * 与 GL 状态一一对应：
 *   gl.blendEquationSeparate(rgb, alpha)         -> equation.rgb / equation.alpha
 *   gl.blendFuncSeparate(srcRGB, dstRGB, srcA, dstA) -> func.srcRGB / func.dstRGB / func.srcAlpha / func.dstAlpha
 *   gl.blendColor(r, g, b, a)                    -> constant（0~255，等价于 r/255 …）
 *   gl.blendEquation(eq) / gl.blendFunc(src, dst) 等价于 RGB 与 Alpha 取同一值
 * 逐通道计算：C = eq(S * Sf, D * Df)，再钳制到 0~1（RGBA8 无符号归一化缓冲的写入规则）
 * ------------------------------------------------------------------------------------------------- */

/** WebGL 混合方程（gl.blendEquation 的取值） */
export type BlendEquation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max'

/** WebGL 混合因子（gl.blendFunc / gl.blendFuncSeparate 的取值，含 WebGL2 常量色因子） */
export type BlendFactor =
    | 'zero'
    | 'one'
    | 'src-color'
    | 'one-minus-src-color'
    | 'dst-color'
    | 'one-minus-dst-color'
    | 'src-alpha'
    | 'one-minus-src-alpha'
    | 'dst-alpha'
    | 'one-minus-dst-alpha'
    | 'constant-color'
    | 'one-minus-constant-color'
    | 'constant-alpha'
    | 'one-minus-constant-alpha'
    | 'src-alpha-saturate'

/** WebGL 混合状态（等价于一组 GL 混合调用后的状态） */
export interface WebGLBlendState {
    /** 等价 gl.blendEquationSeparate(rgb, alpha) */
    equation: { rgb: BlendEquation; alpha: BlendEquation }
    /** 等价 gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) */
    func: { srcRGB: BlendFactor; dstRGB: BlendFactor; srcAlpha: BlendFactor; dstAlpha: BlendFactor }
    /** 等价 gl.blendColor(r/255, g/255, b/255, a/255)，各分量 0~255 */
    constant: RGBA
}

/** 创建混合状态时的可选字段（未给出的沿用 GL 默认值） */
export interface WebGLBlendStateInit {
    equation?: Partial<WebGLBlendState['equation']>
    func?: Partial<WebGLBlendState['func']>
    constant?: RGBA
}

/** GL 默认状态：add 方程 + (one, zero) 因子，即结果等于源色 */
const DEFAULT_BLEND_STATE: WebGLBlendState = {
    equation: { rgb: 'add', alpha: 'add' },
    func: { srcRGB: 'one', dstRGB: 'zero', srcAlpha: 'one', dstAlpha: 'zero' },
    constant: [0, 0, 0, 0],
}

/** 0~1 浮点四通道 */
type Vec4 = [number, number, number, number]

/** 合并默认值，得到完整的混合状态 */
export function createWebGLBlendState(init: WebGLBlendStateInit = {}): WebGLBlendState {
    return {
        equation: { ...DEFAULT_BLEND_STATE.equation, ...init.equation },
        func: { ...DEFAULT_BLEND_STATE.func, ...init.func },
        constant: init.constant
            ? [init.constant[0], init.constant[1], init.constant[2], init.constant[3]]
            : [0, 0, 0, 0],
    }
}

/**
 * 计算混合因子的四个分量
 * RGB 通道取各自分量，Alpha 通道取第 4 个分量，因此该函数一次即可同时支持 RGB 与 Alpha
 */
function factorValue(f: BlendFactor, s: Vec4, d: Vec4, c: Vec4): Vec4 {
    switch (f) {
        case 'zero':
            return [0, 0, 0, 0]
        case 'one':
            return [1, 1, 1, 1]
        case 'src-color':
            return [s[0], s[1], s[2], s[3]]
        case 'one-minus-src-color':
            return [1 - s[0], 1 - s[1], 1 - s[2], 1 - s[3]]
        case 'dst-color':
            return [d[0], d[1], d[2], d[3]]
        case 'one-minus-dst-color':
            return [1 - d[0], 1 - d[1], 1 - d[2], 1 - d[3]]
        case 'src-alpha':
            return [s[3], s[3], s[3], s[3]]
        case 'one-minus-src-alpha': {
            const v = 1 - s[3]
            return [v, v, v, v]
        }
        case 'dst-alpha':
            return [d[3], d[3], d[3], d[3]]
        case 'one-minus-dst-alpha': {
            const v = 1 - d[3]
            return [v, v, v, v]
        }
        case 'constant-color':
            return [c[0], c[1], c[2], c[3]]
        case 'one-minus-constant-color':
            return [1 - c[0], 1 - c[1], 1 - c[2], 1 - c[3]]
        case 'constant-alpha':
            return [c[3], c[3], c[3], c[3]]
        case 'one-minus-constant-alpha': {
            const v = 1 - c[3]
            return [v, v, v, v]
        }
        // f = (min(As, 1-Ad), min(As, 1-Ad), min(As, 1-Ad), 1)
        case 'src-alpha-saturate': {
            const v = Math.min(s[3], 1 - d[3])
            return [v, v, v, 1]
        }
    }
}

/**
 * 单通道混合方程
 * min / max 按 GL 规范忽略混合因子，直接取源值与目标值的较小 / 较大者
 */
function equationValue(eq: BlendEquation, s: number, d: number, sf: number, df: number): number {
    switch (eq) {
        case 'add':
            return s * sf + d * df
        case 'subtract':
            return s * sf - d * df
        case 'reverse-subtract':
            return d * df - s * sf
        case 'min':
            return Math.min(s, d)
        case 'max':
            return Math.max(s, d)
    }
}

/**
 * 单像素 WebGL 混合
 * dstColor 为帧缓冲中的目标像素，srcColor 为片元着色器输出的源像素，均为直通 alpha 0~255
 * init 只需给出与默认值不同的字段，例如：
 * { func: { srcRGB: 'src-alpha', dstRGB: 'one-minus-src-alpha', srcAlpha: 'one', dstAlpha: 'one-minus-src-alpha' } }
 */
export function blendWebGLPixel(
    dstColor: RGBA,
    srcColor: RGBA,
    init: WebGLBlendStateInit = {},
): RGBA {
    const state = createWebGLBlendState(init)
    const s: Vec4 = [srcColor[0] / 255, srcColor[1] / 255, srcColor[2] / 255, srcColor[3] / 255]
    const d: Vec4 = [dstColor[0] / 255, dstColor[1] / 255, dstColor[2] / 255, dstColor[3] / 255]
    const c: Vec4 = [
        state.constant[0] / 255,
        state.constant[1] / 255,
        state.constant[2] / 255,
        state.constant[3] / 255,
    ]
    const sf = factorValue(state.func.srcRGB, s, d, c)
    const df = factorValue(state.func.dstRGB, s, d, c)
    const out: RGBA = [0, 0, 0, 0]
    for (let i = 0; i < 3; i++) {
        out[i] = Math.round(clamp01(equationValue(state.equation.rgb, s[i], d[i], sf[i], df[i])) * 255)
    }
    // Alpha 通道用独立的方程与因子（blendEquationSeparate / blendFuncSeparate）
    const asf = factorValue(state.func.srcAlpha, s, d, c)
    const adf = factorValue(state.func.dstAlpha, s, d, c)
    out[3] = Math.round(clamp01(equationValue(state.equation.alpha, s[3], d[3], asf[3], adf[3])) * 255)
    return out
}

/**
 * 两个 RGBA8 缓冲逐像素 WebGL 混合，原地写回 dstData 并返回
 * 长度必须相同且为 4 的倍数，行主序排列：data[(y * width + x) * 4 + 0..3] = r, g, b, a
 */
export function blendWebGLCanvas(
    dstData: Uint8ClampedArray,
    srcData: Uint8ClampedArray,
    init: WebGLBlendStateInit = {},
): Uint8ClampedArray {
    if (dstData.length !== srcData.length || dstData.length % 4 !== 0) {
        throw new Error('dstData 与 srcData 必须是长度相同且为 4 的倍数的 RGBA8 缓冲')
    }
    const state = createWebGLBlendState(init)
    const c: Vec4 = [
        state.constant[0] / 255,
        state.constant[1] / 255,
        state.constant[2] / 255,
        state.constant[3] / 255,
    ]
    const dstColor: RGBA = [0, 0, 0, 0]
    const srcColor: RGBA = [0, 0, 0, 0]
    const s: Vec4 = [0, 0, 0, 0]
    const d: Vec4 = [0, 0, 0, 0]
    const out: RGBA = [0, 0, 0, 0]
    for (let i = 0; i < dstData.length; i += 4) {
        dstColor[0] = dstData[i]
        dstColor[1] = dstData[i + 1]
        dstColor[2] = dstData[i + 2]
        dstColor[3] = dstData[i + 3]
        srcColor[0] = srcData[i]
        srcColor[1] = srcData[i + 1]
        srcColor[2] = srcData[i + 2]
        srcColor[3] = srcData[i + 3]
        for (let k = 0; k < 4; k++) {
            s[k] = srcColor[k] / 255
            d[k] = dstColor[k] / 255
        }
        const sf = factorValue(state.func.srcRGB, s, d, c)
        const df = factorValue(state.func.dstRGB, s, d, c)
        for (let k = 0; k < 3; k++) {
            out[k] = Math.round(clamp01(equationValue(state.equation.rgb, s[k], d[k], sf[k], df[k])) * 255)
        }
        const asf = factorValue(state.func.srcAlpha, s, d, c)
        const adf = factorValue(state.func.dstAlpha, s, d, c)
        out[3] = Math.round(clamp01(equationValue(state.equation.alpha, s[3], d[3], asf[3], adf[3])) * 255)
        dstData[i] = out[0]
        dstData[i + 1] = out[1]
        dstData[i + 2] = out[2]
        dstData[i + 3] = out[3]
    }
    return dstData
}
