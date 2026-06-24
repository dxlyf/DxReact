import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import appInstance from './utils/App'
import {request} from '@/utils/request'

function testTimeout(){
    request({
        url:'/api/test/timeout',
        method:'post',
        timeout:2000
    })
    //  request({
    //     url:'/api/test/500',
    //     method:'post'
    // })
      request({
        url:'/api/test/401',
        method:'post'
    })
      request({
        url:'/api/test/402',
        method:'post'
    })
        request({
        url:'/api/test/403',
        method:'post'
    })
          request({
        url:'/api/test/404',
        method:'post'
    })
    request({
        url:'/api/test/apierror',
        method:'post'
    })
}
async function initializeApp() {
 //  testTimeout()
    // 初始化应用环境
    await appInstance.initialize()
    // 初始化完成，移除 loading 蒙层
    const loadingEl = document.getElementById('app-loading')
    if (loadingEl) {
        loadingEl.style.opacity = '0'
        setTimeout(() => loadingEl.remove(), 300)
    }
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
   // app.use(TDesign)
    app.use(i18n)

    app.mount('#app')

    
}

initializeApp()
