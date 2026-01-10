import { useEffect, useLayoutEffect, useMemo, useReducer, useState } from "react"
import useDependency from "./useDependency"
/**
 * Y轴(动画进度)
  ↑
1 |                    P3(1,1)
  |                   /
  |                  /
  |                 /
  |                •
  |               / 
  |     P1(x1,y1)
  |     •
  |    /
  |   /
  |  /
P0 •------------------→ X轴(时间)
 (0,0)              1
 */
export class CubicBezierSolver {
  constructor(
    private x1: number,
    private y1: number, 
    private x2: number,
    private y2: number
  ) {}
  
  // 三次贝塞尔曲线公式
  private bezier(t: number, a: number, b: number, c: number, d: number): number {
    const t1 = 1 - t;
    return t1*t1*t1 * a + 
           3 * t1*t1 * t * b + 
           3 * t1 * t*t * c + 
           t*t*t * d;
  }
  
  // 贝塞尔曲线导数（斜率）
  private bezierDerivative(t: number, a: number, b: number, c: number, d: number): number {
    const t1 = 1 - t;
    return 3 * t1*t1 * (b - a) + 
           6 * t1 * t * (c - b) + 
           3 * t*t * (d - c);
  }
  
  // X 坐标函数
  private x(t: number): number {
    return this.bezier(t, 0, this.x1, this.x2, 1);
  }
  
  // X 坐标导数
  private xDerivative(t: number): number {
    return this.bezierDerivative(t, 0, this.x1, this.x2, 1);
  }
  
  // Y 坐标函数
  private y(t: number): number {
    return this.bezier(t, 0, this.y1, this.y2, 1);
  }
  
  // 主函数：输入时间t，返回动画进度
  solve(inputT: number): number {
    if (inputT <= 0) return 0;
    if (inputT >= 1) return 1;
    
    // 找到参数u，使得 x(u) = inputT
    const u = this.findParameterForX(inputT);
    
    // 用找到的u计算y坐标
    return this.y(u);
  }
  
  // 核心算法：牛顿迭代法求解 x(u) = targetX
  private findParameterForX(targetX: number): number {
    // 初始猜测 - 使用线性近似
    let u = targetX;
    
    // 牛顿迭代（通常4-8次就足够精确）
    for (let i = 0; i < 8; i++) {
      // 计算当前误差：x(u) - targetX
      const currentX = this.x(u);
      const error = currentX - targetX;
      
      // 如果误差足够小，停止迭代
      if (Math.abs(error) < 1e-5) {
        break;
      }
      
      // 计算导数（斜率）
      const slope = this.xDerivative(u);
      
      // 避免除零和数值不稳定
      if (Math.abs(slope) < 1e-5) {
        // 如果斜率太小，使用二分法作为备选
        u = this.binarySearchForX(targetX, 0, 1);
        break;
      }
      
      // 牛顿迭代更新：u = u - f(u)/f'(u)
      u = u - error / slope;
      
      // 确保参数在有效范围内
      u = Math.max(0, Math.min(1, u));
    }
    
    return u;
  }
  
  // 备选算法：二分法（当牛顿迭代不稳定时使用）
  private binarySearchForX(targetX: number, low: number, high: number): number {
    let u = (low + high) / 2;
    
    for (let i = 0; i < 16; i++) {
      const currentX = this.x(u);
      const error = currentX - targetX;
      
      if (Math.abs(error) < 1e-5) {
        break;
      }
      
      if (error > 0) {
        high = u;  // x(u) 太大，往左找
      } else {
        low = u;   // x(u) 太小，往右找
      }
      
      u = (low + high) / 2;
    }
    
    return u;
  }
}
type Ticker = {
    update(delta: number): boolean
}
class AnimationTicker {
    static instance: AnimationTicker = null
    static getInstance() {
        if (!this.instance) {
            this.instance = new AnimationTicker()
        }
        return this.instance
    }
    animationId: ReturnType<typeof requestAnimationFrame>
    animationRunning: boolean = false
    startTime = 0
    delta = 0
    lastTime = 0
    callbacks: Ticker[] = []
    type: 'performance' | 'date' = 'performance'
    declare now: () => number
    constructor(type: 'performance' | 'date' = 'performance') {
        this.now = type == 'performance' ? () => {
            return performance.now()
        } : () => {
            return Date.now()
        }
    }
    start() {
        if (this.animationRunning) {
            return
        }

        this.animationRunning = true
        this.startTime = this.lastTime = this.now()
        this.animationId = requestAnimationFrame(this.loop)
    }
    loop = () => {
        const time = this.now()
        if (!this.animationRunning) {
            return
        }
        this.delta = time - this.lastTime
        this.lastTime = time
        this.update(this.delta)
        this.animationId = requestAnimationFrame(this.loop)
    }
    add(task: Ticker) {
        const index = this.callbacks.indexOf(task)
        if (index == -1) {
            this.callbacks.push(task)
            this.start()
        }
    }
    remove(task: Ticker) {
        const index = this.callbacks.indexOf(task)
        if (index > -1) {
            this.callbacks.splice(index, 1)
        }
    }
    update(delta: number) {
        const callbacks = this.callbacks
        let needUpdateCallbacks = false

        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] && callbacks[i].update(delta) === false) {
                callbacks[i] = null
                needUpdateCallbacks = true
            }
        }
        if (needUpdateCallbacks) {
            this.callbacks = this.callbacks.filter(Boolean)
        }
        if (this.callbacks.length === 0) {
            this.stop()
        }

    }
    stop() {
        this.animationRunning = false
        cancelAnimationFrame(this.animationId)
    }
}
type AnimationProps<T = any> = Record<string, T>
type AnimationOptions<T = any> = {
    duration?: number
    loop?: boolean
    delay?: number
    immediatelyComplete?: boolean // 立即完成未结束的动画
    onUpdate?: (cur: AnimationProps<T>, from: AnimationProps<T>, to: AnimationProps<T>) => void
    easing?: (t: number) => number
}
class Animation<T = any> {
    formProps: AnimationProps<T>
    toProps: AnimationProps<T>
    toKeys: string[]
    curProps: AnimationProps<T>
    startTime: number = 0
    delta: number = 0
    elapsedTime: number = 0
    lastTime: number = 0
    isPaused: boolean = false
    isRunning: boolean = false
    options: AnimationOptions
    // 构造函数：初始化动画选项，支持自定义配置
    constructor(options?:AnimationOptions<T>) {
         this.options = { duration: 1000, delay: 0, easing: (t: number) => t, ...(options ?? {}) }
    }
    get owner(){
        return AnimationTicker.getInstance()
    }
    from(fromProps: AnimationProps<T>) {
        this.formProps = Object.assign({}, fromProps)
    }
    to(toProps: AnimationProps<T>) {
        this.toProps = Object.assign({}, toProps)
        this.toKeys = Object.keys(this.toProps)
    }
    start(options?: AnimationOptions) {
        this.options =Object.assign({}, this.options, options||{})
        this.curProps = {}
        this.startTime = this.lastTime =this.owner.now()
        this.elapsedTime = -this.options.delay
        this.owner.add(this)
    }
    pause() {
        this.isPaused = true
    }
    resume() {
        this.isPaused = false
    }
    stop() {
        this.owner.remove(this)
        this.isRunning = false
    }
    lerp(a: any, b: any, t: any) {
        return a + (b - a) * t
    }
    update(delta: number) {
        if (this.isPaused) {
            return true
        }
        this.elapsedTime += delta
        if(this.elapsedTime<0){
            return true
        }
        const rate = this.elapsedTime / this.options.duration
        const precent = Math.max(0, Math.min(1, rate))
        const t = this.options.easing(precent)
        this.toKeys.forEach(key => {
            this.curProps[key] = this.lerp(this.formProps[key], this.toProps[key], t)
        })
        this.options.onUpdate?.(this.curProps, this.formProps, this.toProps)
        if (this.options.loop && precent === 1) {
            this.elapsedTime = 0
            return true
        } else if (precent === 1) {
            this.isRunning=false
            return false
        }

        return true
    }
}

const useAnimation = (props:{from:any,to:any},options?:AnimationOptions) => {
    const [state,setState]=useState(()=>props.from)
    const [_,update]=useReducer(v=>!v,false)
    const [animation]=useState(()=>new Animation({
        ...(options??{}),
        onUpdate:(cur,from,to)=>{
            setState({...cur})
   
        }
    }))
    useMemo(()=>{
        animation.from(props.from)
    },useDependency(props.from))
    useLayoutEffect(()=>{
        if(props.to){
            animation.to(props.to)
            animation.start()
        }
    },useDependency(props.to))
    return [state,animation] as const
}

export default useAnimation