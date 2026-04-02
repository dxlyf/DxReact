<script setup lang="ts">
import { type VNode, getCurrentInstance, ref, provide, inject, TransitionHooks, TransitionProps, BaseTransitionProps } from 'vue'
import { type CollapseItemProps, useCollapseItem } from './useCollapse'

import CollapseTransition from './collapse-transition.vue'
const props = defineProps<CollapseItemProps>()

defineSlots<{
    default: () => VNode
    headerRight: () => VNode
}>()
const { isActive, toggleActive } = useCollapseItem(props)
// 在元素被插入到 DOM 之前被调用
// 用这个来设置元素的 "enter-from" 状态
function onBeforeEnter(el) {
    console.log('onBeforeEnter')
    el.style.height = '0px'
}

// 在元素被插入到 DOM 之后的下一帧被调用
// 用这个来开始进入动画
function onEnter(el, done) {

    el.style.height = el.scrollHeight + 'px'
    // 调用回调函数 done 表示过渡结束
    // 如果与 CSS 结合使用，则这个回调是可选参数
    // done()
    console.log('onEnter', el.scrollHeight)
}

// 当进入过渡完成时调用。
function onAfterEnter(el) {
    console.log('onAfterEnter')
    el.style.height = 'auto'
}

// 当进入过渡在完成之前被取消时调用
function onEnterCancelled(el) {
      console.log('onEnterCancelled')
    el.style.height = 'auto'
 }

// 在 leave 钩子之前调用
// 大多数时候，你应该只会用到 leave 钩子
function onBeforeLeave(el) {
          console.log('onBeforeLeave')
    el.style.height = el.scrollHeight + 'px'
}

// 在离开过渡开始时调用
// 用这个来开始离开动画
function onLeave(el, done) {
          console.log('onLeave')
    el.style.height = '0px'
    // 调用回调函数 done 表示过渡结束
    // 如果与 CSS 结合使用，则这个回调是可选参数
    // done()
}

// 在离开过渡完成、
// 且元素已从 DOM 中移除时调用
function onAfterLeave(el) {
          console.log('onAfterLeave')
    el.style.height = 'auto'
}

// 仅在 v-show 过渡中可用
function onLeaveCancelled(el) { 
    console.log('onLeaveCancelled')

}
const transitionEvents:TransitionProps={
    onEnter:(el)=>{
        el.style.height = el.scrollHeight + 'px'
    },
    onAfterEnter:(el)=>{
        el.style.height = 'auto'
    },
    onBeforeLeave:(el)=>{
        el.style.height = el.scrollHeight + 'px'
    },
    onLeave:(el)=>{
        el.style.height ='0'
    },
}
</script>

<template>
    <div class="p-collapse-item rounded-sm border border-[#d7dae0]">
        <div class="p-4 flex bg-[#f8f9fa] box-border" :class="[isActive ? 'rounded-t-sm' : 'rounded-sm']">
            <div class="flex-none cursor-pointer" @click="toggleActive">
                <t-icon :class="[isActive ? 'rotate-[-90deg]' : '']" name="chevron-right"
                    class="transition-transform cursor-pointer"></t-icon>
            </div>
            <div class="flex-1 ml-4 text-base font-semibold">
                {{ header }}
            </div>
            <div class="flex-none">
                <slot name="headerRight"></slot>
            </div>
        </div>
        <transition name="collapse" v-bind="transitionEvents">
                <div v-show="isActive"  class="p-collapse-item-content overflow-hidde" >
                   <div class="bg-white box-border rounded-b-sm p-4"> <slot></slot></div>
                </div>
        </transition>
    </div>
</template>
<style>

 .collapse-enter-active,
.collapse-leave-active{
    transition: height 200ms cubic-bezier(0.34, 0.69, 0.1, 1);
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
}
.p-collapse-item-content{

}


</style>