import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

console.log('routes',routes)
const router = createRouter({
    history: createWebHistory(),
    routes:routes,
})
// 这将在运行时更新路由而无需重新加载页面
if (import.meta.hot) { 
  handleHotUpdate(router) 
} 
export default router