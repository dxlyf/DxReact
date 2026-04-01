import {getCurrentInstance,ref,provide, computed,inject, shallowRef} from 'vue'
import type {Ref} from 'vue'

export type CollapseItemProps={
    value:string
    header:string
    contentClass?:string
}
export type CollapseProps={
    activeKeys?:string[]
    modelActiveKeys?:string[]
}
const COLLAPSE_ITEM_KEY='COLAPSE_ITEM'
const PROVIDE_KEY='COLAPSE'

export type ProvideType={
    activeKeys:Ref<string[]>
    setActiveKeys:(keys:string[])=>void
}
type UseControllerValueOptions={
    defaultValue?:any
    defaultField?:string
    valueField?:string
    modelField?:string
    trigger?:string
    controlledType?:'in'|'value'
} 
const  useControllerValue=(options:UseControllerValueOptions={})=>{
    const {controlledType='value',defaultValue:defaultValue,defaultField='defaultValue',valueField='value',modelField='modelValue',trigger='change'}=options
    const current=getCurrentInstance()
    const props=current.props as any
    const emit=current.emit
    const propValue=computed(()=>props[valueField])
    const modelValue=computed(()=>props[modelField])
    const isValueControlled=computed<boolean>(()=>{
        if(controlledType==='in'){
            return Object.hasOwn(props,valueField)
        }
        return props[valueField]!==undefined
    })
    const isModelControlled=computed<boolean>(()=>{
        if(controlledType==='in'){
            return Object.hasOwn(props,modelField)
        }
        return props[modelField]!==undefined
    })
    const innerValue=shallowRef(props[defaultField]||defaultValue)
    const value=computed(()=>{
        const _isModelControlled=isModelControlled.value
        const _isValueControlled=isValueControlled.value
        const _modelValue=modelValue.value
        const _propValue=propValue.value
        const _value=innerValue.value
        if(_isModelControlled){
            return _modelValue
        }
        if(_isValueControlled){
            return _propValue
        }
        return _value
    })
    const setValue=(val:any)=>{
        if(isModelControlled.value){
            emit(`update:${modelField}`,val)
            emit(trigger,val)
        }else if(isValueControlled.value){
            emit(trigger,val)
        }else{
            innerValue.value=val
            emit(trigger,val)
        }
    }

    return [value,setValue] as const
}
export const useCollapse=(props:CollapseProps)=>{
    const current=getCurrentInstance()
    const emit=current.emit
    const [activeKeys,setActiveKeys]=useControllerValue({
        defaultValue:[],
        valueField:'activeKeys',
        modelField:'modelActiveKeys',
        trigger:'change',
    })
    provide<ProvideType>(PROVIDE_KEY,{
        activeKeys:activeKeys,
        setActiveKeys:setActiveKeys
    })
    return {
        activeKeys
    }
}
export const useCollapseItem=(props:CollapseItemProps)=>{
    const current=getCurrentInstance()
    const {activeKeys,setActiveKeys}=inject<ProvideType>(PROVIDE_KEY)
    const isActive=computed<boolean>(()=>activeKeys.value.includes(props.value))
    const toggleActive=()=>{
        if(isActive.value){
            setActiveKeys(activeKeys.value.filter(k=>k!==props.value))
        }else{
            setActiveKeys([...activeKeys.value,props.value])
        }
    }
    return {
        isActive,
        toggleActive
    }
}