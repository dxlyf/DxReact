import React,{createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState} from 'react'
import { useMemoizedFn } from '../../hooks'
import {btnStatusEnum} from '../BaseActionBtn'
import uaa from '$UI/wxsys/comps/user/js/uaa'

 const emptyArray=[],emptyObject={}
 const ProPageContext=createContext(null)
 // 跨组件访问page
 const usePage=()=>{
    return useContext(ProPageContext).page
 }
 /**
  * @typedef {object} UseRequestOptions 
  * @member {object} requestConfig
  * @member {(ret:any)=>any} onTransform
  * @member {(ret)=>void} onSuccess
  * @member {(e)=>void} onFail
  */


 /**
  * 通用请求钩子
  * @param {UseRequestOptions} options 
  * @returns 
  */
 const useRequest=(options)=>{
    const {manualRequest=false,requestConfig,deps=emptyArray,params:propParams=emptyObject,defaultValue}=options
    const latestRef=useRef({lastParams:{},requestCount:0,fetchId:0})
    const page=usePage()
    const [loading,setLoading]=useState(false)
    const [data,setData]=useState(defaultValue)
    const request=useMemoizedFn(async (params={})=>{
         const {service,onTransform,onSuccess,onError,onComplete}=options
         const fetchId=++latestRef.current.fetchId
        try{
            setLoading(true)
            let ret=requestConfig?await page.request({
                ...requestConfig,
                data:params
            }):await service(params, latestRef.current.lastParams);
            latestRef.current.lastParams=params
            if(fetchId!==latestRef.current.fetchId){
                 return Promise.reject(new Error('cancelled'))
            }
            const data=onTransform?onTransform(ret,params):ret
            setData(data)
            onSuccess?.(data)
            return data
        }catch(e){
            console.error(e)
            onError?.(e)
        }finally{
            latestRef.current.requestCount++
            setLoading(false)
            onComplete&&onComplete()
        }
    })
    const reload=useCallback((params={})=>{
       return request({
        ...latestRef.current.lastParams,
        ...params
       })
    },[])
    useLayoutEffect(()=>{
        if(!manualRequest&&deps.length<=0){
            request(propParams)
        }
    },[manualRequest])
    useLayoutEffect(()=>{
        if(deps.length>0){
            request(propParams)
        }
    },deps)
    return {
        requestCount:latestRef.current.requestCount,
        lastParams:latestRef.current.lastParams,
        loading,
        request,
        reload,
        data,
        setData
    }
}
const useUserInfo=(options={})=>{
    const page=usePage()
    const {data,request,loading}=useRequest({
        service:async ()=>{
            let curUserInfo=uaa.getCurrentUser()
            if(!curUserInfo){
                const res=await page.request({
                    url: page.getServiceUrl(`/uaa/userinfo`),
                    method: 'get'
                })
                curUserInfo=res.data.data||{}
            }else{
                curUserInfo.userId=curUserInfo.userId??curUserInfo.id
            }
            const { name, username, userId } =curUserInfo
            return {
                name:name,
                userName: `${name}（${username}）`,
                userCode:username,
                userId:userId
            }
        },
        ...options
    })
    return {userInfo:data,request,loading}
}
/**
 * 
 * @param {string|string[]} typeCode 字典类型
 */
const useDictionaryOptions=(typeCode,config={})=>{
    const page=usePage()
    // 字典列有
    const {data,loading,request}=useRequest({
        requestConfig:{
           url: page.getServiceUrl(`/main/dict/batchDetailByCodes?configCodes=${Array.isArray(typeCode)?typeCode.join(','):typeCode}`),
           method:'get'
        },
        onTransform:(res)=>res.data.data,
        ...config
   })
   // 
   const dicMap=useMemo(()=>{
        if(data&&data.length){
              return data.reduce((map,record)=>{
                map.set(record.configCode,record)
                return map;
              },new Map())
        }
        return new Map()
   },[data])
   const getEnumOptions=useMemoizedFn((code)=>{
        const record=dicMap.get(code)
        if(record&&Array.isArray(record.dictEnums)){
            return record.dictEnums.map(d=>({label:d.description,value:d.code}))
        }
        return []
   })
   const options=useMemo(()=>{
        if(data&&data.length>0){
            return getEnumOptions(data[0].configCode) 
        }
        return []
   },[data])

   return {
        request,
        loading,
        getEnumOptions,
        dicMap,
        options
   }
}
 // 页面上下文跨组件访问根程序
const ProPageProvider=({page,pageCode,children})=>{
    const [permissions,setPermissions]=useState([])
    const value=useMemo(()=>({
        page:page,
        pageCode:pageCode,
        permissions,
    }),[page,permissions,pageCode])
    useLayoutEffect(()=>{
        //  安环一体化,不做权限控制
         if(pageCode){
            page.request({
                url:page.getServiceUrl('/main/permissions/queryUserPermission'),
                method:'POST',
                data:{}
            }).then(res=>{
                const data=res.data.data;
                if(Array.isArray(data)){
                   setPermissions(data.map(d=>d.permissionCode))
                }
            })
         }
    },[])
    return <ProPageContext.Provider value={value}>{children}</ProPageContext.Provider>
}
// 复制时详情信息里面清除流程相关信息
const clearFlowInfoOnDefail=(detail,btnStatus=btnStatusEnum.COPY)=>{
    if(detail&&btnStatus===btnStatusEnum.COPY){
        detail.flowId=undefined
        detail.issuedId=undefined
        detail.modifier=undefined
        detail.modifierName=undefined
        detail.modifyTime=undefined
        detail.createTime=undefined
        detail.creator=undefined
        detail.creatorName=undefined

    }
}


// 页面按钮权限码
const PERMISSION_PAGE_BUTTONS={
    // 工傷信息管理
    GSXXGL:{
        EDIT:'GSXXGL_EDIT',// 編輯
        DETAIL:'GSXXGL_DETAIL',// 詳情
        BJLGS:'GSXXGL_BJLGS', // 不計入工傷
        SYNC:'GSXXGL_SYNC',// 同步數據
    },
    // 工傷借糧管理
    GSJLGL:{
        EDIT:'GSJLGL_EDIT',// 編輯
        DETAIL:'GSJLGL_DETAIL',// 詳情
        DEL:'GSJLGL_DEL',// 删除
        SUBMIT:'GSJLGL_SUBMIT',//提交
        APPROVE:'GSJLGL_APPROVE',// 審核 
    },
    // 違例檢控管理
    WLJKXXGL:{
        EDIT:'WLJKXXGL_EDIT',// 編輯
        DETAIL:'WLJKXXGL_DETAIL',// 詳情
        DEL:'WLJKXXGL_DEL',// 删除
    },
    // 地盘出勤人数统计
    DPCQRSTJ:{
        EDIT:'DPCQRSTJ_EDIT',// 編輯
        DETAIL:'DPCQRSTJ_DETAIL',// 詳情
        DEL:'DPCQRSTJL_DEL',// 删除
    },
    // 地盘月度开工人数管理
    DPYDKGRWGL:{
            EDIT:'DPYDKGRWGL_EDIT',// 編輯
            DETAIL:'DPYDKGRWGL_DETAIL',// 詳情
            DEL:'DPYDKGRWGL_DEL',// 删除
    },
    // 分判商工人工傷借款申請表
    FPSGRGSJKSQB:{
        ADD:'FPSGRGSJKSQB_ADD', // 新增
        DETAIL:'FPSGRGSJKSQB_DETAIL', // 详情
        EDIT:'FPSGRGSJKSQB_EDIT', // 编辑
        DEL:'FPSGRGSJKSQB_DEL',// 删除
        SUBMIT:'FPSGRGSJKSQB_SUBMIT',// 提交
        COPY:'FPSGRGSJKSQB_COPY',// 复制
    },
    // 分判商勞工補償通知書
    FPSLGBCTZS:{
        ADD:'FPSLGBCTZS_ADD', // 新增
        DETAIL:'FPSLGBCTZS_DETAIL', // 详情
        EDIT:'FPSLGBCTZS_EDIT', // 编辑
        DEL:'FPSLGBCTZS_DEL',// 删除
        SUBMIT:'FPSLGBCTZS_SUBMIT',// 提交
        COPY:'FPSLGBCTZS_COPY',// 复制
    },
    // 工傷補償通知書(醫療費)
    GSBCTZSYLF:{
        ADD:'GSBCTZSYLF_ADD', // 新增
        DETAIL:'GSBCTZSYLF_DETAIL', // 详情
        EDIT:'GSBCTZSYLF_EDIT', // 编辑
        DEL:'GSBCTZSYLF_DEL',// 删除
        SUBMIT:'GSBCTZSYLF_SUBMIT',// 提交
        COPY:'GSBCTZSYLF_COPY',// 复制
    },
    // 工傷補償通知書(義肢費)
    GSBCTZSYZF:{
        ADD:'GSBCTZSYZF_ADD', // 新增
        DETAIL:'GSBCTZSYZF_DETAIL', // 详情
        EDIT:'GSBCTZSYZF_EDIT', // 编辑
        DEL:'GSBCTZSYZF_DEL',// 删除
        SUBMIT:'GSBCTZSYZF_SUBMIT',// 提交
        COPY:'GSBCTZSYZF_COPY',// 复制
    },
    // 工傷補償通知書(尾數)
    GSBCTZSWS:{
        ADD:'GSBCTZSWS_ADD', // 新增
        DETAIL:'GSBCTZSWS_DETAIL', // 详情
        EDIT:'GSBCTZSWS_EDIT', // 编辑
        DEL:'GSBCTZSWS_DEL',// 删除
        SUBMIT:'GSBCTZSWS_SUBMIT',// 提交
        COPY:'GSBCTZSWS_COPY',// 复制
    }
}
const PERMISSION_PAGE=Object.keys(PERMISSION_PAGE_BUTTONS).reduce((res,key)=>{
    res[key]=key
    return res
},{})
const defaultEmptyProPageContext={
    permissions:[]
}
/**
 * 权限控制hook，用于检查用户是否拥有特定权限
 */
 function usePermission(propPageCode) {

    // 用户拥有的权限列表
    const {permissions,pageCode}=useContext(ProPageContext)||defaultEmptyProPageContext
    const pagePermissionCode=propPageCode?propPageCode:pageCode
    // 如果pagePermissionInfo为null,就不判断权限
    const pagePermissionInfo=useMemo(()=>{
        if(pagePermissionCode){
            return PERMISSION_PAGE_BUTTONS[pagePermissionCode]
        }else{
            return null
        }
    },[pagePermissionCode])
    const transformCodes=useCallback((permissionCodes)=>{
        if(!Array.isArray(permissionCodes)){
            permissionCodes=[permissionCodes]
        }
        permissionCodes=permissionCodes.filter(Boolean)
        if(pagePermissionInfo){
            return permissionCodes.map(code=>pagePermissionInfo[code.toUpperCase()]||code)
        }
        return permissionCodes
    },[pagePermissionInfo])
    // 检查是否拥有多个权限中的至少一个
    const hasAnyPermissions = useCallback((permissionCodes) => {
        if(!pagePermissionInfo){
            return true
       }
        permissionCodes=transformCodes(permissionCodes)
        return permissionCodes.some(code => permissions.includes(code));
    }, [permissions,transformCodes]);
    // 检查是否拥有所有指定权限
    const hasAllPermissions = useMemo((permissionCodes) => {
        if(!pagePermissionInfo){
            return true
        }
        permissionCodes=transformCodes(permissionCodes)
        return permissionCodes.every(code => permissions.includes(code));
    }, [permissions,transformCodes]);

    // 返回hook结果
    return {
        hasAnyPermissions,
        hasAllPermissions,
        permissions,
        pagePermissionInfo,
        pagePermissionCode:pagePermissionCode
    };
}
/**
 * 权限检查组件，根据权限条件渲染子组件
 */
 function PermissionGate({ code,pageCode, children, fallback = null, mode = 'any' // 'all' 需要所有权限，'any' 需要任一权限
 }) {
   
    const { hasAllPermissions, hasAnyPermissions } = usePermission(pageCode);
 
    const hasAccess = mode === 'all'
        ? hasAllPermissions(code)
        : hasAnyPermissions(code);
    return hasAccess ? <>{children}</> : fallback;
}


export {
    PERMISSION_PAGE,
    PERMISSION_PAGE_BUTTONS,
    ProPageContext,
    useDictionaryOptions,
    useRequest,
    usePage,
    usePermission,
    useUserInfo,
    PermissionGate,
    ProPageProvider,
    clearFlowInfoOnDefail
}