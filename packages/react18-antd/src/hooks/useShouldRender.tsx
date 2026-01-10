import type React from 'react'
import useInitialized from './useInitialized'
import { useMemo, type FC, type ReactElement } from 'react'
interface Props {
  active: boolean
  forceRender?: boolean
  destroyOnClose?: boolean
  children: ReactElement|((props:{style:React.CSSProperties})=>ReactElement)

}
/**
 * 
 * @param props 
 * @returns 
 * @example
 * <ShouldRender active={active} destroyOnClose forceRender>
 *  {({style})=><div style={style}></div>}
 * </ShouldRender>
 *  * <ShouldRender active={active} destroyOnClose forceRender>
 *  <div style={{display:active?'block':'none}}></div>
 * </ShouldRender>
 */
export const ShouldRender: FC<Props> = props => {
  const shouldRender = useShouldRender(
    props.active,
    props.forceRender,
    props.destroyOnClose
  )
  const childrenProps=useMemo<{style:React.CSSProperties}>(()=>{
    if(props.active){
        return {
            style:{}
        }
    }
    return {
     style:{
         display:'none'  
     }
    } 
  },[props.active])
  return shouldRender ? typeof props.children==='function'?props.children(childrenProps):props.children : null
}

export function useShouldRender(
  active: boolean,
  forceRender?: boolean,
  destroyOnClose?: boolean
) {
  const initialized = useInitialized(active)
  if (forceRender) return true
  if (active) return true
  if (!initialized) return false
  return !destroyOnClose
}
