import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Mitt,{type EventType,type Emitter,type Handler} from 'src/utils/mitt'

type GetArgs<T>=T extends Array<any>?T:[T]
export interface ProMitt<Events  extends Record<EventType, unknown>> extends Emitter<Events>{

}
export class ProMitt<Events  extends Record<EventType, unknown>>{
    static instance:ProMitt<any>=null
    static getInstance(){
        if(!this.instance){
            this.instance=new ProMitt()
        }
        return this.instance
    }
    constructor(){
        Object.assign(this,Mitt())
    }
    subscribe<K extends keyof Events>(type:K,handler:Handler<Events[K]>){
        const ref=useRef(handler)
        ref.current=handler
        useLayoutEffect(()=>{
            const onHandle=(e:Events[K])=>{    
                ref.current?.(e)
            }
            this.on(type,onHandle)
            return ()=>{
                this.off(type,onHandle)
            }
        },[])
    }
    dispose(){
        this.all.clear()
    }
}
const useMitt=<E  extends Record<EventType, unknown>>()=>{
    const [mitt]=useState(()=>new ProMitt<E>())
    useLayoutEffect(()=>{
        return ()=>{
            mitt.dispose()
        }
    },[])
    return mitt
}

export default useMitt