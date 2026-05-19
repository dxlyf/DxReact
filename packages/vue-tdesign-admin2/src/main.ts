import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(TDesign)
app.use(i18n)

app.mount('#app')
