import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'virtual:uno.css'
import './index.scss'
import {ConfigProvider,App as AntApp} from 'antd'
import { Provider as ReduxProdiver } from 'react-redux'

import { store } from './store'
import App from './app'
import app from './utils/App'


ConfigProvider.config({
  // 解决modal警告
  holderRender: (dom) => dom 
})
async function render() {
  let root=createRoot(document.getElementById('root')!)
  root.render(<div>loading...</div>)
  await app.initialize()
  root.unmount()
   root=createRoot(document.getElementById('root')!)
  root.render(
      <ReduxProdiver store={store}>
        <AntApp>
        <ConfigProvider ><App></App></ConfigProvider>
        </AntApp>
      </ReduxProdiver>,
  )

}
render()