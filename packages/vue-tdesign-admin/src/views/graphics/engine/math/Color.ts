import * as MathUtils from './utils/MathUtils'

export type ColorInput =
    | string // '#rgb' '#rrggbb' '#rrggbbaa' 'rgb()' 'rgba()' 'hsl()' 'hsla()' 或 CSS 颜色名
    | number // 0xRRGGBB
    | readonly [number, number, number] // [r, g, b] 0-255
    | readonly [number, number, number, number] // [r, g, b] 0-255, a 0-1
    | Color

const NAMED_COLORS: Record<string, number> = {
    transparent: 0x00000000,
    black: 0x000000, white: 0xffffff,
    red: 0xff0000, green: 0x00ff00, blue: 0x0000ff,
    yellow: 0xffff00, cyan: 0x00ffff, magenta: 0xff00ff,
    gray: 0x808080, grey: 0x808080, silver: 0xc0c0c0,
    maroon: 0x800000, olive: 0x808000, lime: 0x00ff00,
    aqua: 0x00ffff, teal: 0x008080, navy: 0x000080,
    fuchsia: 0xff00ff, orange: 0xffa500, purple: 0x800080,
    pink: 0xffc0cb, brown: 0xa52a2a, gold: 0xffd700,
}

/**
 * 颜色
 *
 * 内部统一以 RGBA 存储：rgb 三个 0-255 通道，alpha 为 0-1，
 * 提供字符串 / 16 进制数 / 数组之间的互转与色相操作。
 */
export class Color {
    r: number
    g: number
    b: number
    a: number

    constructor(r = 0, g = 0, b = 0, a = 1) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    /** 从多种输入创建颜色 */
    static from(input: ColorInput): Color {
        if (input instanceof Color) return new Color(input.r, input.g, input.b, input.a)
        if (typeof input === 'number') return Color.fromHex(input)
        if (Array.isArray(input)) {
            const [r, g, b, a = 1] = input
            return new Color(r, g, b, a)
        }
        return Color.parse(input as string)
    }

    /** 解析 CSS 颜色字符串 */
    static parse(value: string): Color {
        const str = value.trim().toLowerCase()
        if (str.startsWith('#')) return Color.fromHex(str)
        if (str.startsWith('rgb')) return Color.parseRgb(str)
        if (str.startsWith('hsl')) return Color.parseHsl(str)
        if (str.startsWith('hsv')) return Color.parseHsv(str)
        const hex = NAMED_COLORS[str]
        if (hex !== undefined) return Color.fromHex(hex)
        // 兜底：尝试交给浏览器解析
        const probe = new Color()
        probe.set(value)
        return probe
    }

    private static parseRgb(str: string): Color {
        const match = str.match(/rgba?\(([^)]+)\)/)
        const parts = (match ? match[1] : '').split(',').map((p) => p.trim())
        const r = Number(parts[0] ?? 0)
        const g = Number(parts[1] ?? 0)
        const b = Number(parts[2] ?? 0)
        // alpha 可能是 0-1 或 0-100%
        const rawA = parts[3]
        let a = 1
        if (rawA !== undefined) {
            const v = parseFloat(rawA)
            a = rawA.endsWith('%') ? v / 100 : v
        }
        return new Color(r, g, b, a)
    }

    private static parseHsl(str: string): Color {
        const match = str.match(/hsla?\(([^)]+)\)/)
        const parts = (match ? match[1] : '').split(',').map((p) => p.trim())
        const h = Number(parts[0] ?? 0)
        const s = parseFloat(parts[1] ?? '0') / 100
        const l = parseFloat(parts[2] ?? '0') / 100
        const rawA = parts[3]
        let a = 1
        if (rawA !== undefined) {
            const v = parseFloat(rawA)
            a = rawA.endsWith('%') ? v / 100 : v
        }
        return Color.hslToRgb(h, s, l, a)
    }

    private static parseHsv(str: string): Color {
        const match = str.match(/hsva?\(([^)]+)\)/)
        const parts = (match ? match[1] : '').split(/[,\s]+/).map((p) => p.trim()).filter(Boolean)
        const h = Number(parts[0] ?? 0)
        // s/v 可为 0-100（%）或 0-1
        const rawS = parts[1] ?? '0'
        const rawV = parts[2] ?? '0'
        const s = rawS.endsWith('%') ? parseFloat(rawS) / 100 : parseFloat(rawS)
        const v = rawV.endsWith('%') ? parseFloat(rawV) / 100 : parseFloat(rawV)
        const rawA = parts[3]
        let a = 1
        if (rawA !== undefined) {
            const vv = parseFloat(rawA)
            a = rawA.endsWith('%') ? vv / 100 : vv
        }
        return Color.hsvToRgb(h, s, v, a)
    }

    /** 从 16 进制数（0xRRGGBB / 0xRRGGBBAA）或 '#rgb' '#rrggbb' '#rrggbbaa' 创建 */
    static fromHex(value: number | string): Color {
        if (typeof value === 'number') {
            if (value <= 0xffffff) {
                return new Color((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
            }
            return new Color((value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, (value & 0xff) / 255)
        }
        let hex = value.replace('#', '')
        if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
        if (hex.length === 4) hex = hex.split('').map((c) => c + c).join('')
        if (hex.length === 6) hex += 'ff'
        const int = parseInt(hex, 16)
        return new Color((int >> 24) & 0xff, (int >> 16) & 0xff, (int >> 8) & 0xff, (int & 0xff) / 255)
    }

    /** 用 CSS 字符串解析结果覆盖当前颜色（兜底用） */
    set(value: string): this {
        if (typeof document !== 'undefined') {
            const ctx = Color.ctx2d ?? (Color.ctx2d = document.createElement('canvas').getContext('2d')!)
            ctx.fillStyle = value
            ctx.fillStyle = '#000000'
            const resolved = ctx.fillStyle
            if (resolved !== '#000000') {
                const c = Color.parse(resolved)
                this.r = c.r; this.g = c.g; this.b = c.b; this.a = c.a
            }
        }
        return this
    }
    private static ctx2d: CanvasRenderingContext2D | null = null

    static hslToRgb(h: number, s: number, l: number, a = 1): Color {
        h = ((h % 360) + 360) % 360
        if (s === 0) {
            const v = l * 255
            return new Color(v, v, v, a)
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        const hue2rgb = (t: number): number => {
            t = ((t % 1) + 1) % 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        return new Color(hue2rgb(h / 360 + 1 / 3) * 255, hue2rgb(h / 360) * 255, hue2rgb(h / 360 - 1 / 3) * 255, a)
    }

    /** HSV → RGB（h: 0-360, s/v: 0-1, a: 0-1） */
    static hsvToRgb(h: number, s: number, v: number, a = 1): Color {
        h = ((h % 360) + 360) % 360
        s = MathUtils.clamp(s, 0, 1)
        v = MathUtils.clamp(v, 0, 1)
        const c = v * s
        const hp = h / 60
        const x = c * (1 - Math.abs((hp % 2) - 1))
        let r1 = 0, g1 = 0, b1 = 0
        if (hp < 1) [r1, g1, b1] = [c, x, 0]
        else if (hp < 2) [r1, g1, b1] = [x, c, 0]
        else if (hp < 3) [r1, g1, b1] = [0, c, x]
        else if (hp < 4) [r1, g1, b1] = [0, x, c]
        else if (hp < 5) [r1, g1, b1] = [x, 0, c]
        else [r1, g1, b1] = [c, 0, x]
        const m = v - c
        return new Color((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255, a)
    }

    /** 转为 HSV/HSVA（h: 0-360, s/v: 0-1, a: 0-1） */
    toHsv(): { h: number; s: number; v: number; a: number } {
        const r = this.r / 255, g = this.g / 255, b = this.b / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const v = max
        const d = max - min
        let h = 0, s = 0
        if (max !== 0) s = d / max
        if (d !== 0) {
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
            else if (max === g) h = (b - r) / d + 2
            else h = (r - g) / d + 4
            h *= 60
        }
        return { h, s, v, a: this.a }
    }

    /** 转为 HSL/HSLA（h: 0-360, s/l: 0-1, a: 0-1） */
    toHsl(): { h: number; s: number; l: number; a: number } {
        const r = this.r / 255, g = this.g / 255, b = this.b / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const l = (max + min) / 2
        let h = 0, s = 0
        if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
            else if (max === g) h = (b - r) / d + 2
            else h = (r - g) / d + 4
            h *= 60
        }
        return { h, s, l, a: this.a }
    }

    /** 16 进制数形式（0xRRGGBB），忽略 alpha */
    toHex(): number {
        return (Math.round(this.r) << 16) | (Math.round(this.g) << 8) | Math.round(this.b)
    }

    /** CSS 字符串形式 */
    toString(): string {
        const r = Math.round(this.r), g = Math.round(this.g), b = Math.round(this.b)
        if (this.a >= 1) return `#${this.hexOf(r)}${this.hexOf(g)}${this.hexOf(b)}`
        return `rgba(${r}, ${g}, ${b}, ${MathUtils.clamp(this.a, 0, 1)})`
    }

    /** canvas fillStyle/strokeStyle 直接可用形式 */
    toCss(): string {
        return this.toString()
    }

    private hexOf(v: number): string {
        const s = MathUtils.clamp(v, 0, 255).toString(16)
        return s.length === 1 ? '0' + s : s
    }

    /** 0-1 归一化的数组 [r, g, b, a]（r/g/b 归一化到 0-1，a 本身为 0-1） */
    toArray(): [number, number, number, number] {
        return [this.r / 255, this.g / 255, this.b / 255, this.a]
    }

    /** 0-255 数组 [r, g, b, a]（a 换算为 0-255） */
    toArray255(): [number, number, number, number] {
        return [this.r, this.g, this.b, this.a * 255]
    }

    clone(): Color {
        return new Color(this.r, this.g, this.b, this.a)
    }

    copy(c: Color): this {
        this.r = c.r; this.g = c.g; this.b = c.b; this.a = c.a
        return this
    }

    equals(c: Color, epsilon = 0): boolean {
        return (
            Math.abs(this.r - c.r) <= epsilon &&
            Math.abs(this.g - c.g) <= epsilon &&
            Math.abs(this.b - c.b) <= epsilon &&
            Math.abs(this.a - c.a) <= epsilon
        )
    }

    /** 线性插值 */
    lerp(c: Color, t: number): Color {
        return new Color(
            MathUtils.lerp(this.r, c.r, t),
            MathUtils.lerp(this.g, c.g, t),
            MathUtils.lerp(this.b, c.b, t),
            MathUtils.lerp(this.a, c.a, t),
        )
    }

    /** 按比例调整透明度（alpha 乘法，0-1） */
    withAlpha(alpha: number): Color {
        const c = this.clone()
        c.a = this.a * MathUtils.clamp(alpha, 0, 1)
        return c
    }

    /** 反色（忽略 alpha） */
    invert(): Color {
        return new Color(255 - this.r, 255 - this.g, 255 - this.b, this.a)
    }

    /** 常用预定义颜色 */
    static readonly WHITE = new Color(255, 255, 255)
    static readonly BLACK = new Color(0, 0, 0)
    static readonly RED = new Color(255, 0, 0)
    static readonly GREEN = new Color(0, 255, 0)
    static readonly BLUE = new Color(0, 0, 255)
    static readonly TRANSPARENT = new Color(0, 0, 0, 0)
}
