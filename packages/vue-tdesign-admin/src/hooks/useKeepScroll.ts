import { onMounted, onBeforeUnmount, shallowRef, type ShallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash-es'

export type KeepScrollOptions = {
    element?: ShallowRef<HTMLElement | null>
    /** sessionStorage key 前缀，默认 'keep-scroll' */
    storagePrefix?: string
    /** 滚动监听节流间隔（ms），默认 200 */
    debounceWait?: number
}

const KEY_PREFIX = 'keep-scroll'

/**
 * 监听 DOM 元素的滚动位置，下次进入页面时自动恢复
 *
 * @example
 * const scrollRef = shallowRef<HTMLElement | null>(null)
 * useKeepScroll({ element: scrollRef })
 *
 * // 或在模板中配合 ref 使用
 * <div ref="scrollRef">
 */
export const useKeepScroll = (options: KeepScrollOptions = {}) => {
    const { storagePrefix = KEY_PREFIX, debounceWait = 200 } = options

    const route = useRoute()
    const storageKey = `${storagePrefix}:${route.path}`

    const elementRef = options.element ?? shallowRef<HTMLElement | null>(null)

    const saveScroll = debounce(() => {
        if (elementRef.value) {
            sessionStorage.setItem(storageKey, String(elementRef.value.scrollTop))
        }
    }, debounceWait)

    const restoreScroll = () => {
        const saved = sessionStorage.getItem(storageKey)
        if (saved !== null && elementRef.value) {
            elementRef.value.scrollTop = Number(saved)
        }
    }

    const handleScroll = () => {
        saveScroll()
    }

    onMounted(() => {
        restoreScroll()
        if (elementRef.value) {
            elementRef.value.addEventListener('scroll', handleScroll, { passive: true })
        }
    })

    onBeforeUnmount(() => {
        saveScroll.flush()
        if (elementRef.value) {
            elementRef.value.removeEventListener('scroll', handleScroll)
        }
    })

    return {
        elementRef,
        /** 清除已保存的滚动位置 */
        clear: () => {
            sessionStorage.removeItem(storageKey)
        },
        /** 手动恢复到保存的位置 */
        restore: restoreScroll,
    }
}
