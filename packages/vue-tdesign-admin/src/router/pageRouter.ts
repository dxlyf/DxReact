
import { createRouter, createWebHashHistory, createWebHistory, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/stores/menuStore2'
import Wrap from '@/layouts/AdminLayout3/Wrap.vue'
import { h,defineAsyncComponent  } from 'vue'

const pages = import.meta.glob([
    '/src/views/**/*.vue',
    '!/src/views/**/_*.vue',
    '!/src/views/**/components/**/*.vue'
], {
    eager: false
})
export const pageRoutes: RouteRecordRaw[] = []

const toSnakeCase = (str: string) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

for (const [filePath, component] of Object.entries(pages)) {
    const pageInfo = filePath.match(/\/src\/views\/(.*)\.vue/)
    if (!pageInfo) {
        continue
    }

    const segments = pageInfo?.[1].split('/').map(item => toSnakeCase(item))
    const fileName = segments[segments.length - 1]
    const isIndex = fileName.toLowerCase() === 'index'
    const dirPath = segments.slice(0, -1).join('/')
    const routePath = isIndex ? dirPath : `${dirPath ? dirPath + '/' : ''}${toSnakeCase(fileName)}`
    
    const AsyncComponent = defineAsyncComponent({
        loader:component,
        loadingComponent:{
            template:'<div>加载中...</div>'
        },
        
    })
  
    pageRoutes.push({
        path: '/'+routePath,
        component:component.default || component,
        // component:routePath==='refresh'?component :((Comp)=>{
        //         return {
        //             mounted(){
        //                 //console.log('mounted',Comp)
        //             },
        //             render(){
        //                 return h(Wrap,{},{
        //                     default:()=>h(Comp)
        //                 })
        //             }
        //     }
        // })(AsyncComponent),

    })
}

export const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('@/layouts/AdminLayout3/index.vue'),
        children: pageRoutes
    }
]
// pageRoutes.concat([{
//     path:'/',
//     component:{
//         render(){
//             return h(Wrap,{},h('div',{},'dd'))
//         }
//     }
// }])


const keepScrollPaths = [
    '/example/tdesign/download/apps',
]

export const router = createRouter({
    history: createWebHistory(),
    routes: routes,
    // scrollBehavior: (to, from, savedPosition) => {
    //     console.log('scrollBehavior', to.path, from.path, savedPosition)
    //     if (savedPosition && keepScrollPaths.some(p => to.path.startsWith(p))) {
    //         return savedPosition
    //     }
    //     return { top: 0 }
    // }
})

// router.beforeEach(async (to, from, next) => {
//     console.log('路由守卫', to.path,from.path)
//      const appStore=useAppStore()
//      await appStore.initAppData()
//     // if(to.path!==from.path){
//     //     next(to)
//     //     return true
//     // }
//     // return false
//      next()
// })