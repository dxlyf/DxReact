import React from 'react'
import { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AdminLayout } from 'src/layouts/AdminLayout'
import { BasicLayout } from 'src/layouts/BasicLayout'
import type { MenuDataItem } from '@ant-design/pro-components'

type RouteObjectAndMenu = Omit<RouteObject, 'children'> & Pick<MenuDataItem, 'name' | 'flatMenu' | 'key'> & {
    children?: RouteObjectAndMenu[]
}
const routes: RouteObjectAndMenu[] = [
    {
        path: '',
        Component: AdminLayout,
        flatMenu: true,
        children: [
            {
                index: true,
                element: <Navigate to={'/home'}></Navigate>
            },
            {
                path: 'home',
                name: '首页',
                Component: React.lazy(() => import('src/pages/home'))
            },
            {
                path:'tools',
                name:'工具',
                children:[{
                    path:'simplifiedToTraditional',
                    name: '简体转繁体',
                    Component: React.lazy(() => import('src/pages/tools/SimplifiedToTraditional'))

                }]
            },
             {
                path:'chart',
                name:'图表',
                children:[{
                    path:'echart',
                    name: 'echart',
                    children:[
                        {
                            name:'柱状图',
                            path:'bar',
                            Component: React.lazy(() => import('src/pages/chart/echart/bar'))
                        },
                         {
                            name:'折线图',
                            path:'line',
                            Component: React.lazy(() => import('src/pages/chart/echart/line'))
                        }
                    ]

                }]
            },
            {
                path: 'proComponents',
                name: 'ProComponents',
                children: [
                    {
                        path:'demo',
                        name:'Demo',
                        children:[
                            {
                                name:'可编辑表格',
                                path:'caneditable',
                                  Component: React.lazy(() => import('src/pages/proComponents/demos/可编辑表格'))
                            }, {
                                name:'编辑表格与form联动',
                                path:'caneditable2',
                                  Component: React.lazy(() => import('src/pages/proComponents/demos/编辑表格与form联动'))
                            }
                        ]
                    },{
                        path: 'proTable',
                        name: 'ProTable',
                        Component: React.lazy(() => import('src/pages/proComponents/proTable'))
                    },
                    {
                        path: 'list',
                        name: '列表',
                        Component: React.lazy(() => import('src/pages/proComponents/list'))
                    }, {
                        path: 'edit',
                        name: '常用编辑页',
                        Component: React.lazy(() => import('src/pages/proComponents/edit'))
                    }, {
                        path: 'huizong',
                        name: '汇总',
                        Component: React.lazy(() => import('src/pages/proComponents/huizong'))
                    }, {
                        path: 'huizongedit',
                        name: '汇总编辑',
                        Component: React.lazy(() => import('src/pages/proComponents/huizongedit'))
                    }
                ]
            }, {
                path: 'antd',
                name: 'AntdComponents',
                children: [
                    {
                        path: 'list',
                        name: '常用列表页',
                        Component: React.lazy(() => import('src/pages/antd/list'))
                    },
                      {
                        path: 'roleList',
                        name: '角角列表',
                        Component: React.lazy(() => import('src/pages/antd/roleList'))
                    },
                    {
                        path: 'alledit',
                        name: '编辑页',
                        children: [{
                            path: 'edit',
                            name: '常用编辑页',
                            Component: React.lazy(() => import('src/pages/antd/edit'))
                        },
                        {
                            path: 'edit2',
                            name: '常用编辑页2',
                            Component: React.lazy(() => import('src/pages/antd/edit2'))
                        },
                        {
                            path: 'edit3',
                            name: '常用编辑页3',
                            Component: React.lazy(() => import('src/pages/antd/edit3'))
                        },
                        {
                            path: 'edit4',
                            name: '常用编辑页4',
                            Component: React.lazy(() => import('src/pages/antd/edit4'))
                        },
                        {
                            path: 'edit10',
                            name: '动态多功能Table',
                            Component: React.lazy(() => import('src/pages/antd/edit/edit10'))
                        }, {
                            path: 'edit5',
                            name: 'Table动态行',
                            Component: React.lazy(() => import('src/pages/antd/edit5'))

                        }, {
                            path: 'edit6',
                            name: 'Form通用组件',
                            Component: React.lazy(() => import('src/pages/antd/edit6'))

                        }, {
                            path: 'edit7',
                            name: '多表单联动',
                            Component: React.lazy(() => import('src/pages/antd/edit7'))

                        }

                        ]

                    },
                     {
                        path: 'dataBoard',
                        name: '数据看板',
                        children:[
                            {
                                path:'wljk',
                                name:'违例检控',
                                Component: React.lazy(() => import('src/pages/antd/data-board/wljk'))
                            },
                             {
                                path:'wljkDetail',
                                name:'违例检控详情',
                                Component: React.lazy(() => import('src/pages/antd/data-board/wljk/Detail'))
                            }
                        ]
                    },
                ]
            }
        ]
    }]

export {
            routes
        }