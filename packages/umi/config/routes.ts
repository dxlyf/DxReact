export default [
    {
       path: '/',
       component: '@/layouts/BlankLayout',
       routes:[
         {
             path:"/login",
             exact:true,
             component:"login"
         },{
           path:"/",
           component:"@/layouts/SecurityLayout",
           routes:[{
              path:"/",
              component:"@/layouts/BasicLayout",
              routes:[{
                  path:"/",
                  name:"首页",
                  component:"@/pages/index"
              },{
                  name:"用户管理",
                  path:"/users",
                  routes:[{
                      path:"/users",
                      redirect:"/users/user-list"
                  },{
                      name:"用户列表",
                      path:"/users/user-list",
                      component:"users/UserList",
                      authority:'0'
                  }]
              },{
                name:"商品管理",
                path:"/product",
                routes:[{
                    path:"/product",
                    redirect:"/product/base-product"
                },{
                    name:"基础商品",
                    path:"/product/base-product",
                    component:"product/product-manage",
                    authority:'0'
                },{
                    name:"商品列表",
                    path:"/product/product-list",
                    component:"product/product-manage/product-list",
                    authority:'0'
                }]
            }]
           }]
         }
       ]
  }]