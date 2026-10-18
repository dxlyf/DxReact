
import type { FormSchema, ArrayFieldSchema, ObjectFieldSchema, AtomFieldSchema, AllFieldSchema, ObjectFieldState, ObjectVisibleField, FieldPath, FieldSchema } from '../types'
import { ref, reactive, inject, provide, computed, watch } from 'vue'

const ROOT_KEY = '__root__'
const OBJ_STATE_KEY = Symbol.for('OBJ_STATE_KEY')
export const SCHEMA_FORM_PROVIDE = Symbol.for('SCHEMA_FORM_PROVIDE')


const cloneValue=(value:any)=>{
    if(value===null||typeof value!=='object'){
        return value
    }
    return JSON.parse(JSON.stringify(value))
}
const isUndefined = (val: any) => val === undefined
const isNullOrUndefined = (val: any) => isUndefined(val) || val === null
const isObject = (val: any) => {
    return typeof val === 'object' && val !== null
}
const setDeepValue = (obj: any, path: FieldPath, value: any) => {
    if (path.length <= 0) {
        return
    }
    let currentObj = obj
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]
        if (!isObject(currentObj[key])) {
            // 中间容器缺失时新建，并挂回父级（否则写入会落到游离对象上）
            currentObj[key] = typeof path[i + 1] === 'number' ? [] : {}
        }
        currentObj = currentObj[key]
    }
    currentObj[path[path.length - 1]] = value
}
const getDeepValue = (obj: any, path: FieldPath, defaultValue?: any) => {
    if (path.length <= 0) {
        return defaultValue
    }
    let currentObj = obj
    for (let i = 0, len = path.length; i < len; i++) {
        if (!isObject(currentObj)) {
            return defaultValue
        }
        currentObj = currentObj[path[i]]
    }
    return isNullOrUndefined(currentObj) ? defaultValue : currentObj
}


export const normalizeSchema = (schema: AllFieldSchema): AllFieldSchema => {
    if (schema.type === 'array') {
        const {schemas=[],...restSchema}=schema
        return {
            valueType:'array<object>',
            defaultValue:[],
            allowAdded:true,
            allowAddedField:true,
            sortable:false,
            visible:true,
            schemas:schemas.map(item=>normalizeSchema(item)),
            ...restSchema
        } as ArrayFieldSchema
    } else if (schema.type === 'object') {
        const {schemas=[],...restSchema}=schema
        return {
            allowAddedField:true,
            visible:true,
            schemas:schemas.map(item=>normalizeSchema(item)),
            ...restSchema
        } as ObjectFieldSchema
    } else {
        return {
            visible:true,
            defaultValue:'',
            props:{},
            wrapper:'field',
            ...schema
        } as AtomFieldSchema
    }
}

export const useSchemaFormContext = () => {
    return inject(SCHEMA_FORM_PROVIDE) as ReturnType<typeof useSchemaForm>
}
const debounce=(fn:any,delay:number)=>{
    let timer:any
    return (...args:any[])=>{
        if(timer){
            clearTimeout(timer)
        }
        timer=setTimeout(()=>{
            fn.apply(this,args)
        },delay)
    }
}
export const useSchemaForm = (value: any,options:{onChange:(val:any)=>void}) => {
    
    const rootData = reactive({
        [ROOT_KEY]:JSON.parse(JSON.stringify(value))
    })
    
    const notifyChange=debounce(()=>{
          options.onChange(toPlainValue(rootData[ROOT_KEY]))
    },500)
    const init=(value:any)=>{
          rootData[ROOT_KEY]=JSON.parse(JSON.stringify(value))

    }
    const getPathValue = (path: FieldPath, defaultValue?: any) => {
        return getDeepValue(rootData, [ROOT_KEY,...path], cloneValue(defaultValue))
    }
    const setPathValue = (path: FieldPath, value: any) => {
        setDeepValue(rootData, [ROOT_KEY,...path], value)
        notifyChange()
    }
    const buildExtraFieldSchema=(key:string)=>{
        return {
            type:'atom',
            defaultValue:'',
            component:'t-input',
            wrapper:'field',
            key:key,
            label:key
        } as AtomFieldSchema
    }
    const getObjectState = (obj: any, schemas: AllFieldSchema[]): ObjectFieldState => {
        let state = obj[OBJ_STATE_KEY] as ObjectFieldState
        if (!state) {

            const use=new Set()
            const builtinFields=schemas.map(item => {
                  use.add(item.key)
                  return {
                        key: item.key,
                        visible: item.visible,
                        builtin: true,
                        schema: item
                    } as ObjectVisibleField
            })
            const extraFields=Object.keys(obj).filter(key=>!use.has(key)).map(key=>{
                return {
                    key,
                    visible: true,
                    builtin: false,
                    schema:buildExtraFieldSchema(key)
                }
            })

            state = reactive({
                fields: [...builtinFields,...extraFields]
            })
            obj[OBJ_STATE_KEY] = state
        }
        return state
    }
    const removeItem=(path:FieldPath,index:number)=>{
        let list=getPathValue(path)
        if(!Array.isArray(list)){
            return
        }
        if(index<0||index>=list.length){
            return
        }
        list.splice(index,1) 
        setPathValue(path,list)
        notifyChange()
    }
    const moveItem=(path:FieldPath,from:number,to:number)=>{
        let list=getPathValue(path)
        if(!Array.isArray(list)){
            return 
        }
        if(from<0||from>=list.length){
            return 
        }
        if(to<0||to>=list.length){
            return 
        }
        const item=list.splice(from,1)
        list.splice(to,0,...item)
     //   setPathValue(path,list)
        notifyChange()
       
    }
    const addItem=(path:FieldPath,schema:ArrayFieldSchema)=>{
          let list=getPathValue(path)
          let newObjOrValue:any
          if(schema.valueType==='array<string>'){
             newObjOrValue=schema.schemas[0].defaultValue
          }else{
            newObjOrValue={}
            schema.schemas.forEach(item=>{
                newObjOrValue[item.key]=cloneValue(item.defaultValue)
            })
            getObjectState(newObjOrValue,schema.schemas)
          }
          if(!Array.isArray(list)){
             list=[newObjOrValue]
             setPathValue(path,list)
          }else{
             list.push(newObjOrValue)
          }
          notifyChange()
          return list.length-1
    }
    const removeField=(obj: any, key: string)=>{
        if(!obj){
            return
        }
        let state = obj[OBJ_STATE_KEY] as ObjectFieldState
        if (state) {
            const index=state.fields.findIndex(item=>item.key===key)
            if(index>-1){
                state.fields.splice(index,1)
                notifyChange()
            }
          
        }
    }
    const setFieldVisible=(obj: any, key: string, visible: boolean)=>{
        if(!obj){
            return
        }
        let state = obj[OBJ_STATE_KEY] as ObjectFieldState
        if (state) {
            const field=state.fields.find(item=>item.key===key)
            if(field){
                field.visible=visible
                if(!Object.hasOwn(obj,key)){
                    obj[key]=cloneValue(field.schema.defaultValue)
                }
                notifyChange()
            }
        }
    }
    const addExteralField = (obj: any, key: string) => {
        if(!obj){
            return
        }
        let state = obj[OBJ_STATE_KEY] as ObjectFieldState
        if (state) {
            state.fields.push({
                key,
                visible: true,
                builtin: false,
                schema:buildExtraFieldSchema(key)
            } as ObjectVisibleField)
            obj[key]=''
            notifyChange()
        }
    }
    const toPlainValue = (value: any): any => {
        if (Array.isArray(value)) {
            return value.map(item => toPlainValue(item))
        }
        else if (value && typeof value === 'object') {
            const state = value[OBJ_STATE_KEY] as ObjectFieldState
            if (state) {
                return state.fields.reduce((acc, cur) => {
                    if (cur.visible) {
                        acc[cur.key] = toPlainValue(value[cur.key])
                    }
                    return acc
                }, {} as any)
            }
            return value;
        } else {
            return value
        }
    }

    const instance = {
        init,
        addItem,
        moveItem,
        removeItem,
        removeField,
        setFieldVisible,
        addExteralField,
        getObjectState,
        getPathValue,
        setPathValue
    } as const
    return instance
}