import {create} from 'zustand'


export const useAppStore=create((set,get,store)=>({
    isCollapse:false,
    setIsCollapse:(isCollapse)=>set({isCollapse}),
}))