<template>
  
  <router-view />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {provide, shallowRef} from 'vue'
const router = useRouter()
const langKey='lang'
const langRef=shallowRef([])
provide(langKey,langRef)

const delay=(time:number)=>new Promise((resolve)=>setTimeout(resolve,time))
let loaind=false
//全局前置守卫
/**
 * 当一个导航触发时，全局前置守卫按照创建顺序调用。守卫是异步解析执行，此时导航在所有守卫 resolve 完之前一直处于等待中。

每个守卫方法接收两个参数：

to: 即将要进入的目标 用一种标准化的方式
from: 当前导航正要离开的路由 用一种标准化的方式
可以返回的值如下:

false: 取消当前的导航。如果浏览器的 URL 改变了(可能是用户手动或者浏览器后退按钮)，那么 URL 地址会重置到 from 路由对应的地址。
一个路由地址: 通过一个路由地址重定向到一个不同的地址，如同调用 router.push()，且可以传入诸如 replace: true 或 name: 'home' 之类的选项。它会中断当前的导航，同时用相同的 from 创建一个新导航。
 * 全局前置守卫
 * @param to 目标路由
 * @param from 来源路由
 * @returns 目标路由
 */
// router.beforeEach(async (to, from) => {
//     // console.log('to',to)
//     // console.log('from',from)
//     if(!loaind){
//       loaind=true
//       await delay(2000)
//       langRef.value=['zh-CN','en-US']
//     }
// })
// 全局后置守卫
/**
 * 全局后置守卫在每次成功导航后调用。它接收两个参数：
你也可以注册全局后置钩子，然而和守卫不同的是，这些钩子不会接受 next 函数也不会改变导航本身：
to: 目标路由
from: 来源路由
 * 全局后置守卫
 * @param to 目标路由
 * @param from 来源路由
 * @returns 无
 */
// router.afterEach((to, from) => {
//     // 每次成功导航后调用
//     console.log('afterEach',to, from)
// })
// App.vue
</script>

<style scoped>
/* 全局样式 */
</style>
