/**
 * 文档集成编译配置
*/
const config={
    mode: 'site',
    menus: {
       "/business":[{
            title:"业务",
            path:"business/index.md"
       }],
       '/guide':[{
           title:"指南",
           path:'guide/index.md',
           children:["guide/constant.md"]
       }]
    },
    navs:  [
        {
            title:"指南",
            path: '/guide',
        },
        {
            title:"业务文档",
            path:"/business",
        },
        {
            title:"组件文档",
            path:"/components"
        }
    ],
    resolve:{
        includes:['docs',"src/components"]
    }
}
export default config