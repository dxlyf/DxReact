export default [
  {
    path: '/',
    component:'@/layouts/BasicLayout',
    wrappers: ['@/layouts/BlankLayout', '@/layouts/SecurityLayout'],
    routes: [
      {
        path:"/",
        redirect:'/home'
      },
      {
        path: '/home',
        name: '首页',
        component: './index'
      },
      {
        component: 'exception/404',
      }
    ],
  }

];
