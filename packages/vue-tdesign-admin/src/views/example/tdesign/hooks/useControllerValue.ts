import { shallowRef, watch, getCurrentInstance, computed } from 'vue'
type Options = {
    valueField?: string
    modelValueField?: string
    defaultValue?: any
    onChange?: (value: any) => void
}
export function useControllerValue(props: any, options: Options) {
    const { valueField, modelValueField, defaultValue, onChange } = options
    const instance = getCurrentInstance()
    const proxy = instance?.proxy

    const isValueControlled =Object.prototype.hasOwnProperty.call(props, valueField)
    const isModelValueControlled =Object.prototype.hasOwnProperty.call(props, valueField)

    const geInitialValue = () => {
        if (isValueControlled) {
            return props[modelValueField]
        }
        if (isModelValueControlled) {
            return props[modelValueField]
        }
        return defaultValue
    }
    const controlValue = shallowRef(geInitialValue())
    const setValue = (value: any) => {
        if (isValueControlled) {
            onChange?.(value)
        } else if (isModelValueControlled) {
            onChange?.(value)
            proxy.$emit('update:modelValue', value)
        }else{
            controlValue.value=value
            onChange?.(value)
        }
    }
    const value = computed(() => {
        const _isValueControlled = isValueControlled
        const _isModelValueControlled = isModelValueControlled
        const _value = controlValue.value
        if (_isValueControlled) {
            return props[modelValueField]
        }
        if (_isModelValueControlled) {
            return props[modelValueField]
        }
        return _value
    })
    return [value, setValue] as const

}
