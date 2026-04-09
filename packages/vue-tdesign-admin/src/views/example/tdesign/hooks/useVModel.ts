import { computed, getCurrentInstance, shallowRef } from "vue"

type UseControllerValueOptions={
    defaultValue?:any
    defaultField?:string
    valueField?:string
    modelField?:string
    trigger?:string
    controlledType?:'in'|'value'
} 
const isNullOrUndefined=(val:any)=>{
    return val===null||val===undefined
}
export const  useControllerValue=(options:UseControllerValueOptions={})=>{
    const {controlledType='in',defaultValue:defaultValue,defaultField='defaultValue',valueField='value',modelField='modelValue',trigger='change'}=options
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
    const getInitialValue=()=>{
        if(!isNullOrUndefined(propValue.value)){
            return propValue.value
        }
        if(!props[defaultField]){
            return props[defaultField]
        }
        return defaultValue
    }
    const innerValue=shallowRef(getInitialValue())
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