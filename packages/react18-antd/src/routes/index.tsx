import {createHashRouter,createBrowserRouter} from 'react-router-dom'
import type {RouteObject} from 'react-router-dom'
import {routes} from './routes'


const router=createBrowserRouter(routes as any,{})

export {
    router
}