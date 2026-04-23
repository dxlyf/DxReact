import path from 'path'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export type MenuDataItem = {
  title?: string
  menuKey?: string
  menuName?: string
  hideMenu?: boolean
  icon?: string
  path?: string
  parentKeys?: string[]
  children?: MenuDataItem[]
}
declare module 'vue-router' {
  interface RouteMeta extends MenuDataItem {
    requiresAuth?: boolean
  }
}
const defaultRoutes: RouteRecordRaw[] = [

  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: '/reload',
        component: () => import('../views/reload.vue'),
      },
      {
        path: '/error-page',
        component: () => import('../views/error-page.vue'),
        meta: {
          title: '错误页面'
        }
      },
      {
        path: 'mock',
        name: 'Mock',
        component: () => import('@/views/mock.vue'),
        meta: {
          title: '模拟数据',
          menuName: '模拟数据',
          icon: 'dashboard'
        }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          menuName: '仪表盘',
          icon: 'dashboard'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: {
          title: '用户管理',
          menuName: '用户管理',
          icon: 'user'
        }
      },
      {
        path: 'user',
        name: 'UserList',
        component: () => import('../views/user/index.vue'),
        meta: {
          title: '用户列表',
          menuName: '用户列表',
          icon: 'user'
        }
      },
      {
        path: 'user/edit/:id?',
        name: 'UserEdit',
        component: () => import('../views/user/edit.vue'),
        meta: {
          title: '用户编辑',
          hideMenu: true
        }
      },
      {
        path: 'system',
        name: 'System',
        meta: {
          title: '系统管理',
          menuName: '系统管理',
          icon: 'setting'
        },
        children: [
          {
            path: 'role',
            name: 'Role',
            component: () => import('../views/Role.vue'),
            meta: {
              title: '角色管理',
              menuName: '角色管理',
              icon: 'user-group'
            }
          },
          {
            path: 'permission',
            name: 'Permission',
            component: () => import('../views/Permission.vue'),
            meta: {
              title: '权限管理',
              menuName: '权限管理',
              icon: 'lock'
            }
          }
        ]
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: {
          title: '设置',
          menuName: '设置',
          icon: 'setting'
        }
      },
      {
        path: 'form',
        meta: {
          title: '表单示例',
          menuName: '表单示例',
          icon: 'setting'
        },
        children: [
          {
            path: 'basic',
            component: () => import('@/views/form/basic.vue'),
            meta: {
              title: '基础表单',
              menuName: '基础表单',
              icon: 'table'
            }
          }
        ]
      },
      {
        path: 'example',
        meta: {
          menuName: '示例',
          icon: 'table'
        },
        children: [
          {
            path: 'file',
            component: () => import('../views/example/file.vue'),
            meta: {
              title: '首页',
              menuName: 'file',
              icon: 'table'
            }
          },{
            path: 'dom',
            component: () => import('../views/dom.vue'),
            meta: {
              title: 'DOM',
              menuName: 'DOM',
              icon: 'table'
            }
          }, {
            path: 'component',
            meta: {
              title: '树',
              menuName: '自定义组件',
              icon: 'table'
            },
            children: [
              {
                path: 'tree',
                component: () => import('../views/example/components/Tree/index.vue'),
                meta: {
                  title: '树',
                  menuName: 'tree',
                  icon: 'table'
                }
              }
            ]
          },
          {
            path: 'tdesign',
            children: [
              {
                path: 'searchform',
                component: () => import('../views/example/tdesign/searchform.vue'),
                meta: {
                  menuName: '搜索表单',
                  icon: 'table'
                }
              },{
                path: 'download',
                meta: {
                  title: '下载',
                  menuName: '下载',
                  icon: 'table'
                },
                children:[
                  {
                    path: 'apps',
                    component: () => import('../views/example/tdesign/download/apps/index.vue'),
                    meta: {
                      title: '应用',
                      menuName: '应用',
                      icon: 'table'
                    }
                  }, {
                    path: 'app_categories',
                    component: () => import('../views/example/tdesign/download/app_categories/index.vue'),
                    meta: {
                      title: '应用分类',
                      menuName: '应用分类',
                      icon: 'table'
                    }
                  }, {
                    path: 'app_categories/new',
                    component: () => import('../views/example/tdesign/download/app_categories/new.vue'),
                    meta: {
                    }
                  },{
                    path: 'app_categories/edit',
                    component: () => import('../views/example/tdesign/download/app_categories/edit.vue'),
                    meta: {
                    }
                  }, {
                    path: 'apps/edit',
                    component: () => import('../views/example/tdesign/download/apps/edit.vue'),
                  },
                  {
                    path: 'firmwares',
                    component: () => import('../views/example/tdesign/download/firmwares/index.vue'),
                    meta: {
                      title: '固件',
                      menuName: '固件',
                      icon: 'table'
                    }
                  },
                  {
                    path: 'firmwares/new',
                    component: () => import('../views/example/tdesign/download/firmwares/new.vue'),
                  }, {
                    path: 'firmwares/edit',
                    component: () => import('../views/example/tdesign/download/firmwares/edit.vue'),
                  }
                ]
              },{
                path: 'basicform',
                component: () => import('../views/example/tdesign/basicform.vue'),
                meta: {
                  title: '基本表单',
                  menuName: '基本表单',
                  icon: 'table'
                }
              }, {
                path: 'add',
                component: () => import('../views/example/tdesign/add.vue'),
                meta: {
                  title: '新增页',
                  menuName: '新增页',
                  icon: 'table'
                }
              }, {
                path: 'edittabs',
                component: () => import('../views/example/tdesign/edittabs.vue'),
                meta: {
                  title: '新增页',
                  menuName: 'edit-tabs',
                  icon: 'table'
                }
              }, {
                path: 'list',
                component: () => import('../views/example/tdesign/list.vue'),
                meta: {
                  title: '列表',
                  menuName: '查询列表',
                  icon: 'table'
                }
              }, {
                path: 'field',
                component: () => import('../views/example/tdesign/field.vue'),
                meta: {
                  title: '列表',
                  menuName: 'field',
                  icon: 'table'
                }
              }, {
                path: 'treelist',
                component: () => import('../views/example/tdesign/treelist.vue'),
                meta: {
                  layout: '',
                  title: '列表',
                  menuName: 'treelist',
                  icon: 'table'
                }
              }, {
                path: 'simple_treelist',
                component: () => import('../views/example/tdesign/simple_treelist.vue'),
                meta: {
                  layout: '',
                  title: '列表',
                  menuName: 'treelist(简单模式)',
                  icon: 'table'
                }
              }, {
                path: 'simple_treelist_grid',
                component: () => import('../views/example/tdesign/simple_treelist-grid.vue'),
                meta: {
                  layout: '',
                  title: '列表',
                  menuName: 'treelist网格',
                  icon: 'table'
                }
              }, {
                path: 'treelist_new',
                component: () => import('../views/example/tdesign/treelist_new.vue'),
                meta: {
                  // layout:'',
                  // title: '列表',
                  // menuName: 'treelist(简单模式)新增页',
                  // icon: 'table'
                }
              }, {
                path: 'video',
                children: [{
                  path: 'new',
                  component: () => import('../views/example/tdesign/video/new.vue'),
                }, {
                  path: 'edit',
                  component: () => import('../views/example/tdesign/video/edit.vue'),
                }, {
                  path: 'list',
                  component: () => import('../views/example/tdesign/video/index.vue'),
                  meta: {
                    title: '列表',
                    menuName: '视频列表',
                    icon: 'table'
                  }
                }, {
                  path: 'product_group',
                  children: [
                    {
                      path:'index',
                    component: () => import('../views/example/tdesign/video/product_video_groups/index.vue'),
                      meta: {
                        title: '详情',
                        menuName: '产品视频分组',
                        icon: 'table'
                      },
                    },
                    {
                      path: 'show',
                      component: () => import('../views/example/tdesign/video/product_video_groups/show.vue'),

                    },
                    {
                      path: 'new',
                      component: () => import('../views/example/tdesign/video/product_video_groups/new.vue'),

                    },{
                      path: 'edit',
                      component: () => import('../views/example/tdesign/video/product_video_groups/edit.vue'),
                    }
                  ]
                }],
                meta: {
                  title: '列表',
                  menuName: '视频相关',
                  icon: 'table'
                }
              }
            ],
            meta: {
              title: '列表',
              menuName: 'tdesign',
              icon: 'table'
            }
          }, {
            path: 'antd',
            children: [{
              path: 'treevue',
              meta: {
                title: 'treevue',
                menuName: 'treevue',
                icon: 'table'
              },
              component: () => import('../views/example/antd/treevue.vue'),
            }],
            meta: {
              title: 'antd',
              menuName: 'antd',
              icon: 'table'
            }
          }, {
            path: 'editor',
            children: [{
              path: 'tiptap',
              meta: {
                title: 'tiptap',
                menuName: 'tiptap-editor',
                icon: 'table'
              },
              component: () => import('@/views/example/editor/tiptap.vue'),
            }, {
              path: 'quill',
              meta: {
                title: 'quill',
                menuName: 'quill-editor',
                icon: 'table'
              },
              component: () => import('@/views/example/editor/quill.vue'),
            }],
            meta: {
              title: 'editor',
              menuName: 'editor',
              icon: 'table'
            }

          },
          {
            path: 'components',
            meta: {
              title: '组件示例',
              menuName: '组件示例',
              icon: 'table'
            },
            children: [
              {
                path: 'jsoneditor',
                // name:'JsonEditor',
                component: () => import('../views/example/json-editor/index.vue'),
                meta: {
                  title: 'json编辑',
                  menuName: 'json编辑',
                  icon: 'table'
                }
              },
              {
                path: 'list',
                redirect: '/example/components/list/en',
              },
              {
                path: 'list/:lang',
                // name:'JsonEditor',
                component: () => import('../views/example/list.vue'),
                meta: {
                  menuKey: '/example/components/list',
                  title: '列表',
                  menuName: '列表',
                  icon: 'table'
                }

              },
              {
                path: 'edit/:lang/:id?',
                // name:'JsonEditor',
                component: () => import('../views/example/edit.vue'),
                meta: {
                  title: '编辑'
                }
              }, {
                path: 'basicedit',
                component: () => import('../views/example/basicedit.vue'),
                meta: {
                  title: '基础编辑',
                  menuName: '基础编辑',
                  icon: 'table'
                }
              }
            ]
          }, {
            path: 'fontawesome',
            component: () => import('../views/example/fontawesome.vue'),
            meta: {
              title: 'fontawesome',
              menuName: 'fontawesome',
              icon: 'table'
            }
          }]
      },
      {
        // 404
        path: ':pathMatch(.*)*',
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
const joinPath = (...paths: string[]) => {
  return paths.map((item) => {
    return item.replace(/\/$/g, '')
  }).join('/')
}
export const normalizeRoutes = (routes: RouteRecordRaw[], parent?: MenuDataItem) => {
  return routes.map((item) => {

    const fullPath = parent && !item.path.startsWith('/') ? joinPath(parent.path, item.path) : item.path
    const newItem: RouteRecordRaw = {
      ...item,
      meta: {
        menuKey: fullPath,
        path: fullPath,
        ...(item.meta ? item.meta : {}),
      }
    }
    if (newItem.children) {
      newItem.children = normalizeRoutes(newItem.children, newItem.meta)
    }
    return newItem
  })
}
export const routes = normalizeRoutes(defaultRoutes)
const router = createRouter({
  history: createWebHistory(),
  routes: routes
})
// router.beforeEach((to, from, next) => {
//   console.log('全局路由守卫')
//   // 检查edittabs页面的productId参数
//   if (to.path === '/example/tdesign/edittabs' && !to.query.id) {
//     next('/error-page')
//   } else {
//     next()
//   }
// })
const transformMenuDataFromRoutes = (routes: RouteRecordRaw[], parent?: MenuDataItem) => {
  let menuData: MenuDataItem[] = []

  routes.forEach((item) => {
    const meta = item.meta as MenuDataItem


    if (!meta.menuName && !Array.isArray(item.children)) {
      return
    }
    const newItem: MenuDataItem = {
      menuKey: meta.menuKey,
      menuName: meta.menuName,
      path: meta.path,
      icon: meta.icon
    }
    if (parent) {
      newItem.parentKeys = parent.parentKeys?.concat(parent.menuKey) || [parent.menuKey]
    }
    if (item.children) {
      newItem.children = transformMenuDataFromRoutes(item.children, newItem.path === '/' ? null : newItem)
    }
    if (newItem.menuName) {
      menuData.push(newItem)
    } else {
      menuData = menuData.concat(newItem.children || [])
    }
  })
  return menuData
}
const getFlatMenuData = (menuData: MenuDataItem[]) => {
  const flatMenuData: MenuDataItem[] = []
  menuData.forEach((item) => {
    flatMenuData.push(item)
    if (item.children) {
      flatMenuData.push(...getFlatMenuData(item.children))
    }
  })
  return flatMenuData
}
export const menuData = transformMenuDataFromRoutes(routes)

// router.beforeEach((to, from, next) => {
//   //console.log('全局路由守卫',to)
//   // 检查edittabs页面的productId参数
//   // if (to.path === '/reload' && to.query.redirect) {
//   //   console.log('全局路由守卫',to.query.redirect)
//   //   next(to.query.redirect as string)
//   // } else {
//   //   next()
//   // }
//   next()
// })
// router.afterEach((to, from) => {
//   if(to.path==='/reload'&&to.query.redirect){
//     console.log('路由跳转卫afterEach',to.query.redirect)
//     router.replace(to.query.redirect)
//   }
// })
export default router