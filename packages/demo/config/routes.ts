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
                name: "商品",
                path: "/product",
                routes: [{
                  name: "商品管理",
                  path: "/product/product-manage",
                  routes: [{
                    name: "商品管理",
                    key: "productManage",
                    path: "/product/product-manage/list",
                    component: "product/product-manage",
                  }, {
                    name: "发布商品",
                    hideInMenu: true,
                    path: "/product/product-manage/list/edit",
                    component: "@/pages/product/product-manage/product-edit",
                    parentKeys: ['productManage']
                  }, {
                    name: "商品分组",
                    path: "/product/product-manage/group",
                    component: "product/product-manage/product-group"
                  }]
                }]
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
