import { useState } from 'react'
import {ConfigProvider} from 'antd'
import {RouterProvider} from 'react-router-dom'
import router from './routes'
import './App.css'

function App() {
  
  return (
      <ConfigProvider>
        <RouterProvider router={router} />
      </ConfigProvider>
  )
}

export default App
