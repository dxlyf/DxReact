import {createHashRouter} from 'react-router-dom'
import type {RouteObject} from 'react-router-dom'
import {routes} from './routes'


const router=createHashRouter(routes,{})

export {
    router
}