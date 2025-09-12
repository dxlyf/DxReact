import React from 'react'
import { Suspense } from 'react'
import {Navigate} from 'react-router-dom'
import type {RouteObject} from 'react-router-dom'
import { AdminLayout } from 'src/layouts/AdminLayout'
import {BasicLayout} from 'src/layouts/BasicLayout'
import type {MenuDataItem} from '@ant-design/pro-components'

type RouteObjectAndMenu=Omit<RouteObject,'children'>&Pick<MenuDataItem,'name'|'flatMenu'|'key'>&{
  children?:RouteObjectAndMenu[]
}
const routes:RouteObjectAndMenu[]=[
    {
        path:'',
        Component:AdminLayout,
        flatMenu:true,
        children:[
            {
                index:true,
                element:<Navigate to={'/home'}></Navigate>
            },
            {
                path:'home',
                name:'首页',
                Component:React.lazy(()=>import('src/pages/home'))
            },
               {
                path:'proComponents',
                name:'ProComponents',
                children:[
                    {
                        path:'proTable',
                        name:'ProTable',
                         Component:React.lazy(()=>import('src/pages/proComponents/proTable'))
                    }
                ]
            }
        ]
    }
]

export {
    routes
}