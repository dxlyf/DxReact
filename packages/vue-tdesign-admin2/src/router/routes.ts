import type { RouteRecordRaw } from 'vue-router'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/select-tenant',
    name: 'SelectTenant',
    component: () => import('@/views/login/SelectTenant.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, requiresTenant: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '仪表盘', icon: 'dashboard' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: 'tenants',
        name: 'TenantManagement',
        component: () => import('@/views/tenant/TenantList.vue'),
        meta: { title: '租户管理' },
      },
    ],
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/views/error/Forbidden.vue'),
    meta: { public: true },
  },
  {
    path: '/subscription-expired',
    name: 'SubscriptionExpired',
    component: () => import('@/views/error/SubscriptionExpired.vue'),
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { public: true },
  },
]
