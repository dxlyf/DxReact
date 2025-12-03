
export type RefObject<T=any>={
    current:T|null
}
export type RefFunction<T=any>=(instance:T|null)=>void
export type Ref<T=any>=RefObject<T>|RefFunction<T>

export type VNodeProps={
    [key:string]:any
    children?:VNodeChild|VNodeChild[]
}
export type ElementType=string|FunctionComponent
export type FunctionComponent<P=any>=(props:P)=>VNodeChild

export type VTextNode=string|boolean|number|null|undefined
export type VNodeChild=VNode|VTextNode
export type VNode={
    ref:Ref|null,
    key:string|null,
    type:ElementType,
    props:VNodeProps
}


export const Fragment=Symbol('Fragment')

export const FiberTags={
    FunctionalComponent:0,
    HostRoot:3,
    HostComponent:5,
    HostText:6,
}
export type FiberTag=typeof FiberTags[keyof typeof FiberTags]

export type Fiber={
    
      // Tag identifying the type of fiber.
      tag: FiberTag,
    
      // Unique identifier of this child.
      key: null | string,
    
      // The value of element.type which is used to preserve the identity during
      // reconciliation of this child.
      elementType: any,
    
      // The resolved function/class/ associated with this fiber.
      type: any,
    
      // The local state associated with this fiber.
      stateNode: any,
    
      // Conceptual aliases
      // parent : Instance -> return The parent happens to be the same as the
      // return fiber since we've merged the fiber and instance.
    
      // Remaining fields belong to Fiber
    
      // The Fiber to return to after finishing processing this one.
      // This is effectively the parent, but there can be multiple parents (two)
      // so this is only the parent of the thing we're currently processing.
      // It is conceptually the same as the return address of a stack frame.
      return: Fiber | null,
    
      // Singly Linked List Tree Structure.
      child: Fiber | null,
      sibling: Fiber | null,
      index: number,
    
      // The ref last used to attach this node.
      // I'll avoid adding an owner field for prod and model that as functions.
      ref:Ref|null,
    
      refCleanup: null | (() => void),
    
      // Input is the data coming into process this fiber. Arguments. Props.
      pendingProps: any, // This type will be more specific once we overload the tag.
      memoizedProps: any, // The props used to create the output.
    
      // A queue of state updates and callbacks.
      updateQueue: mixed,
    
      // The state used to create the output
      memoizedState: any,
    
      // Dependencies (contexts, events) for this fiber, if it has any
      dependencies: Dependencies | null,
    
      // Bitfield that describes properties about the fiber and its subtree. E.g.
      // the ConcurrentMode flag indicates whether the subtree should be async-by-
      // default. When a fiber is created, it inherits the mode of its
      // parent. Additional flags can be set at creation time, but after that the
      // value should remain unchanged throughout the fiber's lifetime, particularly
      // before its child fibers are created.
      mode: TypeOfMode,
    
      // Effect
      flags: Flags,
      subtreeFlags: Flags,
      deletions: Array<Fiber> | null,
    
      lanes: Lanes,
      childLanes: Lanes,
    
      // This is a pooled version of a Fiber. Every fiber that gets updated will
      // eventually have a pair. There are cases when we can clean up pairs to save
      // memory if we need to.
      alternate: Fiber | null,
}