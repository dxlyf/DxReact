import type { MenuDataItem } from '@ant-design/pro-layout'
import { type ComponentType, Suspense, lazy } from 'react'
import { Navigate, type RouteObject, RouterProvider, createBrowserRouter } from 'react-router-dom'
import {BasicLayout} from '../layouts/BasicLayout'
type RouteMenuObject = Omit<RouteObject, 'children'> & Omit<MenuDataItem, 'children'> & {
    children?: RouteMenuObject[]
}

const loadLazyComponent = (p: () => Promise<{ default: ComponentType }>) => {
    const LazyComponent = lazy(p);
    return <Suspense fallback={<div>加载中...</div>}>
       <LazyComponent></LazyComponent>
    </Suspense>
}
export const routes: RouteMenuObject[] = [
    {
        path: "/",
        element: <BasicLayout></BasicLayout>,
        children: [
            {
                index: true,
                element: <Navigate to="/home"></Navigate>
            },
            {
                name: 'a',
                path: 'a',
                element: loadLazyComponent(() => import('@/pages/a')),
            },
            {
                name: 'b',
                path: 'b',
                element: loadLazyComponent(() => import('@/pages/b')),
            },
            {
                name: 'Home',
                path: 'home',
                element: loadLazyComponent(() => import('@/pages/home')),
            },
            {
                path: 'components',
                children: [
                    {
                        path: "ant-pro-table",
                        name: 'Pro表格',
                        children: [
                            {
                                name: '远程数据',
                                path: 'basic',
                                element: loadLazyComponent(() => import('@/pages/components/proTable'))
                            },
                            {
                                name: '本地数据',
                                path: 'local',
                                element: loadLazyComponent(() => import('@/pages/components/proTable/LocalData'))
                            }
                        ]
                    }, {
                        path: "ant-table",
                        name: '表格',
                        children: [
                            {
                                name: '基本',
                                path: 'basic',
                                element: loadLazyComponent(() => import('@/pages/components/table/basic'))
                            }
                        ]
                    },
                    {
                        name: 'AliTable',
                        path: "ali-table",
                        children: [
                            {
                                path: 'basic',
                                element: loadLazyComponent(() => import('../pages/components/aliTable/index'))
                            }
                        ]
                    },
                    {
                        path: "pro-form",
                        name: 'Pro表单',
                        children: [
                            {
                                name: 'SchemaForm',
                                path: 'beta-form',
                                element: loadLazyComponent(() => import('@/pages/components/proForm/schema-form'))
                            }
                        ]
                    },
                    {
                        path: "form",
                        name: 'antd-form表单',
                        children: [
                            {
                                name: '基本表单',
                                path: 'base',
                                element: loadLazyComponent(() => import('@/pages/components/form/base-form'))
                            }
                        ]
                    }
                ]
            }
        ]
    }
]
let uid=123456;
function transformMenuDataItem(routes: RouteMenuObject[]) {
    const menuData: MenuDataItem[] = []
    const dfsVisit = (routes: RouteMenuObject[], parent: MenuDataItem | null, path: string) => {
        routes.forEach(r => {
            if (r.index) {
                return
            }
            if (!r.name && r.children) {
                dfsVisit(r.children, parent, r.path == '/' ? '/' : path + r.path + '/')
                return
            } else if (!r.name) {
                return
            }
            let menuDataItem: MenuDataItem = {
                name: r.name,
                parentKeys:[],
                key:(uid++).toString(32) //(path + r.path).split('/').join('_'),
            }
            if (r.children) {
                menuDataItem.children = []
                dfsVisit(r.children, menuDataItem, path + r.path + '/')
            } else {
                menuDataItem.path = path + r.path
            }
            if (parent) {
                menuDataItem.parentKeys=parent.parentKeys?.concat(parent.key!)
                parent.children?.push?.(menuDataItem)
            } else {
                menuData.push(menuDataItem)
            }
        })
    }
    dfsVisit(routes, null, '/')
    return menuData
}
function getMenuDataMap(menu: MenuDataItem[]) {
    const map = new Map()
    const dfsVisit = (menu: MenuDataItem[]) => {

        menu.forEach(d => {

            map.set(d.key, d)
            if (d.children) {
                dfsVisit(d.children)
            }
        })
    }
    dfsVisit(menu)
    return map
}
export const MenuData: MenuDataItem[] = transformMenuDataItem(routes)
export const menuDataMap = getMenuDataMap(MenuData)
const router = createBrowserRouter(routes as RouteObject[], {})
export const RootRouter = () => {

    return <RouterProvider router={router}></RouterProvider>
}