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
                    },
                       {
                        path:'list',
                        name:'列表',
                         Component:React.lazy(()=>import('src/pages/proComponents/list'))
                    },   {
                        path:'edit',
                        name:'常用编辑页',
                        Component:React.lazy(()=>import('src/pages/proComponents/edit'))
                    },   {
                        path:'huizong',
                        name:'汇总',
                        Component:React.lazy(()=>import('src/pages/proComponents/huizong'))
                    },   {
                        path:'huizongedit',
                        name:'汇总编辑',
                        Component:React.lazy(()=>import('src/pages/proComponents/huizongedit'))
                    }
                ]
            },{
                path:'antd',
                name:'AntdComponents',
                children:[
                    {
                        path:'list',
                        name:'常用列表页',
                          Component:React.lazy(()=>import('src/pages/antd/list'))
                    },
                    {
                        path:'edit',
                        name:'常用编辑页',
                          Component:React.lazy(()=>import('src/pages/antd/edit'))
                    },
                    {
                        path:'edit2',
                        name:'常用编辑页2',
                          Component:React.lazy(()=>import('src/pages/antd/edit2'))
                    },
                    {
                        path:'edit3',
                        name:'常用编辑页3',
                          Component:React.lazy(()=>import('src/pages/antd/edit3'))
                    }
                ]
            }
        ]
    }
]

export {
    routes
}