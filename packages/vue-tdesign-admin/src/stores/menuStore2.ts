import { defineStore } from 'pinia'
import {ref,watch,onMounted,onUnmounted,computed,shallowRef,reactive} from 'vue'
import {useRoute} from 'vue-router'
export type MenuItem = {
  isLeaf?: boolean
  menuKey: string
  path?: string
  name: string
  icon?: string
  webIcon?: string
  relativePath?: string[]
  parentKeys?: string[]
  children?: MenuItem[]
} 
export type UserInfo={
    username:string
    avatar:string
    isSuperAdmin:boolean
}
export type TenantOption={
    value?:string
    label?:string
    group?:string
    children?:TenantOption[]
}
export type AppError={
    code:number
    message:string
}
// 菜单数据遍历
const walkMenu=(list:MenuItem[],callbck:(item:MenuItem)=>void)=>{
    for(const item of list){
        callbck(item)
        if(item.children&&Array.isArray(item.children)){
            walkMenu(item.children,callbck)
        }
    }
}
// 菜单数据映射
const walkMenuMap=(list:MenuItem[],callbck:(item:MenuItem,parents:MenuItem[]|null)=>MenuItem,parents:MenuItem[]|null=null)=>{
    const result:MenuItem[]=[]
    for(const item of list){
        const newItem=callbck(item,parents)
        result.push(newItem)
        if(newItem.children&&Array.isArray(newItem.children)){
            newItem.children=walkMenuMap(newItem.children,callbck,parents?parents.concat(newItem):[newItem])
        }
    }
    return result
}
// 菜单数据搜索
const searchMenuData=(list:MenuItem[],keyWord:string)=>{
    const result:MenuItem[]=[]
     for(const item of list){
        
        if(item.name.includes(keyWord)){
          const newItem={...item}
           if(newItem.children&&Array.isArray(newItem.children)){
              newItem.children=searchMenuData(newItem.children,keyWord)
           }
           result.push(newItem)
        }
        else if(item.children&&Array.isArray(item.children)){
             const newItem={...item}
             const children=searchMenuData(item.children,keyWord)
             if(children.length){
                newItem.children=children
                result.push(newItem)
             }
        }
    }
    return result
}
export const SYSTEM_TENANT_APPSLUG='system_tenant_appslug'
export const useAppStore=defineStore('appstore2',()=>{

    const route=useRoute()
    const loading=shallowRef(false)
    const error=shallowRef<AppError|null>({code:0,message:''})
    const userInfo=shallowRef<UserInfo>({username:'',avatar:'',isSuperAdmin:false}) // 用户信息
    const tenantData=shallowRef<any>([]) // 租户数据
    const currentAppSlug=shallowRef(sessionStorage.getItem(SYSTEM_TENANT_APPSLUG) || '')  // 当前租户
    const menuData=ref<MenuItem[]>([]) // 菜单数据
    const searchMenuKeyWord=shallowRef('') // 搜索菜单关键词
    const activeMenuKey=shallowRef('') // 当前选中的菜单键值
    const localExpandedMenuKeys=ref<string[]>([]) // 当前展开的菜单键值
    const menuCollapsed=shallowRef(false) // 菜单是否折叠状态
    // 扁平化菜单数据
    const flatMenuData=computed(()=>{
        const result:MenuItem[]=[]
        walkMenu(menuData.value,item=>result.push(item))
        return result
    })
    // 最终菜单数据
    const finalMenuData=computed(()=>{
        if(searchMenuKeyWord.value){
            return searchMenuData(menuData.value,searchMenuKeyWord.value)
        }
        return menuData.value
    })
    // 展开的菜单键值
    const expandedKeys=computed(()=>{
        if(searchMenuKeyWord.value){
            const keys:string[]=[]
             walkMenu(finalMenuData.value,item=>{
                if(!item.isLeaf){
                   keys.push(item.menuKey)
                }
             })
             return keys
        }
        return localExpandedMenuKeys.value
    })
    const fetchUserInfo=async ()=>{
        // const data=await fetch('/api/user/info')
        // const userInfo=await data.json()
       // currentTenant.value=userInfo.tenantId
       userInfo.value.isSuperAdmin=true
       userInfo.value.username='admin'
    }
    const fetchTenantData=async ()=>{
        const data:any[]=[{
            value:'aa',
            label:'租户1'
        },{
            value:'bb',
            label:'租户2'
        }]
        let tenantList:TenantOption[]=data

        if(userInfo.value.isSuperAdmin){
            tenantList=[{
                value:'superadmin',
                label:'超级管理'
            },{
                group:'租户',
                children:data
            }]
        }
        let currentItem:TenantOption|null=null
        tenantList.some(d=>{
            if(d.children){
               const found=d.children?.find(c=>c.value===currentAppSlug.value)
               if(found){
                   currentItem=found
                   return true
               }
            }
            else if(d.value===currentAppSlug.value){
                currentItem=d;
                return true
            }
        })
        currentAppSlug.value=currentItem?currentItem.value:tenantList[0].value
        tenantData.value=tenantList
        sessionStorage.setItem(SYSTEM_TENANT_APPSLUG, currentAppSlug.value)
    }
    const fetchMenuData=async ()=>{
        const data=Array.from({length:30},(v,index)=>{
            return {
                menuKey:`app-do-${index}`,
                name:`下载中心${index}`,
                icon:'app',
                children:[{
                    menuKey:`app-${index}`,
                    name:`应用${index}`,
                    icon:'app',
                    path:`/example/tdesign/download/apps`
                }]
            }
        })
         menuData.value=walkMenuMap(data,(item,parents)=>{
             return {
                ...item,
                isLeaf:item.children&&Array.isArray(item.children)?false:true,
                parentKeys:parents?parents.map(p=>p.menuKey):[]
             }
         })
    }
    // 菜单展开切换
    const onMenuExpandChange=(keys:string[])=>{
        localExpandedMenuKeys.value=keys
    }
    // 菜单切换
    const onMenuChange=(key:string)=>{
        const item=flatMenuData.value.find(item=>item.menuKey===key)
        if(item){
            localExpandedMenuKeys.value=Array.from(new Set(localExpandedMenuKeys.value.concat(item.parentKeys||[])))
        }
        activeMenuKey.value=key
    }
    // 租户切换
    const onAppSlugChange=(slug:string)=>{
        currentAppSlug.value=slug
        sessionStorage.setItem(SYSTEM_TENANT_APPSLUG,slug)
        window.location.reload()
    }

    const syncActiveMenu=()=>{
        const path=route.path
        const item=flatMenuData.value.find(item=>item.path===path)
        if(item){
            activeMenuKey.value=item.menuKey
            localExpandedMenuKeys.value=item.parentKeys||[]
        }
        else{
            activeMenuKey.value=''
        }
    }
    const initAppData=async ()=>{
        loading.value=true
        try{
        await new Promise(resolve=>setTimeout(resolve,3000))
        await fetchUserInfo()
        await fetchTenantData()
        await fetchMenuData()
        syncActiveMenu()
        }catch(err){
            error.value=err as AppError
        }
        finally{
            loading.value=false
        }
    }
    watch(()=>activeMenuKey.value,()=>{
        if(activeMenuKey.value){
            onMenuChange(activeMenuKey.value)
        }
    })
    initAppData()
    return {
        loading,
        error,
        userInfo,
        finalMenuData,
        flatMenuData,
        menuData,
        expandedKeys,
        activeMenuKey,
        searchMenuKeyWord,
        menuCollapsed,
        tenantData,
        currentAppSlug,
        onMenuExpandChange,
        onMenuChange,
        onAppSlugChange

    }
})