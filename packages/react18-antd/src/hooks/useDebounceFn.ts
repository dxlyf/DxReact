import { useCallback, useMemo } from "react";
import { debounce } from 'lodash-es'


// 2. 创建一个包装函数，它负责管理Promise的解析
function createDebouncedPromise(fn: any, wait: number, options: any) {
    let resolveCallback: any, rejectCallback: any;
    let pendingPromise: any = null;

    // 这是被防抖处理的函数
    const debouncedFunction = debounce(async (...args) => {
        try {
            const result = await fn(...args);
            if (resolveCallback) {
                resolveCallback(result);
            }
            // 重置
            pendingPromise = null;
            resolveCallback = null;
            rejectCallback = null;
        } catch (error) {
            if (rejectCallback) {
                rejectCallback(error);
            }
            // 重置
            pendingPromise = null;
            resolveCallback = null;
            rejectCallback = null;
        }
    }, wait, options);

    // 返回的才是我们实际调用的防抖函数
    return (...args: any[]) => {
        // 如果还没有pending中的Promise，就创建一个
        if (!pendingPromise) {
            pendingPromise = new Promise((resolve, reject) => {
                resolveCallback = resolve;
                rejectCallback = reject;
            });
        }
        // 调用防抖函数
        debouncedFunction(...args);
        // 返回Promise
        return pendingPromise;
    };
}


function debouncefn(fn:(...args:any[])=>any,wait:number){
        let timeout: ReturnType<typeof setTimeout> | null = null;
        // let ret:any
        let lastArgs: any = null
        let lastThat: any = null
        let ret:any
        return function(this:any,...args: any[]){
            if (timeout) {
                clearTimeout(timeout);
            }
            lastArgs = args
            lastThat = this
            timeout = setTimeout(async () => {
                 ret = fn.apply(lastThat, lastArgs);
                 lastThat=null
                 lastArgs=null
            },wait);
            return ret
        }
}
// 将 handleInput 绑定到你的输入框事件

const useDebounceFn = (fn: (...args: any[]) => any, wait: number, immediately: boolean = false) => {
    const debouncedFn = useMemo(() => {
        
    }, [wait])
    return debouncedFn;
}