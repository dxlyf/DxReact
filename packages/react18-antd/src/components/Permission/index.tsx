import React, {createContext, useCallback, useContext, useLayoutEffect, useMemo, useState} from 'react'


type UserInfo={
    permissions: string[]
}
 type PermissionContextType = {
    loading:boolean
    userInfo:any
    setUserInfo:(userInfo:UserInfo)=>void
    fetchUserInfo:()=>Promise<UserInfo>
    hasPermission: (permission: string|string[]) => boolean;// 判断是否有所有权限
    hasAnyPermissions: (permissions: string|string[]) => boolean; // 判断是否有任意权限
}

 const PermissionContext = createContext<PermissionContextType>(null)

 type  CheckPermissionList=[permission:string|string[],pass:React.ReactNode,fail?:React.ReactNode]

 const renderValidElement=(element:React.ReactNode,key:string,props:any={})=>{

    if(React.isValidElement(element)){
        const extraProps={
            ...(element.props.key==null?{key:key}:{}),
            ...props
        }
        return React.cloneElement(element,extraProps)
    }else{
        return element
    }
 }
 const usePermission = () => {
    const context= useContext(PermissionContext)

    const single=useCallback((permission:string|string[],pass:React.ReactNode,fail:React.ReactNode=null)=>{
        if(context.hasAnyPermissions(permission)){
            return pass
        }
        return fail
    },[])
    const group=useCallback((checkList:CheckPermissionList[])=>{
        return <>
            {checkList.filter((item,i)=>{
                 if(context.hasAnyPermissions(item[0])){
                    return renderValidElement(item[1],i+'')
                 }else{
                    return renderValidElement(item[2],i+'')
                 }
            })}
        </>
    },[])
    const operactors=useMemo(()=>({
        has:context.hasAnyPermissions,
        single:single,
        group:group
    }),[context,group,single])
    return [operactors,context] as const
}


const PermissionPovider:React.FC<React.PropsWithChildren<{}>>=(props)=>{
    const {children}=props
    const [userInfo,setUserInfo]=useState<UserInfo>()
    const [loading,setLoading]=useState(false)

    // 获取当前用户的权限信息
    const fetchUserInfo=useCallback(async ()=>{
        try{
            setLoading(true)
        }catch(e){

        }finally{
            setLoading(false)
        }
        return 
    },[setUserInfo])
    useLayoutEffect(()=>{
        fetchUserInfo()
    },[])
    const hasPermission=useCallback((permissions:string|string[])=>{
        const userPermissions=userInfo?.permissions
        if(!userPermissions){
            return false
        }
        if(Array.isArray(permissions)){
            return permissions.every(code=>userPermissions.includes(code))
        }else{
            return userPermissions.includes(permissions)
        }
    },[userInfo])
    const hasAnyPermissions=useCallback((permissions:string|string[])=>{
       const userPermissions=userInfo?.permissions
        if(!userPermissions){
            return false
        }
        if(Array.isArray(permissions)){
            return permissions.some(code=>userPermissions.includes(code))
        }else{
            return userPermissions.includes(permissions)
        }
    },[userInfo])
    const value=useMemo(()=>{
        return {
            loading,
            userInfo,
            setUserInfo,
            fetchUserInfo,
            hasPermission,
            hasAnyPermissions
        }
    },[loading,userInfo,fetchUserInfo,setUserInfo,hasPermission,hasAnyPermissions])
    return <PermissionContext.Provider value={value}>
        {children}
    </PermissionContext.Provider>
}

export {
    PermissionContext,
    usePermission,
    PermissionPovider
}