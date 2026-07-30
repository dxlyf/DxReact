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

interface FiberNode{
  tag:FiberTag,
  key:any,
  type:any,
  elementType:any,
  index:number,
  ref:any,
  refCleanup:any,
  pendingProps:any,
  dependencies:any,
  memoizedState:any,
  updateQueue:any,
  memoizedProps:any,
  mode:any,
  subtreeFlags:any,
  flags:any,
  deletions:any,
  childLanes:any,
  lanes:any,
  alternate:FiberNode|null,

  sibling:FiberNode|null,
  child:FiberNode|null,
  return:FiberNode|null,
  stateNode:any,

}
interface FiberNodeConstructor{
  new(tag:FiberTag, pendingProps:any, key:any, mode:any):FiberNode
}
const FiberNodeClass:FiberNodeConstructor=function (this:FiberNode,tag:FiberTag, pendingProps:any, key:any, mode:any){
  this.tag = tag;
  this.key = key;
  this.sibling =
    this.child =
    this.return =
    this.stateNode =
    this.type =
    this.elementType =
      null;
  this.index = 0;
  this.refCleanup = this.ref = null;
  this.pendingProps = pendingProps;
  this.dependencies =
    this.memoizedState =
    this.updateQueue =
    this.memoizedProps =
      null;
  this.mode = mode;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
} as any

function createWorkInProgress(current:FiberNode,pendingProps:any){
  const alternate = current.alternate
  if(alternate){
    const workInProgress = createFiber(current.tag,pendingProps,current.key,current.mode)
    workInProgress.alternate = current
    return workInProgress
  }else{
    return createFiber(current.tag,pendingProps,current.key,current.mode)
  }
}
function createFiber(tag:FiberTag,pendingProps:any,key:any,mode:any){
  return new FiberNodeClass(tag,pendingProps,key,mode)
}
function beginWork(current:FiberNode|null,workInProgress:FiberNode,renderLanes?:any){

}
function completeWork(current:FiberNode|null,workInProgress:FiberNode,renderLanes?:any){

}
function completeUnitOfWork(unitOfWork:FiberNode){

}
function performUnitOfWork(unitOfWork:FiberNode){

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
