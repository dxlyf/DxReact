import fastDeepEqual from 'fast-deep-equal'
import { useMemo, useRef } from 'react'
const useDeepDeps=(...deps:any[])=>{
    const depId=useRef('')
    depId.current=useMemo(()=>{
        return JSON.stringify(deps)
    },deps)
    return [depId]
}
export default useDeepDeps