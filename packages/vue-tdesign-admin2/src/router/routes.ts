import { type RouteRecordRaw } from 'vue-router'
import { type Component } from 'vue'
const modules = import.meta.glob(['../views/**/*.vue'], {
    eager: false
    // import:''
})
const configs: Record<string, {
    meta: RouteMeta
}> = import.meta.glob(['../views/**/*.config.ts'], {
    eager: true
    // import:''
})
const getFileName = (path: string) => {
    return path.split('/').pop()
    // return fileName.split('.')[0]
}
const getBasePath = (path: string) => {
    return path.split('/').slice(0, -1).join('/')
}
const getRoutesFromModules = (modules: Record<string, {
    default: Component
    meta: RouteMeta
}>, isFlat: boolean = false) => {
    const routes: RouteRecordRaw[] = []
    const dirMap = new Map<string, RouteRecordRaw>()
    for (const [dir, Component] of Object.entries(modules)) {
        let fullPath = dir.replace('../views', '')
        let paths = fullPath.split('/')
        let fileName = paths[paths.length - 1]
        let fileNameNoExt = fileName.split('.')[0]
        let basePath = paths.slice(0, -1).join('/')
        
        const isIndex=fileNameNoExt==='index'
        let path = isIndex?(basePath===''?'/':basePath):basePath+'/'+fileNameNoExt
        let configPath='../views'+(isIndex?path+'/index.config.ts':path+'.config.ts')

        let config=configs[configPath]||{}
        
        let meta= Object.assign({
           // configPath:configPath
        }, config.meta||{})
        const routeItem = {
            path: path,
            component: Component,
            meta: meta
        }
        routes.push(routeItem)
    }
    console.log('routes',routes)
    return routes
}

let routes: RouteRecordRaw[] = getRoutesFromModules(modules)

export {
    routes
}