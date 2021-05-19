/**
 * 状态更新后回调
 * @author fanyonglong
 */
import {useEffect,useState,useCallback,useRef} from 'react'

export function useStateCallback(defaultState:any){
    let [state,_setState]=useState<any>(defaultState)
    let instance=useRef({init:false,callbacks:[]}).current
    let setState=useCallback((nextState:any,callback?:()=>void)=>{
        _setState(nextState)
        if(callback){
            instance.callbacks.push(callback)
        }
    },[])
    useEffect(() => {
        if(instance.callbacks.length){
              let callbacks=instance.callbacks.slice()
              instance.callbacks.length=0
              callbacks.forEach(callback=>{
                  callback(state)
              })
        }
    }, [state])
    return [state,setState]
}
