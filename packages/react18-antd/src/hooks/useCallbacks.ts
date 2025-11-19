import { useRef, useState } from "react"


function createCallbacksProxy<T extends Record<string, any>>() {

    const callbacks = {} as {
        [K in keyof T]: Callback<T[K]>
    };
    const register = (name: keyof T, fn: Callback<T[keyof T]>) => {
        console.log('注册', name)
        callbacks[name] = fn;
    }

    return new Proxy(callbacks, {
        get(target: any, key: string) {
            const isRegister = key.startsWith('on')
            if (!isRegister && target[key]) {
                return target[key]
            }
            if (isRegister && !target[key]) {
                target[key] = register.bind(null, firstToLowerCase(key.slice(2)))
            }
            return target[key] as any
        }
    })
}
const firstToLowerCase = (str: string) => {
        return str.charAt(0).toLowerCase() + str.slice(1)
}
type RegisterCallback<T>=(fn:Callback<T>) =>void

type GetArgs<T> = T extends Array<any> ? T : [T]
type Callback<T> = (...args: GetArgs<T>) => any;
type GetMethod<T extends string> = T extends `on${infer Event}` 
  ? Uncapitalize<Event> 
  : T;
type CallbacksObject<T extends Record<string,any>>={
    methods:{
        [K in keyof T]: RegisterCallback<T[K]>
    },
    callbacks:{
        [K in keyof T as GetMethod<K&string>]: Callback<T[K]>
    }
}
export type CallbacksResult<T extends string[]>={
    [K in keyof T as T[K&number]]: RegisterCallback<any>
}&{
    [K in keyof T as GetMethod<T[K&number]&string>]: Callback<any>
}

const reisterCallback = (target: CallbacksObject<any>,type:string,handle:Callback<any>) => {
    target.callbacks[type] = handle
}
const applyCallback = (target:CallbacksObject<any>,method:string,...args:any[]) => {
    if(target.callbacks[method]){
       return target.callbacks[method](...args)
    }
}
const regisetMethods = <T extends string[]>(target: any, methods:T)=> {
    target.methods = Object.create(null)
    target.callbacks = Object.create(null)
    for (const method of methods) {
        const callName=firstToLowerCase(method.slice(2))
        target.methods[method] =reisterCallback.bind(null,target,callName)
        target.methods[callName] =applyCallback.bind(null,target,callName)
    }
    return {
        ...target.methods,
    } as CallbacksResult<T>
}
const useCallbacks = <T extends string[]>(callbackMethods:T) => {
    const [target] = useState(()=>regisetMethods({},callbackMethods))
    return target
}
export default useCallbacks