import { type MaybeRefOrGetter, ref, onMounted, onUnmounted, toValue, watch, Ref, MaybeRef, unref, toRaw } from 'vue'

export type UseTitleOptions = {
    restoreOnUnmount?: boolean
    delay?: number
}
export const useTitle2 = (title: MaybeRefOrGetter<string>, options: UseTitleOptions = { restoreOnUnmount: true }) => {
    const { restoreOnUnmount = true, delay = -1 } = options
    const titleRef = ref(document.title)
    let timeId: any = 0
    const updatePageTitle = () => {
        document.title = toValue(title)
    }
    onMounted(() => {
        if (delay >= 0) {
            timeId = setTimeout(() => {
                updatePageTitle()
            }, delay)
        } else {
            updatePageTitle()
        }
    })
    watch(() => toValue(title), () => {
        updatePageTitle()
    }, {
        flush: 'post'
    })
    onUnmounted(() => {
        clearTimeout(timeId)
        if (restoreOnUnmount) {
            document.title = titleRef.value
        }
    })
}

export const useTitle = (title: MaybeRef<string>, options: UseTitleOptions = {}) => {
    const { restoreOnUnmount = true } = options
    const titleRef = ref(document.title)
    const updatePageTitle = () => {
        document.title = unref(title)
    }

    onMounted(updatePageTitle)
    watch(() => unref(title), () => {
        updatePageTitle()
    }, {
        flush: 'post'
    })
    onUnmounted(() => {
        if (restoreOnUnmount) {
            document.title = titleRef.value
        }
    })

}