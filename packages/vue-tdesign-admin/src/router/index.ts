import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
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
        },
        {
          path: 'example/components',
          meta: {
            title: '组件示例'
          },
          children: [
            {
              path: 'comps',
              // name:'JsonEditor',
              component: () => import('../views/example/comps.vue'),
              meta: {
                title: 'json编辑'
              }
            },
            {
               path: 'list',
               redirect: '/example/components/list/en'
            },
            {
              path: 'list/:lang',
              // name:'JsonEditor',
              component: () => import('../views/example/list.vue'),
              meta: {
                title: '列表',
                menuKey:'example_components_list'
              }
            },
            {
              path: 'edit/:lang/(:id)?',
              // name:'JsonEditor',
              component: () => import('../views/example/edit.vue'),
              meta: {
                title: '编辑'
              }
            }
          ]
        },
        {
          // 404
          path: '/:pathMatch(.*)*',
          // sensitive:false,
          // strict:false,
          component: () => import('../views/404.vue'),
          meta: {
            title: '404'
          }
        }
      ]
    }
  ]
})

export default router