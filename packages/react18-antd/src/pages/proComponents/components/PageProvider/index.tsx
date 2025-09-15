import {createContext,useContext} from 'react'
const PageContext=createContext({})
export const usePage=()=>{
    const page=useContext(PageContext)
    return page
}
export const PageProvider=(page)=>{
    return <PageContext.Provider value={page}></PageContext.Provider>
}