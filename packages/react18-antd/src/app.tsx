
import {router} from './routes'
import {RouterProvider} from 'react-router-dom'
export default ()=>{
    return <>
        <RouterProvider router={router}></RouterProvider>
    </>
}