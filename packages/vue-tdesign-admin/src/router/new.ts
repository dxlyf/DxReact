import path from 'path'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getDirTree } from './generate'
import ret from '../../lib/claygl/src/util/dds'
export type MenuDataItem = {
    title?: string
    menuKey?: string
    menuName?: string
    hideMenu?: boolean
    icon?: string
    path?: string
    parentKeys?: string[]
    children?: MenuDataItem[]
}
declare module 'vue-router' {
    interface RouteMeta extends MenuDataItem {
        requiresAuth?: boolean
    }
}


const buildRoutes = () => {
    const root = getDirTree()
    let queue = [root]
    let routes: RouteRecordRaw[]=[]
    let currentRoute: RouteRecordRaw
    let parents =[]
    while (queue.length) {
        let current = queue.shift()
        let parent=parents.shift()

        if (current.type === 'dir') {
            if (current.name !== '/') {
                currentRoute = {
                    path: current.name,
                    children: [],
                    meta: {
                        menuName: current.name,
                    }
                }
            } else {
                currentRoute = {
                    path: current.name,
                    component: () => import('../layouts/AdminLayout.vue'),
                    children: [],
                }
                routes.push(currentRoute)
            }
            if(parent){
                parent.children.push(currentRoute)
            }
       
            for (let i = 0; i < current.children.length; i++) {
                parents.push(currentRoute)
                queue.push(current.children[i])
            }
        } else {
            parent.children.push({
                path:current.name,
                component:current.component,
                meta:{
                    menuName:current.name
                }
            })
        }

    }
    console.log('routes',routes)
    return routes
}
const defaultRoutes: RouteRecordRaw[] = buildRoutes()

const joinPath = (...paths: string[]) => {
    return paths.map((item) => {
        return item.replace(/\/$/g, '')
    }).join('/')
}
export const normalizeRoutes = (routes: RouteRecordRaw[], parent?: MenuDataItem) => {
    return routes.map((item) => {

        const fullPath = parent && !item.path.startsWith('/') ? joinPath(parent.path, item.path) : item.path
        const newItem: RouteRecordRaw = {
            ...item,
            meta: {
                menuKey: fullPath,
                path: fullPath,
                ...(item.meta ? item.meta : {}),
            }
        }
        if (newItem.children) {
            newItem.children = normalizeRoutes(newItem.children, newItem.meta)
        }
        return newItem
    })
}
export const routes = normalizeRoutes(defaultRoutes)
const router = createRouter({
    history: createWebHistory(),
    routes: routes
})
// router.beforeEach((to, from, next) => {
//   console.log('全局路由守卫')
//   // 检查edittabs页面的productId参数
//   if (to.path === '/example/tdesign/edittabs' && !to.query.id) {
//     next('/error-page')
//   } else {
//     next()
//   }
// })
const transformMenuDataFromRoutes = (routes: RouteRecordRaw[], parent?: MenuDataItem) => {
    let menuData: MenuDataItem[] = []

    routes.forEach((item) => {
        const meta = item.meta as MenuDataItem


        if (!meta.menuName && !Array.isArray(item.children)) {
            return
        }
        const newItem: MenuDataItem = {
            menuKey: meta.menuKey,
            menuName: meta.menuName,
            path: meta.path,
            icon: meta.icon
        }
        if (parent) {
            newItem.parentKeys = parent.parentKeys?.concat(parent.menuKey) || [parent.menuKey]
        }
        if (item.children) {
            newItem.children = transformMenuDataFromRoutes(item.children, newItem.path === '/' ? null : newItem)
        }
        if (newItem.menuName) {
            menuData.push(newItem)
        } else {
            menuData = menuData.concat(newItem.children || [])
        }
    })
    return menuData
}
const getFlatMenuData = (menuData: MenuDataItem[]) => {
    const flatMenuData: MenuDataItem[] = []
    menuData.forEach((item) => {
        flatMenuData.push(item)
        if (item.children) {
            flatMenuData.push(...getFlatMenuData(item.children))
        }
    })
    return flatMenuData
}
export const menuData = transformMenuDataFromRoutes(routes)

export default router