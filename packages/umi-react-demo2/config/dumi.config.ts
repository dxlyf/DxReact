/**
 * 文档集成编译配置
*/
export default {
    mode: 'site',
    menus: {
       "/business":[{
            title:"业务",
            children:['business/index.md']
       }],
       '/components':[{
           title:"组件",
           children:['components/index.md']
       }]
    },
    // 多语言配置方式如下
    navs:  [
        {
            title: 'GitHub',
            path: 'https://github.com/umijs/dumi',
        },
        {
            title:"业务文档",
            path:"/business"
        },
        {
            title:"组件文档",
            path:"/components"
        }
    ],
}