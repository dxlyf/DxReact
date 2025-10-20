
export const REACT_LEGACY_ELEMENT_TYPE= Symbol.for('react.element');
export const REACT_ELEMENT_TYPE= Symbol.for('react.transitional.element')
export const REACT_PORTAL_TYPE= Symbol.for('react.portal');
export const REACT_FRAGMENT_TYPE= Symbol.for('react.fragment');
export const REACT_STRICT_MODE_TYPE= Symbol.for('react.strict_mode');
export const REACT_PROFILER_TYPE= Symbol.for('react.profiler');
export const REACT_CONSUMER_TYPE= Symbol.for('react.consumer');
export const REACT_CONTEXT_TYPE= Symbol.for('react.context');
export const REACT_FORWARD_REF_TYPE= Symbol.for('react.forward_ref');
export const REACT_SUSPENSE_TYPE= Symbol.for('react.suspense');
export const REACT_SUSPENSE_LIST_TYPE= Symbol.for('react.suspense_list',);
export const REACT_MEMO_TYPE= Symbol.for('react.memo');
export const REACT_LAZY_TYPE= Symbol.for('react.lazy');
export const REACT_SCOPE_TYPE= Symbol.for('react.scope');
export const REACT_ACTIVITY_TYPE= Symbol.for('react.activity');
export const REACT_LEGACY_HIDDEN_TYPE= Symbol.for('react.legacy_hidden',);
export const REACT_TRACING_MARKER_TYPE= Symbol.for('react.tracing_marker',);

export const REACT_MEMO_CACHE_SENTINEL= Symbol.for('react.memo_cache_sentinel',);

export const REACT_POSTPONE_TYPE= Symbol.for('react.postpone');

export const REACT_VIEW_TRANSITION_TYPE= Symbol.for('react.view_transition',);

const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

export function getIteratorFn(maybeIterable){
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }
  return null;
}

export const ASYNC_ITERATOR = Symbol.asyncIterator;


export const FunctionComponent = 0;
export const ClassComponent = 1;
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;
export const TracingMarkerComponent = 25;
export const HostHoistable = 26;
export const HostSingleton = 27;
export const IncompleteFunctionComponent = 28;
export const Throw = 29;
export const ViewTransitionComponent = 30;
export const ActivityComponent = 31;





// Don't change these values. They're used by React Dev Tools.
export const NoFlags = /*                      */ 0b0000000000000000000000000000000;
export const PerformedWork = /*                */ 0b0000000000000000000000000000001;
export const Placement = /*                    */ 0b0000000000000000000000000000010;
export const DidCapture = /*                   */ 0b0000000000000000000000010000000;
export const Hydrating = /*                    */ 0b0000000000000000001000000000000;

// You can change the rest (and add more).
export const Update = /*                       */ 0b0000000000000000000000000000100;
export const Cloned = /*                       */ 0b0000000000000000000000000001000;

export const ChildDeletion = /*                */ 0b0000000000000000000000000010000;
export const ContentReset = /*                 */ 0b0000000000000000000000000100000;
export const Callback = /*                     */ 0b0000000000000000000000001000000;
/* Used by DidCapture:                            0b0000000000000000000000010000000; */

export const ForceClientRender = /*            */ 0b0000000000000000000000100000000;
export const Ref = /*                          */ 0b0000000000000000000001000000000;
export const Snapshot = /*                     */ 0b0000000000000000000010000000000;
export const Passive = /*                      */ 0b0000000000000000000100000000000;
/* Used by Hydrating:                             0b0000000000000000001000000000000; */

export const Visibility = /*                   */ 0b0000000000000000010000000000000;
export const StoreConsistency = /*             */ 0b0000000000000000100000000000000;

// It's OK to reuse these bits because these flags are mutually exclusive for
// different fiber types. We should really be doing this for as many flags as
// possible, because we're about to run out of bits.
export const Hydrate = Callback;
export const ScheduleRetry = StoreConsistency;
export const ShouldSuspendCommit = Visibility;
export const ViewTransitionNamedMount = ShouldSuspendCommit;
export const DidDefer = ContentReset;
export const FormReset = Snapshot;
export const AffectedParentLayout = ContentReset;

export const LifecycleEffectMask =
  Passive | Update | Callback | Ref | Snapshot | StoreConsistency;

// 所有提交标志的联合（具有特定提交生命周期的标志）
export const HostEffectMask = /*               */ 0b0000000000000000111111111111111;

// 这些并不是真正的副作用，但我们仍然重用这个字段。
export const Incomplete = /*                   */ 0b0000000000000001000000000000000;
export const ShouldCapture = /*                */ 0b0000000000000010000000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b0000000000000100000000000000000;
export const DidPropagateContext = /*          */ 0b0000000000001000000000000000000;
export const NeedsPropagation = /*             */ 0b0000000000010000000000000000000;
export const Forked = /*                       */ 0b0000000000100000000000000000000;

// 静态标签描述了不特定于渲染的纤维的各个方面，
// 例如纤维使用被动效果（即使此特定渲染没有更新）。
// 这使我们能够在卸载情况下推迟更多工作，
// 因为我们可以在布局期间推迟遍历树来寻找被动效果，
// 而是依赖静态标志作为可能进行清理工作的信号。
export const SnapshotStatic = /*               */ 0b0000000001000000000000000000000;
export const LayoutStatic = /*                 */ 0b0000000010000000000000000000000;
export const RefStatic = LayoutStatic;
export const PassiveStatic = /*                */ 0b0000000100000000000000000000000;
export const MaySuspendCommit = /*             */ 0b0000001000000000000000000000000;
// ViewTransitionNamedStatic 深入跟踪显式名称 ViewTransition 组件
// 清理期间可能需要访问。这与 SnapshotStatic 类似
// 如果它还有其他用途的话。它还需要在同一阶段运行
// 可以暂停提交跟踪。
export const ViewTransitionNamedStatic =
  /*    */ SnapshotStatic | MaySuspendCommit;
// ViewTransitionStatic 跟踪是否有来自 ViewTransition 的组件
// 最近的 HostComponent 向下。它会在每个 HostComponent 级别重置。
export const ViewTransitionStatic = /*         */ 0b0000010000000000000000000000000;

// 用于识别新插入光纤的标志。与“Placement”不同，它在提交后不会重置
export const PlacementDEV = /*                 */ 0b0000100000000000000000000000000;
export const MountLayoutDev = /*               */ 0b0001000000000000000000000000000;
export const MountPassiveDev = /*              */ 0b0010000000000000000000000000000;

// 在提交阶段用于跳过树的标志组
// 通过检查 subtreeFlags 不包含效果。

// export const BeforeMutationMask =
//   Snapshot |
//   (enableCreateEventHandleAPI
//     ? // createEventHandle needs to visit deleted and hidden trees to
//       // fire beforeblur
//       // TODO: Only need to visit Deletions during BeforeMutation phase if an
//       // element is focused.
//       Update | ChildDeletion | Visibility
//     : enableUseEffectEventHook
//       ? // TODO: The useEffectEvent hook uses the snapshot phase for clean up but it
//         // really should use the mutation phase for this or at least schedule an
//         // explicit Snapshot phase flag for this.
//         Update
//       : 0);

// 对于视图转换支持，我们使用快照阶段来扫描树以查找潜在的
// 受影响的 ViewTransition 组件。
export const BeforeAndAfterMutationTransitionMask =
  Snapshot | Update | Placement | ChildDeletion | Visibility | ContentReset;

export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility |
  FormReset;
export const LayoutMask = Update | Callback | Ref | Visibility;

// TODO: Split into PassiveMountMask and PassiveUnmountMask
export const PassiveMask = Passive | Visibility | ChildDeletion;

// 对于视图转换，我们需要访问我们在快照阶段访问过的任何内容
// 提交转换后恢复视图转换名称。
export const PassiveTransitionMask = PassiveMask | Update | Placement;

// 不会在克隆上重置的标签联合。
// 这允许某些概念持续存在而无需重新计算它们，
// 例如子树是否包含被动效果或门户。
export const StaticMask =
  LayoutStatic |
  PassiveStatic |
  RefStatic |
  MaySuspendCommit |
  ViewTransitionStatic |
  ViewTransitionNamedStatic;


function FiberNode(tag,
  pendingProps,
  key,
  mode,
) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;
  this.refCleanup = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;



}
function createFiber(
  tag,
  pendingProps,
  key,
  mode,
) {
  // $FlowFixMe[invalid-constructor]: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
}


// This is used to create an alternate fiber to do work on.
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;


    workInProgress.pendingProps = pendingProps;
    // Needed because Blocks store data on type.
    workInProgress.type = current.type;

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.flags = NoFlags;

    // The effects are no longer valid.
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;

  }

  // Reset all effects except static ones.
  // Static effects are not specific to a render.
  workInProgress.flags = current.flags & StaticMask;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
        lanes: currentDependencies.lanes,
        firstContext: currentDependencies.firstContext,
      };

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.refCleanup = current.refCleanup;


  return workInProgress;
}


// Used to reuse a Fiber for a second pass.
export function resetWorkInProgress(
  workInProgress,
  renderLanes,
) {
//这会将 Fiber 重置为 createFiber 或 createWorkInProgress 的状态
  //在第一次传递期间将值设置为之前的值。理想情况下这不会
  //是必要的，但不幸的是许多代码路径从 workInProgress 读取
  //当他们应该从 current 读取并写入 workInProgress 时。

  //我们假设pendingProps、index、key、ref、return 仍然保持不变
  //避免再次进行协调。
//重置效果标志但保留任何放置标记，因为那是东西
  //正在设置子纤维，而不是调节。
  workInProgress.flags &= StaticMask | Placement;

  // The effects are no longer valid.

  const current = workInProgress.alternate;
  if (current === null) {
    // Reset to createFiber's initial values.
    workInProgress.childLanes = NoLanes;
    workInProgress.lanes = renderLanes;

    workInProgress.child = null;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.memoizedProps = null;
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    workInProgress.dependencies = null;

    workInProgress.stateNode = null;

  } else {
    // Reset to the cloned values that createWorkInProgress would've.
    workInProgress.childLanes = current.childLanes;
    workInProgress.lanes = current.lanes;

    workInProgress.child = current.child;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    // Needed because Blocks store data on type.
    workInProgress.type = current.type;

    // Clone the dependencies object. This is mutated during the render phase, so
    // it cannot be shared with the current fiber.
    const currentDependencies = current.dependencies;
    workInProgress.dependencies =
      currentDependencies === null
        ? null
        : {
              lanes: currentDependencies.lanes,
              firstContext: currentDependencies.firstContext,
            };
  }

  return workInProgress;
}

function createHostRootFiber(
  tag,
  isStrictMode,
) {
  let mode;
  if (disableLegacyMode || tag === ConcurrentRoot) {
    mode = ConcurrentMode;
    if (isStrictMode === true) {
      mode |= StrictLegacyMode | StrictEffectsMode;
    }
  } else {
    mode = NoMode;
  }


  return createFiber(HostRoot, null, null, mode);
}
function shouldConstruct(Component) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}
// TODO: Get rid of this helper. Only createFiberFromElement should exist.
function createFiberFromTypeAndProps(
  type, // React$ElementType
  key,
  pendingProps,
  owner,
  mode,
  lanes,
) {
  let fiberTag = FunctionComponent;
  // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
  let resolvedType = type;
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent;
    } else {

    }
  } else if (typeof type === 'string') {
    // 是否支持script,html
    // if (supportsResources && supportsSingletons) {
    //   const hostContext = getHostContext();
    //   fiberTag = isHostHoistableType(type, pendingProps, hostContext)
    //     ? HostHoistable
    //     : isHostSingletonType(type)
    //       ? HostSingleton
    //       : HostComponent;
    // } else if (supportsResources) {
    //   const hostContext = getHostContext();
    //   fiberTag = isHostHoistableType(type, pendingProps, hostContext)
    //     ? HostHoistable
    //     : HostComponent;
    // } else if (supportsSingletons) {
    //   fiberTag = isHostSingletonType(type) ? HostSingleton : HostComponent;
    // } else {
    //   fiberTag = HostComponent;
    // }
    fiberTag = HostComponent;
  } else {
    getTag: switch (type) {
      case REACT_ACTIVITY_TYPE:
        return createFiberFromActivity(pendingProps, mode, lanes, key);
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(pendingProps.children, mode, lanes, key);
      case REACT_STRICT_MODE_TYPE:
        fiberTag = Mode;
        mode |= StrictLegacyMode;
        if (disableLegacyMode || (mode & ConcurrentMode) !== NoMode) {
          // Strict effects should never run on legacy roots
          mode |= StrictEffectsMode;
        }
        break;
      case REACT_PROFILER_TYPE:
        return createFiberFromProfiler(pendingProps, mode, lanes, key);
      case REACT_SUSPENSE_TYPE:
        return createFiberFromSuspense(pendingProps, mode, lanes, key);
      case REACT_SUSPENSE_LIST_TYPE:
        return createFiberFromSuspenseList(pendingProps, mode, lanes, key);
      case REACT_LEGACY_HIDDEN_TYPE:
        if (enableLegacyHidden) {
          return createFiberFromLegacyHidden(pendingProps, mode, lanes, key);
        }
      // Fall through
      case REACT_VIEW_TRANSITION_TYPE:
        if (enableViewTransition) {
          return createFiberFromViewTransition(pendingProps, mode, lanes, key);
        }
      // Fall through
      case REACT_SCOPE_TYPE:
        if (enableScopeAPI) {
          return createFiberFromScope(type, pendingProps, mode, lanes, key);
        }
      // Fall through
      case REACT_TRACING_MARKER_TYPE:
        if (enableTransitionTracing) {
          return createFiberFromTracingMarker(pendingProps, mode, lanes, key);
        }
      // Fall through
      default: {
        if (typeof type === 'object' && type !== null) {
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              fiberTag = ContextProvider;
              break getTag;
            case REACT_CONSUMER_TYPE:
              fiberTag = ContextConsumer;
              break getTag;
            // Fall through
            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef;
              break getTag;
            case REACT_MEMO_TYPE:
              fiberTag = MemoComponent;
              break getTag;
            case REACT_LAZY_TYPE:
              fiberTag = LazyComponent;
              resolvedType = null;
              break getTag;
          }
        }
        let info = '';
        let typeString;

        typeString = type === null ? 'null' : typeof type;


        // The type is invalid but it's conceptually a child that errored and not the
        // current component itself so we create a virtual child that throws in its
        // begin phase. This is the same thing we do in ReactChildFiber if we throw
        // but we do it here so that we can assign the debug owner and stack from the
        // element itself. That way the error stack will point to the JSX callsite.
        fiberTag = Throw;
        pendingProps = new Error(
          'Element type is invalid: expected a string (for built-in ' +
          'components) or a class/function (for composite components) ' +
          `but got: ${typeString}.${info}`,
        );
        resolvedType = null;
      }
    }
  }

  const fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.lanes = lanes;



  return fiber;
}

function createFiberFromElement(
  element,
  mode,
  lanes,
) {
  let owner = null;

  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    lanes,
  );

  return fiber;
}

function createFiberFromFragment(
  elements,
  mode,
  lanes,
  key,
) {
  const fiber = createFiber(Fragment, elements, key, mode);
  fiber.lanes = lanes;
  return fiber;
}
function createFiberFromText(
  content,
  mode,
  lanes,
) {
  const fiber = createFiber(HostText, content, null, mode);
  fiber.lanes = lanes;
  return fiber;
}
export function createFiberFromPortal(
  portal,
  mode,
  lanes,
) {
  const pendingProps = portal.children !== null ? portal.children : [];
  const fiber = createFiber(HostPortal, pendingProps, portal.key, mode);
  fiber.lanes = lanes;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null, // Used by persistent updates
    implementation: portal.implementation,
  };
  return fiber;
}
export {
  createFiberFromPortal,
  createFiberFromFragment,
  createFiberFromElement,
  createFiberFromText,
  createFiberFromTypeAndProps,
  createHostRootFiber,
  createWorkInProgress,
  createFiber,
  FiberNode
}