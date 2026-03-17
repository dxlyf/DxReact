import { createApp,h } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import TDesign from 'tdesign-vue-next/esm'
// import 'tdesign-vue-next/esm/style/index.js'
import 'tdesign-vue-next/es/style/index.css'
import i18n from './i18n'
import './style.css'
import './styles/index.less'
import './utils/app'
const app = createApp(App)
app.use(i18n)
app.use(router)
app.use(pinia)
app.use(TDesign)
app.use(Antd)
app.mount('#app')
