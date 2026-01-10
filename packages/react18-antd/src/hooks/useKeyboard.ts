import type { RefObjectOrFunc } from "./util";
import  { getRefOrFuncObject } from "./util";
import useEventListener from './useEventListener'
import { useState, type KeyboardEvent, type useRef } from "react";
import useUpdate from "./useUpdate";
type UseKeyboardProps={
    target?:RefObjectOrFunc<Window|HTMLElement>
    onKeyDown?:(key:string,e:KeyboardEvent)=>void,// 键按下
    onKeyRelease?:(key:string,e:KeyboardEvent)=>void,// 键按下释放
    onKeyPress?:(key:string,e:KeyboardEvent)=>void, // 键按下

}
const useKeyboard=(props:UseKeyboardProps={})=>{
    const update=useUpdate()
    const [{downKeys}]=useState(()=>({
        downKeys:new Set<string>()
    }))
    const handleKeydown=(e:KeyboardEvent)=>{
        const key=e.key.toLowerCase()
        if(!downKeys.has(key)){
            downKeys.add(key)
            props.onKeyPress?.(key,e)
        }
        props.onKeyDown?.(key,e)
    }
      const handleUp=(e:KeyboardEvent)=>{
        const key=e.key.toLowerCase()
        if(downKeys.has(key)){
            downKeys.delete(key)
            props.onKeyRelease?.(key,e)
        }
    }
    const element=props.target?getRefOrFuncObject<Window|HTMLElement>(props.target):window
    useEventListener({current:element},'keydown',handleKeydown,true)
    useEventListener({current:element},'keyup',handleUp,true)
    return {
        isDown:(key:string)=>downKeys.has(key)
    }
}
export default useKeyboard