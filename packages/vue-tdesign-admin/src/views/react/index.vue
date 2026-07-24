<script setup lang="ts">
import { ref, onMounted } from 'vue';

const appRef = ref<HTMLDivElement>()
type ReactElement={
  type:any,
  key:any,
  ref:any,
  props:any
}
function createElement(type: any, config: any, ...children: any[]) {
  const props: any = {}
  let key: any = null, ref: any = null
  if (config) {
    for (const [name, value] of Object.entries(config)) {
      if (name === 'key') {
        key = value + ''
      } else if (name === 'ref') {
        ref = value
      } else {
        props[name] = value
      }
    }
  }
  return {
    type,
    key,
    ref,
    props
  } as ReactElement
}
type FiberTag='hostRoot'|'hostComponent'|'hostText'|'functionComponent'

type Fiber={
  tag:FiberTag,
  state:any,
  props:any,
  children:any,
  sibling:any,
  return:any,
}
function createFiber(tag:FiberTag,pendingProps:any){
  return {
    tag,
    state:null,
    props:pendingProps,
    children:null,
    sibling:null,
    return:null
  }
}
function beginWork(current:Fiber|null,workInProgress:Fiber,renderLanes?:any){

}
function completeWork(current:Fiber|null,workInProgress:Fiber,renderLanes?:any){

}
function completeUnitOfWork(unitOfwork:Fiber){

}
function performUnitOfWork(unitOfwork:Fiber){

}
function workLoop(){

}
function render(element: ReactElement, container: HTMLDivElement) {
  container.appendChild(element)
}
onMounted(() => {
  render(
    createElement('div',{},'hello world'),
    appRef.value!
  )
})
</script>

<template>
  <div ref="appRef">
  </div>
</template>
