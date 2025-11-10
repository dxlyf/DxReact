import {useLayoutEffect,useEffect, useRef} from 'react'

const createUpdateEffect=(useEffectFn:typeof useLayoutEffect|typeof useEffect)=>{
   
    return function useUpdateEffect(effect:Parameters<typeof useEffect>[0],deps:Parameters<typeof useEffect>[1]){
        const isMounted=useRef(false)
        useEffectFn(()=>{
            if(!isMounted.current){
                isMounted.current=true
                return
            }
            return effect()
        },deps)
    }; 
}

const useUpdateLayoutEffect=createUpdateEffect(useLayoutEffect)
const useUpdateEffect=createUpdateEffect(useEffect)

export {
    useUpdateEffect,
    useUpdateLayoutEffect
}