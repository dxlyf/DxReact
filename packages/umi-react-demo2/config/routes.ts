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
                authority: '110000',
                routes: [
                  {
                    name: '商品管理',
                    path: '/product/product-manage',
                    authority: '110001',
                    routes: [
                      {
                        name: '商品管理',
                        key: 'productManage',
                        path: '/product/product-manage/list',
                        component: 'product/product-manage',
                        authority: '110002',
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
                        authority: '110005',
                      },
                      {
                        name: '分组商品管理',
                        hideInMenu: true,
                        path:
                          '/product/product-manage/group/manage/:groupId/:name',
                        component: 'product/product-manage/product-group-goods',
                        parentKeys: ['prodcutGroup'],
                      },
                      {
                        name: '商品折扣',
                        key: 'productDiscount',
                        path: '/product/product-manage/discount',
                        component: 'product/product-manage/product-discount',
                        authority: '110120',
                      },
                      {
                        name: '新增折扣',
                        hideInMenu: true,
                        path: '/product/product-manage/discount/add',
                        component:
                          'product/product-manage/product-discount/edit',
                        parentKeys: ['productDiscount'],
                      },
                      {
                        name: '折扣详情',
                        hideInMenu: true,
                        path: '/product/product-manage/discount/view/:id',
                        component:
                          'product/product-manage/product-discount/edit',
                        parentKeys: ['productDiscount'],
                      },
                      {
                        name: '编辑折扣',
                        hideInMenu: true,
                        path: '/product/product-manage/discount/edit/:id',
                        component:
                          'product/product-manage/product-discount/edit',
                        parentKeys: ['productDiscount'],
                      },
                    ],
                  },
                  {
                    name: 'DIY管理',
                    path: '/product/diy',
                    authority: '110010',
                    routes: [
                      {
                        name: 'DIY主题',
                        key: 'diyTheme',
                        path: '/product/diy/theme',
                        component: 'product/diy/theme',
                        authority: '110011',
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
                          '/product/diy/theme/category/:themeId/goods/:categoryId/:pid',
                        component: 'product/diy/category-goods',
                        parentKeys: ['diyTheme'],
                      },
                      {
                        name: '模板管理',
                        key: 'diyTemplate',
                        path: '/product/diy/template',
                        component: 'product/diy/template',
                        authority: '110018',
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
                authority: '110020',
                routes: [
                  {
                    name: '订单查询',
                    path: '/order/order-search',
                    authority: '110021',
                    routes: [
                      {
                        name: '订单查询',
                        key: 'orderList',
                        path: '/order/order-search/order-list',
                        component: 'order/order-search/list/order-list',
                        authority: '110022',
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
                  {
                    name: '评价管理',
                    path: '/order/evaluate',
                    authority:"110023",
                    routes: [
                      {
                        name: '订单评价',
                        path: '/order/evaluate/order-evaluate',
                        component: 'order/evaluate/order-evaluate',
                        authority:"110024"
                      },
                    ],
                  },
                ],
              },
              {
                name: '会员',
                path: '/member',
                authority: '110030',
                routes: [
                  {
                    name: '会员管理',
                    path: '/member/manage',
                    authority: '110031',
                    routes: [
                      {
                        name: '会员查询',
                        path: '/member/manage/list',
                        component: 'member/member-manage',
                        authority: '110032',
                      },
                    ],
                  },
                ],
              },
              {
                name: '内容',
                path: '/content',
                authority: '110040',
                routes: [
                  {
                    name: '广告管理',
                    path: '/content/advertisement',
                    authority: '110041',
                    routes: [
                      {
                        name: '首页Banner',
                        path: '/content/advertisement/home-banner',
                        component: 'content/advertisement/home-banner',
                        key: 'homeBanner',
                        authority: '110042',
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
                        authority: '110045',
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
                      {
                        name: '有赞广告',
                        path: '/content/advertisement/youzan',
                        component: 'content/advertisement/youzan',
                        key: 'youzanBanner',
                        authority: '110043',
                      },
                      {
                        name: '新增有赞广告',
                        hideInMenu: true,
                        path: '/content/advertisement/youzan/add',
                        component: 'content/advertisement/youzan/edit',
                        parentKeys: ['youzanBanner'],
                      },
                      {
                        name: '编辑有赞广告',
                        hideInMenu: true,
                        path: '/content/advertisement/youzan/edit/:id',
                        component: 'content/advertisement/youzan/edit',
                        parentKeys: ['youzanBanner'],
                      },
                    ],
                  },
                  {
                    name: '首页魔方',
                    path: '/content/home-magic-cube',
                    component: 'content/home-magic-cube',
                    key: 'homeMagicCube',
                    authority: '110050',
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
                authority: ['110100', 'thirdParty'],
                routes: [
                  {
                    name: 'DIY工具',
                    path: '/application/diy-tool',
                    authority: ['110101', 'thirdParty'],
                    routes: [
                      {
                        path: '/application/diy-tool',
                        redirect: '/application/diy-tool/material-list',
                      },
                      {
                        name: '素材库',
                        path: '/application/diy-tool/material-list',
                        component: 'application/diy-tool/material-list',
                        authority: ['110102', 'thirdParty'],
                      },
                      {
                        name: '编辑素材',
                        path: '/application/diy-tool/material-edit/:materialId',
                        component: 'application/diy-tool/material-edit',
                        hideInMenu: true,
                        type: 'edit',
                        authority: ['110102', 'thirdParty'],
                      },
                      {
                        name: '新增素材',
                        path: '/application/diy-tool/material-create',
                        component: 'application/diy-tool/material-edit',
                        hideInMenu: true,
                        type: 'create',
                        authority: ['110102', 'thirdParty'],
                      },
                    ],
                  },
                ],
              },
              {
                name: '设置',
                path: '/setting',
                authority: '110110',
                routes: [
                  {
                    name: '店铺设置',
                    path: '/setting/store-set',
                    authority: '110111',
                    routes: [
                      {
                        name: '交易设置',
                        path: '/setting/store-set/transaction',
                        component: 'setting/store-set/transaction',
                        authority: '110112',
                      },
                    ],
                  },
                  {
                    name: '商品设置',
                    path: '/setting/goods-set',
                    authority: '110114',
                    routes: [
                      {
                        name: '商品标签',
                        path: '/setting/goods-set/label',
                        component: 'setting/goods-set/label',
                        authority: '110115',
                      },
                    ],
                  },
                  {
                    name: '作品设置',
                    path: '/setting/works-set',
                    authority: '110117',
                    routes: [
                      {
                        name: '分享设置',
                        path: '/setting/works-set/share-set',
                        component: 'setting/works-set/share-set',
                        authority: '110118',
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
