import { useCallback, useEffect, useReducer, useRef } from "react"
import useMemoizedFn from "./useMemoizedFn"

const useFullScreen=(target:React.RefObject<HTMLElement>,options?:{
    onEnter?:()=>void,
    onExit?:()=>void
})=>{
    const [,update]=useReducer(s=>!s,false)

    const fullScreen=useRef(false)
     const isDocumentInFullScreenMode=useCallback(()=>{
         return document.fullscreenElement !== null&&document.fullscreenElement===target.current;
    },[])
    const enterFullScreen=useCallback(()=>{
        if(target.current&&!fullScreen.current&&!document.fullscreenElement){
            target.current!.requestFullscreen?.({
                navigationUI:'hide'
            }).then(()=>{
            }).catch(()=>{

            })
        }
    },[])
    const exitFullScreen=useCallback((force:boolean=false)=>{
        if(fullScreen.current&&document.fullscreenElement||force){
            document.exitFullscreen?.().then(()=>{
            })
        }
    },[])
    const change=useMemoizedFn((visible:boolean)=>{
        if(visible){
            options?.onEnter?.()
        }else{
            options?.onExit?.()
        }
        fullScreen.current=visible;
        update()
    })

    const toggleFullscreen=useCallback(()=>{
        if(fullScreen.current){
            exitFullScreen()
        }else{
            enterFullScreen()
        }
    },[])

    const handleChange=useMemoizedFn((e)=>{
        if(!target.current){
            return
        }
        //console.log('fullscreenchange',e.target,'fullscreenElement',document.fullscreenElement)

        if(!fullScreen.current&&isDocumentInFullScreenMode()){
           console.log('进入全屏模式')
            change(true)
        }else if(fullScreen.current&&!isDocumentInFullScreenMode()){
            console.log('退出全屏模式')
            change(false)
        }
    })
    useEffect(()=>{
        document.addEventListener('fullscreenchange',handleChange)
        return ()=>{
            document.removeEventListener('fullscreenchange',handleChange)
        }
    },[])
    return [fullScreen.current,{enterFullScreen,exitFullScreen,toggleFullscreen}] as const
}
export default useFullScreen