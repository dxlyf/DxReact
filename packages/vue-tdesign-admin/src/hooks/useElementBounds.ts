import { ref, unref, watch, onMounted, onUnmounted, type Ref, shallowReactive, toRefs, computed } from 'vue'
export type useElementBoundsProps = {
    windowScroll?: boolean // 是否监听窗口滚动
    windowResize?: boolean // 是否监听窗口大小变化
    elementResize?: boolean // 是否监听元素大小变化
    elementMutationDom?:HTMLElement|Ref<HTMLElement | null> // 监听的元素内容变化的DOM元素
    elementMutation?: boolean // 是否监听元素内容变化
    immediate?: boolean // 是否立即更新
    delay?: number // 更新延迟时间
    autoDetach?: boolean // 是否自动解绑
    mutationOptions?: MutationObserverInit | (() => MutationObserverInit)
}
export type useElementBoundsState = {
    top: number // 元素的顶部距离文档顶部的距离
    left: number // 元素的左侧距离文档左侧的距离
    right: number // 元素的右侧距离文档右侧的距离
    bottom: number // 元素的底部距离文档底部的距离
    width: number // 元素的宽度
    height: number // 元素的高度
    initial: boolean // 是否初始化完成
}
/**
 * 元素边界监听
 * @param element 元素引用
 * @param props 配置项
 * @returns 元素边界状态
 */
export const useElementBounds = (element: HTMLElement|Ref<HTMLElement | null>, props: useElementBoundsProps = {}) => {
    const { windowScroll = true,windowResize = true,elementMutationDom, elementResize = true,delay=-1, elementMutation = false, immediate = false, mutationOptions } = props
    const state = shallowReactive<useElementBoundsState>({
        initial: false,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
    })
    let refId: any = null
    const updateElementBounds = () => {
        const rect = unref(element)?.getBoundingClientRect()
        if (rect) {
            state.top = rect.top
            state.left = rect.left
            state.bottom = rect.bottom
            state.right = rect.right
            state.width = rect.width
            state.height = rect.height
            state.initial = true
        }
    }
    const requestUpdateElementBounds = () => {
        if (refId) {
            return
        }
        refId = window.requestAnimationFrame(() => {
            refId = null
            updateElementBounds()
        })
    }
    watch(() => unref(element), (val) => {
        if (val) {
            if(delay>0){
                setTimeout(()=>{
                    requestUpdateElementBounds()
                },delay)
            }else{
                requestUpdateElementBounds()
            }
            
        }
    }, { immediate: immediate, flush: "post" })

    let _observer: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let setupResizeObserver = () => {
        _observer = new ResizeObserver(() => {
            requestUpdateElementBounds()
        })
        _observer.observe(unref(element) as HTMLElement)
    }
    let setupMutationObserver = () => {
        const mutationDom = unref(elementMutationDom)
        const options = typeof mutationOptions === 'function' ? mutationOptions() : mutationOptions
        mutationObserver = new MutationObserver(() => {
            requestUpdateElementBounds()
        })
        mutationObserver.observe(mutationDom?mutationDom:unref(element) as HTMLElement, {
            attributes: false,
            childList: true,
            subtree: true,
            ...(options ? options : {})

        })
    }
    const attachObserver = () => {
        if (windowResize) {
            window.addEventListener("resize", requestUpdateElementBounds)
        }
        if (windowScroll) {
            window.addEventListener("scroll", requestUpdateElementBounds, { passive: true })
        }
        if (elementMutation) {
            setupMutationObserver()
        }
        if (elementResize) {
            setupResizeObserver()
        }
    }
    const detachObserver = () => {
        if (windowResize) {
            window.removeEventListener("resize", requestUpdateElementBounds)
        }
        if (windowScroll) {
            window.removeEventListener("scroll", requestUpdateElementBounds)
        }
        if (elementMutation) {
            mutationObserver?.disconnect()
        }
        if (_observer) {
            _observer.disconnect()
        }
    }
    onMounted(() => {
        updateElementBounds()
        attachObserver()

    })
    onUnmounted(() => {
        detachObserver()
    })
    return {
        ...toRefs(state),
        requestUpdateElementBounds,
        attachObserver,
        detachObserver,
    } as const
}
