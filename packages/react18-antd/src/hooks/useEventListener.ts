import { useEffect } from "react";
import type { RefObjectOrFunc } from "./util";
import {getRefOrFuncObject} from './util'
import { useMemoizedFn } from "./hooks";

const useEventListener=<E>(el:RefObjectOrFunc<EventTarget>,type:string,handle:(e:E)=>void,options:boolean | AddEventListenerOptions=false)=>{
    const handleEvent=useMemoizedFn(handle)
    const element=getRefOrFuncObject(el)
    useEffect(()=>{
        if(!element){
             return;
        }
        element.addEventListener(type as any,handleEvent as EventListener,options)
        return ()=>{
            element.removeEventListener(type as any,handleEvent as EventListener,options)
        }
    },[element])
}
export default useEventListener