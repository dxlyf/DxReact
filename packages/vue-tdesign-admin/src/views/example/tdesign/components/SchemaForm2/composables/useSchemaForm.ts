import { computed, shallowRef, toRaw, type WritableComputedRef, } from 'vue'
import { getDeepValue, setDeepValue, normalizeSchema, createItemBySchema, omitByPaths, removeDeepKey } from '../util'
import type { FormSchema, FieldPath, AllFieldSchema } from '../types'
import { watch } from 'fs'
import { PathStroke } from '@dxyl/math2'

export type UseSchemaForm = {
    value: any
    onChange?: (value: any) => void
}
export const USE_SCHEMA_CONTEXT_KEY = 'USE_Schema_CONTEXT_KEY'
const ROOT_KEY = 'root'
export const useSchemaForm = (props: UseSchemaForm) => {

    const localValue = shallowRef({
        [ROOT_KEY]: JSON.parse(JSON.stringify(props.value))
    })
    const hiddenPaths = shallowRef<string[]>([])

    const getValue = (path: FieldPath, defaultValue?: any) => {
        return getDeepValue(localValue.value, [ROOT_KEY, ...path], defaultValue)
    }
    const emitUpdate = (silent: boolean = false) => {
        const rootValue = omitByPaths(localValue.value[ROOT_KEY], hiddenPaths.value)
        const newData = Array.isArray(rootValue) ? [...rootValue] : { ...rootValue }
        localValue.value = {
            [ROOT_KEY]: newData
        }
        if (!silent) {
            props.onChange?.(newData)
        }
    }
    const setValue = (path: FieldPath, value: any, silent: boolean = false) => {
        setDeepValue(localValue.value, [ROOT_KEY, ...path], value)
        emitUpdate(silent)
    }
    const tempHiddenPaths: Record<string, any> = {}
    const removePath = (path: FieldPath) => {
        const paths = [ROOT_KEY, ...path]
        removeDeepKey(localValue.value, paths)
        emitUpdate()
    }
    const hidePath = (path: FieldPath) => {
        const paths = [ROOT_KEY, ...path]
        tempHiddenPaths[paths.join('.')] =paths.join('.')
        // getDeepValue(localValue.value, paths)
       // removeDeepKey(localValue.value, paths)
         addHiddenPaths([paths.join('.')])
        emitUpdate()
    }
    const restorePath = (path: FieldPath) => {
        const paths = [ROOT_KEY, ...path]
        const value=tempHiddenPaths[paths.join('.')]
        if (value!==undefined) {
            tempHiddenPaths[paths.join('.')]=undefined
            delete tempHiddenPaths[paths.join('.')]
            setDeepValue(localValue.value, paths, value)
            emitUpdate()
            
        }
    }

    const addHiddenPaths = (path: string[]) => {
        const newPaths = Array.from(new Set([...hiddenPaths.value, ...path]))
        hiddenPaths.value = newPaths
    }
    const removeHiddenPaths = (path: string[]) => {
        const newPaths = Array.from(new Set(hiddenPaths.value.filter(p => !path.includes(p))))
        hiddenPaths.value = newPaths
    }
    const value = computed(() => localValue.value[ROOT_KEY])

    const instance = {
        removePath,
        hidePath,
        restorePath,
        hiddenPaths,
        addHiddenPaths,
        removeHiddenPaths,
        value,
        getValue,
        setValue
    }
    return instance
}
export type UseSchemaFormInstance = ReturnType<typeof useSchemaForm>