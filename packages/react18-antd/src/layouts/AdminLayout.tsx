import {ProLayout,getMenuData} from '@ant-design/pro-components'
import { useMemo } from 'react'
import {routes} from 'src/routes/routes'
import {NavLink, useOutlet,Outlet} from 'react-router-dom'

const C=()=>{
     const outlet=useOutlet()
     return outlet
}
export const AdminLayout=()=>{
    const outlet=useOutlet()
    const menuData=useMemo(()=>getMenuData(routes),[routes])
    return <ProLayout title='Demo'
     menuDataRender={()=>menuData.menuData}
     menuItemRender={(item,defaultDom)=>{
            return <NavLink to={item.path!}>
                {defaultDom}
            </NavLink>
     }}
     >
       {outlet}
    </ProLayout>
} 