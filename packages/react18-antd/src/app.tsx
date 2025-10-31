
import {router} from './routes'
import {RouterProvider} from 'react-router-dom'
import {ConfigProvider} from 'antd'
import { useContext } from 'react'
export default ()=>{

    return <>
        <RouterProvider router={router}></RouterProvider>
    </>
}