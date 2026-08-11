
export class Color {
    r: number = 0
    g: number = 0
    b: number = 0
    a: number = 1
    constructor() {

    }
    set(r: number, g: number, b: number, a: number) {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
    }

    /** RGB 分量元组：[r, g, b, a?]，r/g/b 为 0~255，a 为 0~1 */
    static fromArray(arr: [number, number, number, number] | [number, number, number]): Color {
        const c = new Color()
        c.r = arr[0]
        c.g = arr[1]
        c.b = arr[2]
        c.a = arr.length > 3 ? arr[3] : 1
        return c
    }

    /**
     * 从多种输入创建 Color 实例。
     * 支持：
     *   - hex 字符串：'#ff8040' / 'ff8040' / '#f80'
     *   - css 颜色字符串：'rgb(255,128,64)' / 'rgba(...)' / 'hsl(20,100%,50%)' / 'hsv(20,100%,100%)'（支持 alpha）
     *   - rgb 对象：{ r, g, b, a? }
     *   - hsl 对象：{ h, s, l, a? }
     *   - hsv 对象：{ h, s, v, a? }
     *   - RGB 数组：[r, g, b] 或 [r, g, b, a]
     */
    static from(input: string | { r: number, g: number, b: number, a?: number } | { h: number, s: number, l: number, a?: number } | { h: number, s: number, v: number, a?: number } | [number, number, number, number] | [number, number, number]): Color {
        if (typeof input === 'string') {
            return Color.parseString(input)
        }
        if (Array.isArray(input)) {
            return Color.fromArray(input)
        }
        if ('r' in input) {
            return Color.fromArray([input.r, input.g, input.b, input.a ?? 1])
        }
        if ('v' in input) {
            const c = new Color().setHsv(input.h, input.s, input.v)
            c.a = input.a ?? 1
            return c
        }
        // hsl 对象
        const c = new Color().setHsl(input.h, input.s, input.l)
        c.a = input.a ?? 1
        return c
    }

    /** 数字或百分比（'100%' → 1）解析 */
    private static parseNumber(v: string): number {
        const t = v.trim()
        return t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t)
    }

    /**
     * 解析颜色字符串：hex / rgb() / rgba() / hsl() / hsla() / hsv() / hsva()。
     * rgb 分量可为 0~255 或百分比；hsl/hsv 的 s、l、v 可为百分比。
     * 无法识别时抛出错误。
     */
    private static parseString(s: string): Color {
        const str = s.trim()
        // hex：'#f80' / '#ff8040' / 'ff8040' / 'f80'
        if (str.startsWith('#') || /^[0-9a-fA-F]{3}$/.test(str) || /^[0-9a-fA-F]{6}$/.test(str)) {
            return new Color().setHex(str)
        }
        // rgb()/rgba()
        let m = str.match(/^rgba?\(([^)]+)\)$/i)
        if (m) {
            const p = m[1].split(',').map(v => v.trim())
            if (p.length < 3) throw new Error(`无效的 rgb 颜色: ${s}`)
            const isPct = p[0].endsWith('%')
            const to255 = (v: string) => {
                const n = Color.parseNumber(v)
                return Math.round((isPct ? n * 255 : n))
            }
            const c = new Color()
            c.r = to255(p[0])
            c.g = to255(p[1])
            c.b = to255(p[2])
            c.a = p.length > 3 ? Color.parseNumber(p[3]) : 1
            return c
        }
        // hsl()/hsla() 与 hsv()/hsva()
        m = str.match(/^hsla?\(([^)]+)\)$/i)
        if (m) {
            const p = m[1].split(',').map(v => v.trim())
            if (p.length < 3) throw new Error(`无效的 hsl 颜色: ${s}`)
            const c = new Color().setHsl(parseFloat(p[0]), Color.parseNumber(p[1]), Color.parseNumber(p[2]))
            c.a = p.length > 3 ? Color.parseNumber(p[3]) : 1
            return c
        }
        m = str.match(/^hsva?\(([^)]+)\)$/i)
        if (m) {
            const p = m[1].split(',').map(v => v.trim())
            if (p.length < 3) throw new Error(`无效的 hsv 颜色: ${s}`)
            const c = new Color().setHsv(parseFloat(p[0]), Color.parseNumber(p[1]), Color.parseNumber(p[2]))
            c.a = p.length > 3 ? Color.parseNumber(p[3]) : 1
            return c
        }
        throw new Error(`无法识别的颜色字符串: ${s}`)
    }

    /**
     * 从十六进制颜色串解析并设置 RGB。
     * 支持 #rgb / #rrggbb（'#' 可省略），a 保持不变。
     * @param hex 如 '#ff8040' 或 'ff8040' 或 '#f80'
     */
    setHex(hex: string): this {
        let h = hex.replace('#', '')
        if (h.length === 3) {
            // 3 位短格式：#f80 → ff8800
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
        }
        this.r = parseInt(h.slice(0, 2), 16)
        this.g = parseInt(h.slice(2, 4), 16)
        this.b = parseInt(h.slice(4, 6), 16)
        return this
    }

    /** RGB → 十六进制颜色串，如 '#ff8040' */
    toHex(): string {
        const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
        return '#' + to(this.r) + to(this.g) + to(this.b)
    }

    /**
     * HSL → RGB 并设置。h 范围 0~360，s/l 范围 0~1，a 保持不变。
     * 标准色相转 RGB 算法：将色环 360° 归一化为 6 段，每段线性插值。
     */
    setHsl(h: number, s: number, l: number): this {
        const hn = ((h % 360) + 360) % 360 / 360 // 归一化到 [0,1)
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        const hue2rgb = (t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        this.r = Math.round(hue2rgb(hn + 1 / 3) * 255)
        this.g = Math.round(hue2rgb(hn) * 255)
        this.b = Math.round(hue2rgb(hn - 1 / 3) * 255)
        return this
    }

    /** RGB → HSL。返回 { h: 0~360, s: 0~1, l: 0~1 } */
    toHsl(): { h: number, s: number, l: number } {
        const r = this.r / 255
        const g = this.g / 255
        const b = this.b / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        const l = (max + min) / 2
        if (d === 0) return { h: 0, s: 0, l } // 灰色，无色相
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        let h: number
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        return { h: h * 60, s, l }
    }

    /**
     * HSV → RGB 并设置。h 范围 0~360，s/v 范围 0~1，a 保持不变。
     * 色相段插值 + 亮度/饱和度按比例换算。
     */
    setHsv(h: number, s: number, v: number): this {
        const hn = ((h % 360) + 360) % 360 / 360 // 归一化到 [0,1)
        const i = Math.floor(hn * 6)
        const f = hn * 6 - i
        const p = v * (1 - s)
        const q = v * (1 - f * s)
        const t = v * (1 - (1 - f) * s)
        let r = v, g = v, b = v
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break
            case 1: r = q; g = v; b = p; break
            case 2: r = p; g = v; b = t; break
            case 3: r = p; g = q; b = v; break
            case 4: r = t; g = p; b = v; break
            case 5: r = v; g = p; b = q; break
        }
        this.r = Math.round(r * 255)
        this.g = Math.round(g * 255)
        this.b = Math.round(b * 255)
        return this
    }

    /** RGB → HSV。返回 { h: 0~360, s: 0~1, v: 0~1 } */
    toHsv(): { h: number, s: number, v: number } {
        const r = this.r / 255
        const g = this.g / 255
        const b = this.b / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        const v = max
        if (d === 0) return { h: 0, s: 0, v } // 灰色，无色相
        const s = max === 0 ? 0 : d / max
        let h: number
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0))
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        return { h: h * 60, s, v }
    }
}
