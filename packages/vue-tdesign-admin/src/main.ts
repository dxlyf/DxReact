import { computed, createApp, h, defineComponent, getCurrentInstance, createRenderer, nodeOps, type VNode } from 'vue'
import App from './App.vue'
import router from './router'
import {router as PageRouter} from './router/pageRouter'
import pinia from './stores'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import { DatePicker } from 'tdesign-vue-next'
import TDesign from 'tdesign-vue-next/esm'
// import 'tdesign-vue-next/esm/style/index.js'
//import 'tdesign-vue-next/es/style/index.css'
import i18n from './i18n'
import './style.css'
import './styles/index.less'
import './utils/app'
import dayjs from 'dayjs';
import TDesignChat from '@tdesign-vue-next/chat'; // 引入 Chat 组件

//import '@tdesign-vue-next/chat/es/style/index.css';

import 'tdesign-vue-next/es/style/index.css'; // 引入少量全局样式变量
import '@tdesign-vue-next/chat/es/style/index.css';
// const app=createRenderer({
//     ...nodeOps,
//     patchProp:(el,propName,value)=>{
//         el[propName]=value
//     }
// }).createApp(App)
function setupApp() {
    const params=new URLSearchParams(window.location.search)
    const app = createApp(App)
    app.use(i18n)
    const currentSystem=params.get('system')||'router'
    if(currentSystem==='page'){
        app.use(PageRouter)
        PageRouter.beforeEach((to,from,next)=>{
            if(from.query.system&&from.query.system!==to.query.system){
               
                return next({
                    ...to,
                    query:{
                        ...to.query,
                        system:from.query.system
                    },
                    replace:true
                })
            }
             next()
        })
    }else{
        app.use(router)
    }
    app.use(pinia)
    app.use(TDesign)
    app.use(Antd)
    app.use(TDesignChat)

    app.mount('#app')

    const div=document.createElement('div')
    div.style.cssText=`
        position:fixed;
        left:10px;
        bottom:10px;
        background-color:#fff;
        z-index:9999
    `
    div.innerHTML=`
    <select id="router-select" >
        <option value="page">页面</option>
        <option value="router">路由</option>
    </select>
    `
    document.body.appendChild(div)
    const select=document.getElementById('router-select') as HTMLSelectElement
    select.value=currentSystem
    select.addEventListener('change',()=>{
         window.location.href=`${window.location.origin}?system=${select.value}`
    })
   }
setupApp()
// app.component('TDatePicker',defineComponent({
//         name:'TDatePicker',
//         setup(props,{attrs}){
//           return ()=>h(DatePicker,{
//             defaultTime:dayjs().format('HH:mm:ss'),
//             ...(attrs||{})
//           })
//         }
// }))
// const traverseVNode = (vnode: VNode, callback: (vnode: VNode) => void) => {
//   if (!vnode) return

//   callback(vnode)

//   if (vnode.component?.subTree) {
//     traverseVNode(vnode.component.subTree, callback)
//   }

//   const children = vnode.children
//   if (Array.isArray(children)) {
//     children.forEach(child => {
//       if (child && typeof child === 'object' && 'type' in child) {
//         traverseVNode(child as VNode, callback)
//       }
//     })
//   } else if (children && typeof children === 'object' && 'type' in children) {
//     traverseVNode(children as VNode, callback)
//   }

//   if (vnode.dynamicChildren) {
//     vnode.dynamicChildren.forEach(child => {
//       if (child && typeof child === 'object' && 'type' in child) {
//         traverseVNode(child as VNode, callback)
//       }
//     })
//   }
// }
// app.mixin({

//   beforeMount() {
//     if (this.$options.name !== 'TDatePicker') {
//       const results: VNode[] = []
//       traverseVNode(this.$.vnode, (vnode) => {
//         const typeName = (vnode.type as any)?.name || (vnode.type as any)?.__name
//         if (typeName === 'TDatePicker') {
//           results.push(vnode)
//         }
//       })
//       console.log('找到 TDatePicker 组件:', results)
//     }
//     },
//     updated(){
//         if(this.$options.name==="TDatePicker"&&this.format==='YYYY-MM-DD HH:mm:ss'&&!this.modelValue){
//          // this._.vnode.component.props.defaultTime=dayjs().format('HH:mm:ss')
//             //   this._.vnode.component.props.clearable=true
//         }
//     },
//     mounted2(){
//         if(this.$options.name==="TDatePicker"&&this.format==='YYYY-MM-DD HH:mm:ss'){
//             //console.log(this.$options.name,dayjs().format('YYYY-MM-DD HH:mm:ss'))
//             if(!this.defaultValue&&this.defaultTime=='00:00:00'){
//                //this.$.vnode.component.props.defaultTime=dayjs().format('HH:mm:ss')
//              //  this.$.vnode.props.clearable=true
//                // this.defaultValue=dayjs().format('YYYY-MM-DD HH:mm:ss')
//                //console.log('fffffffffff')
//               //this.$.vnode.props.defaultTime=dayjs().format('HH:mm:ss')
//             //  this.$.propsOptions[0].defaultTime.default=dayjs().format('HH:mm:ss')
//             //debugger
//              //  this.$forceUpdate()
//                //const instance=getCurrentInstance()
//                //this.$.update()
//             }
//          //   this.$.vnode.props.defaultTime=dayjs().format('HH:mm:ss')
//           //  this.modelValue=dayjs().format('YYYY-MM-DD HH:mm:ss')
//            //this.$options.props.defaultTime.default=dayjs().format('HH:mm:ss')
//            // this.defaultTime=computed(()=>dayjs().format('HH:mm:ss'))
//         }
//     }
// })
