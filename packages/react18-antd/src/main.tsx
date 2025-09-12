import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'virtual:uno.css'
import './index.css'
import { Provider as ReduxProdiver } from 'react-redux'
import { store } from './store'
import App from './app'
import { app } from './utils/app'


async function render() {
  let root=createRoot(document.getElementById('root')!)
  root.render(<div>loading...</div>)
  await app.initialize()
  root.unmount()
   root=createRoot(document.getElementById('root')!)
  root.render(
      <ReduxProdiver store={store}>
        <App></App>
      </ReduxProdiver>,
  )

}
render()