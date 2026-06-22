import { type RouteRecordRaw } from 'vue-router'

const modules = import.meta.glob(['../views/**/*.vue'], {
    eager: false
})

const getRoutesFromModules = (modules: Record<string, any>) => {
    const routes: RouteRecordRaw[] = []
    // 存储需要嵌套的子路由: parentPath -> childRoutes[]
    const nestedRoutes = new Map<string, RouteRecordRaw[]>()

    for (const [filePath, importFn] of Object.entries(modules)) {
        try {
            // 去掉 '../views/' 前缀和 '.vue' 后缀
            const relativePath = filePath.replace(/^\.\.\/views\//, '').replace(/\.vue$/, '')
            const segments = relativePath.split('/')
            const isIndex = segments[segments.length - 1] === 'index'

            // index.vue 特殊处理: 路由路径使用所在目录名，不含 "index"
            const pathSegments = isIndex ? segments.slice(0, -1) : segments

            if (pathSegments.length === 0) {
                // 根目录下的 index.vue →  path: '/'
                routes.push({
                    path: '/',
                    name: 'index',
                    component: importFn,
                })
            } else {
                const routePath = '/' + pathSegments.join('/')
                const routeName = pathSegments.join('_')

                if (pathSegments.length === 1) {
                    // 一级路由，直接添加到顶层
                    routes.push({
                        path: routePath,
                        name: routeName,
                        component: importFn,
                    })
                } else {
                    // 多级路由: 父级作为 wrapper，当前为 children
                    const parentPath = '/' + pathSegments.slice(0, -1).join('/')
                    const childPath = pathSegments[pathSegments.length - 1]

                    if (!nestedRoutes.has(parentPath)) {
                        nestedRoutes.set(parentPath, [])
                    }
                    nestedRoutes.get(parentPath)!.push({
                        path: childPath,
                        name: routeName,
                        component: importFn,
                    })
                }
            }
        } catch (e) {
            console.error(`[Route Error] 路由文件解析失败: ${filePath}`, e)
        }
    }

    // 将嵌套路由合并到父级路由中
    for (const [parentPath, children] of nestedRoutes.entries()) {
        const existingRoute = routes.find(r => r.path === parentPath)
        if (existingRoute) {
            // 父级已有对应路由（存在 index.vue），追加 children
            existingRoute.children = [...(existingRoute.children || []), ...children]
        } else {
            // 父级无对应 Vue 文件，创建 wrapper 路由容器
            routes.push({
                path: parentPath,
                children,
            })
        }
    }

    return routes
}

const routes: RouteRecordRaw[] = getRoutesFromModules(modules)

export {
    routes
}