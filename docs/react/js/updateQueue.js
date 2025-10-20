const UpdateState = 0;
const ReplaceState = 1;
const ForceUpdate = 2;
const CaptureUpdate = 3;

function initializeUpdateQueue(fiber) {
    const queue = {
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null,
            lanes: 0,
            hiddenCallbacks: null,
        },
        callbacks: null,
    };
    fiber.updateQueue = queue;
}

function createUpdate(lane) {
    const update = {
        lane,

        tag: UpdateState,
        payload: null,
        callback: null,

        next: null,
    };
    return update;
}

function enqueueUpdate(
    fiber,
    update,
    lane,
) {
    const updateQueue = fiber.updateQueue;
    if (updateQueue === null) {
        // Only occurs if the fiber has been unmounted.
        return null;
    }
    const sharedQueue = updateQueue.shared;
    const pending = sharedQueue.pending;
    if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    sharedQueue.pending = update;
    //  return unsafe_markUpdateLaneFromFiberToRoot(fiber, lane);
}

function getStateFromUpdate(
    workInProgress,
    queue,
    update,
    prevState,
    nextProps,
    instance,
) {
    switch (update.tag) {
        case ReplaceState: {
            const payload = update.payload;
            if (typeof payload === 'function') {
                const nextState = payload.call(instance, prevState, nextProps);
                return nextState;
            }
            // State object
            return payload;
        }
        case CaptureUpdate: {
            workInProgress.flags =
                (workInProgress.flags & ~ShouldCapture) | DidCapture;
        }
        // Intentional fallthrough
        case UpdateState: {
            const payload = update.payload;
            let partialState;
            if (typeof payload === 'function') {
                // Updater function
                partialState = payload.call(instance, prevState, nextProps);
            } else {
                // Partial state object
                partialState = payload;
            }
            if (partialState === null || partialState === undefined) {
                // Null and undefined are treated as no-ops.
                return prevState;
            }
            // Merge the partial state and the previous state.
            return assign({}, prevState, partialState);
        }
        case ForceUpdate: {
            hasForceUpdate = true;
            return prevState;
        }
    }
    return prevState;
}
function processUpdateQueue(workInProgress,
    props,
    instance,
    renderLanes) {
    const queue = workInProgress.updateQueue
    let firstBaseUpdate = queue.firstBaseUpdate;
    let lastBaseUpdate = queue.lastBaseUpdate;
    const pendingQueue = queue.shared.pending
    if (pendingQueue !== null) {
        queue.shared.pending = null
        let lastPendingUpdate = pendingQueue
        let firstPendingUpdate = lastPendingUpdate.next
        lastPendingUpdate.next = null
        if (firstBaseUpdate === null) {
            firstBaseUpdate = firstPendingUpdate
        } else {
            lastBaseUpdate.next = firstPendingUpdate;
        }
        lastBaseUpdate = lastPendingUpdate;


        const current = workInProgress.alternate;
        if (current !== null) {
            // This is always non-null on a ClassComponent or HostRoot
            const currentQueue = current.updateQueue;
            const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
            if (currentLastBaseUpdate !== lastBaseUpdate) {
                if (currentLastBaseUpdate === null) {
                    currentQueue.firstBaseUpdate = firstPendingUpdate;
                } else {
                    currentLastBaseUpdate.next = firstPendingUpdate;
                }
                currentQueue.lastBaseUpdate = lastPendingUpdate;
            }
        }
    }


    // These values may change as we process the queue.
    if (firstBaseUpdate !== null) {
        // Iterate through the list of updates to compute the result.
        let newState = queue.baseState;
        // TODO: Don't need to accumulate this. Instead, we can remove renderLanes
        // from the original lanes.
        let newLanes = NoLanes;

        let newBaseState = null;
        let newFirstBaseUpdate = null;
        let newLastBaseUpdate = null;

        let update = firstBaseUpdate;
        do {
            // An extra OffscreenLane bit is added to updates that were made to
            // a hidden tree, so that we can distinguish them from updates that were
            // already there when the tree was hidden.
            // const updateLane = removeLanes(update.lane, OffscreenLane);
            //const isHiddenUpdate = updateLane !== update.lane;

            // Check if this update was made while the tree was hidden. If so, then
            // it's not a "base" update and we should disregard the extra base lanes
            // that were added to renderLanes when we entered the Offscreen tree.
            // const shouldSkipUpdate = isHiddenUpdate
            //     ? !isSubsetOfLanes(getWorkInProgressRootRenderLanes(), updateLane)
            //     : !isSubsetOfLanes(renderLanes, updateLane);
            const shouldSkipUpdate = false
            if (shouldSkipUpdate) {
                // Priority is insufficient. Skip this update. If this is the first
                // skipped update, the previous update/state is the new base
                // update/state.
                const clone = {
                    lane: updateLane,

                    tag: update.tag,
                    payload: update.payload,
                    callback: update.callback,

                    next: null,
                };
                if (newLastBaseUpdate === null) {
                    newFirstBaseUpdate = newLastBaseUpdate = clone;
                    newBaseState = newState;
                } else {
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }
                // Update the remaining priority in the queue.
                newLanes = mergeLanes(newLanes, updateLane);
            } else {
                // This update does have sufficient priority.

                // 检查此更新是否是待处理异步操作的一部分。如果是这样，
                // 我们需要暂停直到操作完成，以便
                // 在同一操作中与未来的更新一起批处理。
                // if (updateLane !== NoLane && updateLane === peekEntangledActionLane()) {
                //     didReadFromEntangledAsyncAction = true;
                // }

                if (newLastBaseUpdate !== null) {
                    const clone = {
                        // 此更新将被提交，因此我们永远不想取消提交
                        // 它。使用 NoLane 是有效的，因为 0 是所有位掩码的子集，所以
                        // 上面的检查永远不会跳过这一点。
                        lane: NoLane,

                        tag: update.tag,
                        payload: update.payload,

                        // 当此更新被重新调整时，我们不应该触发它
                        // 再次回调
                        callback: null,

                        next: null,
                    };
                    newLastBaseUpdate = newLastBaseUpdate.next = clone;
                }

                // Process this update.
                newState = getStateFromUpdate(
                    workInProgress,
                    queue,
                    update,
                    newState,
                    props,
                    instance,
                );
                const callback = update.callback;
                if (callback !== null) {
                    workInProgress.flags |= Callback;
                    if (isHiddenUpdate) {
                        workInProgress.flags |= Visibility;
                    }
                    const callbacks = queue.callbacks;
                    if (callbacks === null) {
                        queue.callbacks = [callback];
                    } else {
                        callbacks.push(callback);
                    }
                }
            }
            // $FlowFixMe[incompatible-type] we bail out when we get a null
            update = update.next;
            if (update === null) {
                pendingQueue = queue.shared.pending;
                if (pendingQueue === null) {
                    break;
                } else {
                    // An update was scheduled from inside a reducer. Add the new
                    // pending updates to the end of the list and keep processing.
                    const lastPendingUpdate = pendingQueue;
                    // Intentionally unsound. Pending updates form a circular list, but we
                    // unravel them when transferring them to the base queue.
                    const firstPendingUpdate = lastPendingUpdate.next;
                    lastPendingUpdate.next = null;
                    update = firstPendingUpdate;
                    queue.lastBaseUpdate = lastPendingUpdate;
                    queue.shared.pending = null;
                }
            }
        } while (true);

        if (newLastBaseUpdate === null) {
            newBaseState = newState;
        }

        queue.baseState = newBaseState;
        queue.firstBaseUpdate = newFirstBaseUpdate;
        queue.lastBaseUpdate = newLastBaseUpdate;

        if (firstBaseUpdate === null) {
            // `queue.lanes` is used for entangling transitions. We can set it back to
            // zero once the queue is empty.
            //queue.shared.lanes = NoLanes;
        }

        // 将剩余过期时间设置为队列中剩余的时间。
        // 这应该没问题，因为只有另外两件事有助于
        // 过期时间是 props 和 context。我们已经在中间了
        // 当我们开始处理队列时开始阶段，所以我们已经
        // 处理了道具。指定组件中的上下文
        // shouldComponentUpdate 很棘手；但我们必须考虑到
        // 无论如何。
        //  markSkippedUpdateLanes(newLanes);
        //workInProgress.lanes = newLanes;
        workInProgress.memoizedState = newState;
    }

}
