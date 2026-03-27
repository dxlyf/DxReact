import { computed, ref, shallowRef, toRaw, toValue, watch } from 'vue'
import type { TdSelectProps } from 'tdesign-vue-next'
import { debounce } from 'lodash-es'
export type UseSelectProps<T> = {
    debounce?: number // 延迟时间
    serverFilter?: boolean // 是否服务器端过滤
    multiple?: boolean // 是否支持多选
    manualRequest?:boolean // 是否手动请求
    request?: (keyword: string) => Promise<T[]> // 请求函数
} & Partial<TdSelectProps>
export type Option = {
    label?: string | number | boolean
    value?: string | number | boolean
    disabled?: boolean
    [key: string]: any
}
export const useSelect = <T extends Option>(tProps: UseSelectProps<T> | (() => UseSelectProps<T>)) => {
    const props = computed(() => {
        return {
            debounce: 100,
            serverFilter: true,
            manualRequest:false,
            keys: {
                label: 'label',
                value: 'value',
                disabled: 'disabled',
            },
            ...(typeof tProps === 'function' ? tProps() : tProps)
        }
    })
    const isRemote = computed(() => {
        return !!props.value.request
    })
    const getItemLabel = (item: T) => {
        return item[props.value.keys.label]
    }
    const getItemValue = (item: T) => {
        return item[props.value.keys.value]
    }
    let valueSet = new Set()
    const options = shallowRef<T[]>([])
    const loading = shallowRef(false)
    const keyword = shallowRef<string>('')
    const loadData = async (force:boolean=false) => {
        try {
            loading.value = true
            options.value = []
            valueSet.clear()
            if (!force&&keyword.value.length === 0) {
                return
            }
            const data = await props.value.request(keyword.value)
            options.value = Array.isArray(data)?data:[]
            options.value.forEach(item => {
                valueSet.add(getItemValue(item))
            })
        } catch (err) {
            console.error(err)
        } finally {
            loading.value = false
        }
    }
    let debounceLoadData = debounce(loadData, props.value.debounce)
    watch(() => props.value.debounce, (val) => {
        debounceLoadData = debounce(loadData, val)
    })
    const isEmptyData = computed(() => {
        const _loading = loading.value
        const _options = options.value
        const _keyword = keyword.value
        return _options.length === 0 && !_loading && _keyword.length !== 0
    })
    const onSearch = (filterValue: string) => {
        keyword.value = filterValue.trim()
        console.log('onSearch', keyword.value)
        debounceLoadData()
    }
    const onFilter = (filterWords: string, option: T) => {
        const label = String(getItemLabel(option)).toLowerCase()
        const value = String(getItemValue(option)).toLowerCase()
        const filterValue = filterWords.toLowerCase()
        return label.includes(filterValue) || value.includes(filterValue)
    }
    const displayOptions = computed(() => {
        if (props.value.valueType === 'object') {
            let valueArray = props.value.multiple ? Array.isArray(props.value.value) ? props.value.value : null : props.value.value ?  [props.value.value]:null
            if (valueArray) {                
                return valueArray.filter(item => {
                    return !valueSet.has(getItemValue(item))
                }).concat(options.value)
            }
            return options.value
        }
        return options.value
    })
    const selectProps = computed<TdSelectProps>(() => {
        const { request, debounce, serverFilter,manualRequest, ...restProps } = props.value
        
        return {
            clearable: true,
            ...(isRemote.value ? {
                loadingText: '加载中...',
                empty: isEmptyData.value ? '没有找到相关数据' : '暂无数据',
                options: displayOptions.value,
                loading: loading.value,
                // loadingText: '搜索中...',
            }:{}),
            ...(serverFilter?{
                onSearch,
                filterable: true,
            }:{
                filterable: true,
                filter: onFilter,
            }),
            ...restProps
        }
    })
    if(!props.value.manualRequest&&isRemote.value){
        loadData(true)
    }
    return [selectProps,{
        options,
        loading,
        loadData,
        debounceLoadData,
        request:()=>{
            return loadData(true)
        }
    }] as const
}
