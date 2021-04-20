export default [
  {
    path: '/',
    component: '@/layouts/BlankLayout',
    routes: [
      {
        path: '/login',
        exact: true,
        component: 'login'
      },
      {
        path: '/',
        component: '@/layouts/SecurityLayout',
        routes: [
          {
            path: '/',
            component: '@/layouts/BasicLayout',
            routes: [
              {
                path: '/',
                name: '首页',
                component: '@/pages/index',
              },
              {
                name: '商品',
                path: '/product',
                routes: [
                  {
                    name: '商品管理',
                    path: '/product/product-manage',
                    routes: [
                      {
                        name: '商品管理',
                        key: 'productManage',
                        path: '/product/product-manage/list',
                        component: 'product/product-manage',
                      },
                      {
                        name: '发布商品',
                        hideInMenu: true,
                        path: '/product/product-manage/list/edit/:id?',
                        component: 'product/product-manage/product-edit',
                        parentKeys: ['productManage'],
                      },
                      {
                        name: '商品分组',
                        key: 'prodcutGroup',
                        path: '/product/product-manage/group',
                        component: 'product/product-manage/product-group',
                      },
                      {
                        name: '分组商品管理',
                        hideInMenu: true,
                        path:
                          '/product/product-manage/group/manage/:groupId/:name',
                        component: 'product/product-manage/product-group-goods',
                        parentKeys: ['prodcutGroup'],
                      },
                    ],
                  },
                  {
                    name: 'DIY管理',
                    path: '/product/diy',
                    routes: [
                      {
                        name: 'DIY主题',
                        key: 'diyTheme',
                        path: '/product/diy/theme',
                        component: 'product/diy/theme',
                      },
                      {
                        name: 'DIY分类',
                        hideInMenu: true,
                        path: '/product/diy/theme/category/:themeId',
                        component: 'product/diy/category',
                        parentKeys: ['diyTheme'],
                      },
                      {
                        name: '分类商品',
                        hideInMenu: true,
                        path:
                          '/product/diy/theme/category/:themeId/goods/:categoryId',
                        component: 'product/diy/category-goods',
                        parentKeys: ['diyTheme'],
                      },
                    ],
                  },
                ],
              },
              {
                name: '订单',
                path: '/order',
                routes: [
                  {
                    name: '订单查询',
                    path: '/order/order-search',
                    routes: [
                      {
                        name: '订单查询',
                        key: 'orderList',
                        path: '/order/order-search/order-list',
                        component: 'order/order-search/list/order-list',
                      },
                      {
                        name: '订单详情',
                        path:
                          '/order/order-search/order-list/order-detail/:orderId',
                        component: 'order/order-search/order-detail',
                        hideInMenu: true,
                        parentKeys: ['orderList'],
                      },
                    ],
                  },
                ],
              },
              {
                name: '会员',
                path: '/member',
                routes: [
                  {
                    name: '会员管理',
                    path: '/member/manage',
                    routes: [
                      {
                        name: '会员查询',
                        path: '/member/manage/list',
                        component: 'member/member-manage',
                      },
                    ],
                  },
                ],
              },
              {
                name: '应用',
                path: '/application',
                routes: [
                  {
                    name: 'DIY工具',
                    path: '/application/diy-tool',
                    routes: [
                      {
                        path: '/application/diy-tool',
                        redirect: '/application/diy-tool/material-list',
                      },
                      {
                        name: '素材库',
                        path: '/application/diy-tool/material-list',
                        component: 'application/diy-tool/material-list',
                      },
                      {
                        name: '编辑素材',
                        path: '/application/diy-tool/material-edit/:materialId',
                        component: 'application/diy-tool/material-edit',
                        hideInMenu: true,
                        type: 'edit',
                      },
                      {
                        name: '新增素材',
                        path: '/application/diy-tool/material-create',
                        component: 'application/diy-tool/material-edit',
                        hideInMenu: true,
                        type: 'create',
                      },
                    ],
                  },
                ],
              },
              {
                name: '设置',
                path: '/setting',
                routes: [
                  {
                    name: '店铺设置',
                    path: '/setting/store-set',
                    routes: [
                      {
                        name: '交易设置',
                        path: '/setting/store-set/transaction',
                        component: 'setting/store-set/transaction',
                      },
                    ],
                  },
                ],
              },
              {
                path: '*',
                component: 'exception/404',
              },
            ],
          },
        ],
      },
    ],
  },
];
