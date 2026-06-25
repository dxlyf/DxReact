export const EPSILON = 1e-6
export const TWO_PI = Math.PI * 2
export const PI = Math.PI
export const PI_2 = Math.PI / 2
export const PI_4 = Math.PI / 4
export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI
export const SQRT2=Math.SQRT2
export const SQRT1_2=Math.SQRT1_2

export const degToRad = (deg: number) => {
    return deg * DEG_TO_RAD
}
export const radToDeg = (rad: number) => {
    return rad * RAD_TO_DEG
}

export const equalsEpsilon = (a: number, b: number, epsilon: number = EPSILON) => {
    return Math.abs(a - b) <= epsilon
}
export const equals = (a: number, b: number) => {
    return equalsEpsilon(a, b)
}
export const interpolate = (a: number, b: number, t: number) => {
    return a + (b - a) * t
}
export const mod=(a:number,b:number)=>{
    return a%b
}
export const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value))
}
export const random = (min: number, max: number) => {
    return min + Math.random() * (max - min)
}

export const sign = (value: number) => {
    return value < 0 ? -1 : value > 0 ? 1 : 0
}
export const abs = (value: number) => {
    return Math.abs(value)
}
export const sqrt = (value: number) => {
    return Math.sqrt(value)
}
export const pow =(value:number,exponent:number)=>{
    return Math.pow(value,exponent)
}
export const log = (value: number) => {
    return Math.log(value)
}

export const smoothStep = (t: number) => {
    return t * t * (3 * t - 2)
}
export const mix=(value:number,start:number, end:number)=>{
    return clamp((value-start)/(end-start),0,1)
}
