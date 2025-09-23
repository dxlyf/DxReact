import {useRef,useCallback,useMemo} from 'react'
type Options={
    defaultValue?:any
    trigger?:string

    onChange?(value:any):void

}
const useControllableValue=(props:any,options:Options)=>{
    const latestOptions=
}