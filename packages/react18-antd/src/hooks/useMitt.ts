import { useState } from 'react'
import Mitt,{type EventType} from 'src/utils/mitt'


const useMitt=<E  extends Record<EventType, unknown>>()=>{
    const [mitt]=useState(()=>Mitt<E>())
    return mitt
}

export default useMitt