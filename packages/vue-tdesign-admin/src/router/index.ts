import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: {
            title: '仪表盘'
          }
        },
        {
          path: '/users',
          name: 'Users',
          component: () => import('../views/Users.vue'),
          meta: {
            title: '用户管理'
          }
        },
        {
          path: '/system',
          name: 'System',
          meta: {
            title: '系统管理'
          },
          children: [
            {
              path: '/system/role',
              name: 'Role',
              component: () => import('../views/Role.vue'),
              meta: {
                title: '角色管理'
              }
            },
            {
              path: '/system/permission',
              name: 'Permission',
              component: () => import('../views/Permission.vue'),
              meta: {
                title: '权限管理'
              }
            }
          ]
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('../views/Settings.vue'),
          meta: {
            title: '设置'
          }
        }
      ]
    }
  ]
})

export default router