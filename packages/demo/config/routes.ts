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
                name: '商品管理',
                path: '/product',
                routes: [
                  {
                    path: '/product',
                    redirect: '/product/base-product',
                  },
                  {
                    name: '基础商品',
                    path: '/product/base-product',
                    component: 'product/product-manage',
                    authority: '0',
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
