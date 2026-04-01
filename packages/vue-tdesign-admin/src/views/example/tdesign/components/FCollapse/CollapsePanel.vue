<script setup lang="ts">
import { type VNode, getCurrentInstance, ref, provide, inject } from 'vue'
import { type CollapseItemProps, useCollapseItem } from './useCollapse'


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
        <transition name="collapse" >
            <div v-if="isActive" class="collapse-item-wrap">
                <div class="bg-white p-4 box-border rounded-b-sm" :class="[contentClass ? contentClass : '']">
                    <slot></slot>
                </div>
            </div>
        </transition>
    </div>
</template>
<style>

.collapse-item-wrap{
    display: grid;
    overflow: hidden;
    grid-template-rows: 1fr;
    will-change: transform,grid-template-rows,height;

}
.collapse-item-wrap>div{
    min-height: 0px;
}
.collapse-leave-active,
.collapse-enter-active{
    transition: grid-template-rows 150ms cubic-bezier(0,.6,0,1);
   
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
}


</style>