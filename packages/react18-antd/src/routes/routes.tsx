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
                    path:'daynamicCode',
                    name: '代码生成',
                    Component: React.lazy(() => import('src/pages/tools/dynamicCode'))

                },{

                    path:'simplifiedToTraditional',
                    name: '简体转繁体',
                    Component: React.lazy(() => import('src/pages/tools/SimplifiedToTraditional'))

                },{
                    path:'css',
                    name: 'css',
                    children:[{
                        name:'flex布局',
                        path:'flex',
                        Component: React.lazy(() => import('src/pages/tools/css/flex'))
                    }]
                },{
                    path:'bignumber',
                    name: 'bignumber',
                    children:[{
                        name:'bignumber',
                        path:'bignumber',
                        Component: React.lazy(() => import('src/pages/tools/bignumber/bignumber'))
                    }]
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
                    }, {
                        path: 'protableAntForm',
                        name: 'ProTable+AntForm表单联动',
                        Component: React.lazy(() => import('src/pages/proComponents/protableAntForm'))
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
                    },{
                        path: 'mullist',
                        name: '多列大数据列表',
                        Component: React.lazy(() => import('src/pages/antd/mullist'))
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
                            },
                             {
                                path:'wljkUi',
                                name:'违例检控ui',
                                Component: React.lazy(() => import('src/pages/antd/data-board/wljk/ui'))
                            }
                        ]
                    },
                ]
            },{
                path:'graphic',
                name:'Graphics',
                children:[
                    {
                        name:'canvas',
                        path:'canvas',
                        children:[
                            {
                                name:'ShuoHan',
                                path:'shuoHan',
                                Component: React.lazy(() => import('src/pages/graphic/canvas/shuoHan'))
                            }
                        ]
                    }
                ]
            },
            {
                name:'数据库',
                path:'database',
                children:[
                    {
                        name:'连接数据库',
                        path:'connect',
                        Component: React.lazy(() => import('src/pages/database/connect'))
                    },
                      {
                        name:'查询',
                        path:'query',
                        Component: React.lazy(() => import('src/pages/database/query'))
                    }
                ]

            }
        ]
    }]

export {
            routes
        }