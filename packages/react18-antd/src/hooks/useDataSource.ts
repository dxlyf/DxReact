import {useSyncExternalStore,useReducer} from 'react'
import type {Reducer} from 'react'

type State={
    loading:boolean
    data:any[]
}
type Action={
    type:string
    payload:any, 
}

const reduceHandler={
    
}
function reducer(prevState:State,action:Action){
    if(reduceHandler[action.type]){

    }
    return prevState
}
function initailReducerState():State{
    return {
        loading:false,
        data:[]
    }
}   
const useDataSource=()=>{

    const [state,dispatch]=useReducer<Reducer<State,Action>,any>(reducer,null,initailReducerState)
}


class ArrayDataSource<D>{
    data:D[]=[]
    loading:boolean=false
    callbacks:{
        onChange?:()=>void
    }={}
}