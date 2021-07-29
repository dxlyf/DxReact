export default [
  {
    path: '/',
    component: '@/layouts/BlankLayout',
    routes: [
      {
        path: '/login',
        exact: true,
        component: 'login',
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
                        name: '新增发布商品',
                        hideInMenu: true,
                        path: '/product/product-manage/list/add',
                        component: 'product/product-manage/product-edit',
                        parentKeys: ['productManage'],
                      },
                      {
                        name: '编辑发布商品',
                        hideInMenu: true,
                        path: '/product/product-manage/list/edit/:id',
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
                      {
                        name: '模板管理',
                        key: 'diyTemplate',
                        path: '/product/diy/template',
                        component: 'product/diy/template',
                      },
                      {
                        name: '模板详情',
                        key: 'diyTemplate',
                        path: '/product/diy/template/edit/:id',
                        component: 'product/diy/template/edit',
                        parentKeys: ['diyTemplate'],
                        hideInMenu: true,
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
                name: '内容',
                path: '/content',
                routes: [
                  {
                    name: '广告管理',
                    path: '/content/advertisement',
                    routes: [
                      {
                        name: '首页Banner',
                        path: '/content/advertisement/home-banner',
                        component: 'content/advertisement/home-banner',
                        key: 'homeBanner',
                      },
                      {
                        name: '新增首页Banner',
                        hideInMenu: true,
                        path: '/content/advertisement/home-banner/add',
                        component: 'content/advertisement/home-banner/edit',
                        parentKeys: ['homeBanner'],
                      },
                      {
                        name: '编辑首页Banner',
                        hideInMenu: true,
                        path: '/content/advertisement/home-banner/edit/:id',
                        component: 'content/advertisement/home-banner/edit',
                        parentKeys: ['homeBanner'],
                      },
                      {
                        name: '模板Banner',
                        path: '/content/advertisement/template-banner',
                        component: 'content/advertisement/template-banner',
                        key: 'templateBanner',
                      },
                      {
                        name: '新增模板Banner',
                        hideInMenu: true,
                        path: '/content/advertisement/template-banner/add',
                        component: 'content/advertisement/template-banner/edit',
                        parentKeys: ['templateBanner'],
                      },
                      {
                        name: '编辑模板Banner',
                        hideInMenu: true,
                        path: '/content/advertisement/template-banner/edit/:id',
                        component: 'content/advertisement/template-banner/edit',
                        parentKeys: ['templateBanner'],
                      },
                    ],
                  },
                  {
                    name: '首页魔方',
                    path: '/content/home-magic-cube',
                    component: 'content/home-magic-cube',
                    key: 'homeMagicCube',
                  },
                  {
                    name: '新增魔方',
                    hideInMenu: true,
                    parentKeys: ['homeMagicCube'],
                    path: '/content/home-magic-cube/add',
                    component: 'content/home-magic-cube/edit',
                  },
                  {
                    name: '编辑魔方',
                    hideInMenu: true,
                    parentKeys: ['homeMagicCube'],
                    path: '/content/home-magic-cube/edit/:id',
                    component: 'content/home-magic-cube/edit',
                  },
                ],
              },
              {
                name: '应用',
                path: '/application',
                authority: ['admin', 'thirdParty'],
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
