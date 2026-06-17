import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { lazy, Suspense, type ComponentType } from 'react'

const pages = import.meta.glob([
    'src/pages/**/*.tsx',
    '!src/pages/**/components/**/*.tsx'
], {
   // import: 'default',
    eager: false
})


const LazyCompoent = (component: () => any) => {
    const LazyComponent = lazy(component)
    return (props: any) => {
        return <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent {...props} />
        </Suspense>
    }
}

const buildRoutes = () => {
    const routes: RouteObject[] = []
    const skipFiles = new Set([])
    const flatRoute = new Map<string, RouteObject>()
    for (const [filePath, component] of Object.entries(pages)) {
        const pageInfo = filePath.match(/\/src\/pages\/(.*)\.tsx/)
        if (!pageInfo || skipFiles.has(filePath)) {
            continue
        }
        const segments = pageInfo?.[1].split('/')
        const fileName = segments[segments.length - 1]
        const isIndex = fileName.toLowerCase() === 'index'
        const isRoot = segments.length === 1 // 根目录
        const dirPath = isRoot ? '/' : segments.slice(0, -1).join('/')
        const routePath = isIndex ? dirPath : (isRoot ? '' : dirPath + '/') + fileName
        const getOtherComponent = (compName: string) => {
            const key = `/src/pages/${isRoot ? compName : dirPath + '/' + compName}.tsx`
            return pages[key]
        }
        let Layout: any = getOtherComponent('_layout')
        let Component = LazyCompoent(component)
        if (fileName.startsWith('_')) {
            continue
        }
        let parentRotue = flatRoute.get(dirPath)
        if (!parentRotue) {
            parentRotue = {
                ...(Layout ? { Component: LazyCompoent(Layout) } : {}),
                path: dirPath,
                children: []
            }
            flatRoute.set(dirPath, parentRotue)
            if(segments.length<=1){
                routes.push(parentRotue)
            }else{
                let current;
                let currentPath=segments.slice(0,-2)
                do{
                    current=flatRoute.get(currentPath.join('/'))
                    currentPath.pop()
                }while(currentPath.length>0&&!current)
                if(current){
                    current.children.push(parentRotue)
                }
            }
        }

        const currentRoute:RouteObject = isIndex?{
            index:true,
            Component: Component
        }:{
            path: routePath,
            Component: Component
        }
        parentRotue.children.push(currentRoute)

    }
    return routes
}
let rotues: RouteObject[] = buildRoutes()
console.log(rotues)
const router = createBrowserRouter(rotues, {
    basename: '/',

})

export default router