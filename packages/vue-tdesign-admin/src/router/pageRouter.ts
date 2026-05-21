
import { createRouter, createWebHashHistory,createWebHistory ,createMemoryHistory,type RouteRecordRaw} from 'vue-router'
import { S } from 'vue-router/dist/router-CWoNjPRp.mjs'
const pages=import.meta.glob([
    '/src/views/**/*.vue',
    '!/src/views/**/_*.vue',
    '!/src/views/**/components/**/*.vue'
],{
    eager:false
})
export const pageRoutes:RouteRecordRaw[]=[]

const toSnakeCase=(str:string)=>{
    return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

for(const [filePath,component] of Object.entries(pages)){
    const pageInfo=filePath.match(/\/src\/views\/(.*)\.vue/)
    if(!pageInfo){
        continue
    }
    
    const segments=pageInfo?.[1].split('/').map(item=>toSnakeCase(item))
    const fileName=segments[segments.length-1]
    const isIndex=fileName.toLowerCase()==='index'
    const dirPath=segments.slice(0,-1).join('/')
    const routePath=isIndex?dirPath:`${dirPath?dirPath+'/':''}${toSnakeCase(fileName)}`
 
    pageRoutes.push({
        path:routePath,
        component:component.default||component,

    })
}
export const routes:RouteRecordRaw[]=[
    {
        path:'/',
        component:()=>import('@/layouts/DetaultLayout.vue'),
        children:pageRoutes
    }
]

export const router=createRouter({
    history:createWebHistory(),
    routes:routes
})

