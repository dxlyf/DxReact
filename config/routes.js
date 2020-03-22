export default [
    {
      path: '/user',
      component: '../layouts/UserLayout',
      routes: [
        {
          name: 'login',
          path: '/user/login',
          component: './user/login',
        },
      ],
    },
    {
      path: '/',
      component: '../layouts/SecurityLayout',
      routes: [
        {
          path: '/',
          component: '../layouts/BasicLayout',
          authority: ['admin', 'user'],
          routes: [
            {
              path: '/',
              redirect: '/welcome',
            },
            {
              path: '/welcome',
              name: 'welcome',
              icon: 'smile',
              component: './Welcome',
            },
            {
              path: '/admin',
              name: 'admin',
              icon: 'crown',
              component: './Admin',
              authority: ['admin'],
              routes: [
                {
                  path: '/admin/sub-page',
                  name: 'sub-page',
                  icon: 'smile',
                  component: './Welcome',
                  authority: ['admin'],
                },
              ],
            },
            {
              name: 'list.table-list',
              icon: 'table',
              path: '/list',
              component: './ListTableList',
            },
            {
                name:"布局编辑器",
                path:"/layoutEditor",
                icon: 'crown',
                component:"./layoutEditor"
              },
            {
              component: './404',
            },
          ],
        },
        {
          path:"/",
          component:"../layouts/BlankLayout",
          routes:[{
            name:"布局编辑器",
            path:"/layoutEditor",
            icon: 'crown',
            component:"./layoutEditor"
          }]
        },
        {
          component: './404',
        },
      ],
    },
    {
      component: './404',
    },
  ]