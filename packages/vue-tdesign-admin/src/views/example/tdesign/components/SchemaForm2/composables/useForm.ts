import { computed, ref, toValue, unref, type MaybeRefOrGetter } from 'vue'

export type UseFormProps<T> = {
    defaultValue: T
}
const isUndefined = (val: any) => val === undefined
const isNullOrUndefined = (val: any) => isUndefined(val) || val === null
const isObject = (val: any) => {
    return typeof val === 'object' && val !== null
}
const setDeepValue = (obj: any, path: (string | number)[], value: any) => {
    if (path.length <= 0) {
        return
    }
    if (path.length === 1) {
        obj[path[0]] = value
        return
    }
    let currentObj = obj;
    for (let i = 0; i < path.length; i++) {
        const key = path[i]
        if (!isObject(currentObj[key])) {
            currentObj = typeof path[i + 1] === 'number' ? [] : {}
        } else {
            currentObj = currentObj[key]
        }
    }
    currentObj[path[path.length - 1]] = value
}
export const useForm = <T = any>(props: MaybeRefOrGetter<UseFormProps<T>>) => {
    const propsValue = computed(() => toValue(props))

    const formValue = ref(propsValue.value.defaultValue)



}