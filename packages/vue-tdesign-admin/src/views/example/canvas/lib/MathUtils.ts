export const EPSILON = 1e-6
export const PI=Math.PI
export const PI_2=PI/2
export const PI_4=PI/4
export const TWO_PI=PI*2
export const DEG_TO_RAD=PI/180
export const RAD_TO_DEG=180/PI

export const degToRad=(deg:number)=>{
    return deg*DEG_TO_RAD
}
export const radToDeg=(rad:number)=>{
    return rad*RAD_TO_DEG
}

/**
 * 判断浮点数是否接近零
 */
function isNearZero(v: number, eps = EPSILON): boolean {
    return Math.abs(v) < eps
}
export const equalsEpsilon = (a: number, b: number, epsilon: number = EPSILON) => {
    return isNearZero(a-b,epsilon)
}
export const equals = (a: number, b: number) => {
    return a === b
}
export const isFinite=(v:number)=>{
    return Number.isFinite(v)
}
export const interpolate = (a: number, b: number, t: number) => {
    return a + (b - a) * t
}
export const random=(min:number,max:number)=>{
    return min+Math.random()*(max-min)
}

export const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value))
}
export const smoothStep = (t: number) => {
    return t * t * (3 * t - 2)
}
export const mix=(value:number,start:number, end:number)=>{
    return clamp((value-start)/(end-start),0,1)
}



/**
 * 求解一元二次方程 ax² + bx + c = 0（a ≠ 0）
 * @param a - 二次项系数
 * @param b - 一次项系数
 * @param c - 常数项
 * @returns 实根数组（可能 0、1、2 个根）
 */
export function solveQuadratic(a: number, b: number, c: number): number[] {
    if (isNearZero(a)) {
        if (isNearZero(b)) return []
        return [-c / b]
    }

    const delta = b * b - 4 * a * c

    if (delta < -EPSILON) return []

    if (isNearZero(delta)) {
        return [-b / (2 * a)]
    }

    const sqrtDelta = Math.sqrt(delta)
    return [(-b - sqrtDelta) / (2 * a), (-b + sqrtDelta) / (2 * a)]
}

/**
 * 卡尔丹公式求解一元三次方程 ax³ + bx² + cx + d = 0（a ≠ 0）
 *
 * 令 x = y - b/(3a)，化为缺项三次方程 y³ + py + q = 0
 * 判别式 Δ = (q/2)² + (p/3)³
 *
 * @param a - 三次项系数
 * @param b - 二次项系数
 * @param c - 一次项系数
 * @param d - 常数项
 * @returns 实根数组（可能 1、2、3 个根）
 */
export function solveCubicByCardano(a: number, b: number, c: number, d: number): number[] {
    if (isNearZero(a)) return solveQuadratic(b, c, d)

    // 除以 a，化为首一三次方程
    const A = b / a
    const B = c / a
    const C = d / a

    // 令 x = y - A/3
    const p = B - A * A / 3
    const q = C - A * B / 3 + 2 * A * A * A / 27

    const offset = -A / 3

    // 判别式
    const delta = (q / 2) * (q / 2) + (p / 3) * (p / 3) * (p / 3)

    const roots: number[] = []

    if (delta > EPSILON) {
        // 一个实根
        const sqrtDelta = Math.sqrt(delta)
        const u = Math.cbrt(-q / 2 + sqrtDelta)
        const v = Math.cbrt(-q / 2 - sqrtDelta)
        roots.push(u + v + offset)
    } else if (isNearZero(delta)) {
        // 两个实根（一个单根和一个重根）
        const u = Math.cbrt(-q / 2)
        roots.push(2 * u + offset)
        roots.push(-u + offset)
    } else {
        // 三个实根（用三角函数法）
        const r = Math.sqrt(-(p / 3) * (p / 3) * (p / 3))
        const theta = Math.acos(-q / (2 * r))
        const sqrtP = Math.sqrt(-p / 3)
        for (let k = 0; k < 3; k++) {
            roots.push(2 * sqrtP * Math.cos((theta + 2 * Math.PI * k) / 3) + offset)
        }
    }

    return roots.sort((a, b) => a - b)
}

/**
 * 盛金公式求解一元三次方程 ax³ + bx² + cx + d = 0（a ≠ 0）
 *
 * A = b² - 3ac
 * B = bc - 9ad
 * C = c² - 3bd
 * Δ = B² - 4AC
 *
 * @param a - 三次项系数
 * @param b - 二次项系数
 * @param c - 一次项系数
 * @param d - 常数项
 * @returns 实根数组（可能 1、2、3 个根）
 */
export function solveCubicByShengjin(a: number, b: number, c: number, d: number): number[] {
    if (isNearZero(a)) return solveQuadratic(b, c, d)

    const A = b * b - 3 * a * c
    const B = b * c - 9 * a * d
    const C = c * c - 3 * b * d
    const delta = B * B - 4 * A * C

    if (isNearZero(A) && isNearZero(B)) {
        // 三重根
        return [-b / (3 * a)]
    }

    if (delta > EPSILON) {
        // 一个实根
        const y1 = A * b + 3 * a * ((-B + Math.sqrt(delta)) / 2)
        const y2 = A * b + 3 * a * ((-B - Math.sqrt(delta)) / 2)
        const x = (-b - (Math.cbrt(y1) + Math.cbrt(y2))) / (3 * a)
        return [x]
    }

    if (isNearZero(delta)) {
        // 两个实根（一个单根和一个重根）
        const K = B / A
        const x1 = -b / a + K
        const x2 = -K / 2
        return [x1, x2].sort((a, b) => a - b)
    }

    // 三个实根（Δ < 0）
    const T = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A))
    const theta = Math.acos(T)
    const sqrtA = Math.sqrt(A)
    const roots: number[] = []
    for (let k = 0; k < 3; k++) {
        const x = (-b - 2 * sqrtA * Math.cos((theta + 2 * Math.PI * k) / 3)) / (3 * a)
        roots.push(x)
    }
    return roots.sort((a, b) => a - b)
}