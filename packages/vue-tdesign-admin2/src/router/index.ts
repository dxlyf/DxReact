import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from './routes'
import { setupRouterGuard } from './guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

//setupRouterGuard(router)

export function resetRouter(): void {
  const newRouter = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes,
  })
  ;(router as any).matcher = (newRouter as any).matcher
}

export default router
