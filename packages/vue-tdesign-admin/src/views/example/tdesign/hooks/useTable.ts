/**
 * 统一表格基本配置和便捷开发
 */
import { ref, reactive, shallowReactive, type MaybeRefOrGetter, computed, shallowRef, toValue } from 'vue'
import { type TableProps } from 'tdesign-vue-next'

export type PaginationParams = {
    current: number,
    pageSize?: number,
}
export type TableRequestParams = {
    [key: string]: any
} & Partial<PaginationParams>

export type TableResponse<T> = {
    success: boolean,
    records: T[],
    total: number,
}
export type UseTableProps<T> = {
    searchInstance?: any,// 搜索实例对象
    defaultParams?: TableRequestParams,// 默认请求参数
    manualRequest?: boolean,// 是否手动触发请求
    pagination?: false | {
        current?: number,
        pageSize?: number,
        total?: number,
        pageSizeOptions?: number[],
    },// 分页配置
    request: (params: TableRequestParams) => Promise<TableResponse<T>>,// 请求函数
    onSuccess?: (data: TableResponse<T>, params: TableRequestParams) => void,// 请求成功回调函数
    onFail?: (res: TableResponse<T> | unknown) => void,// 请求失败回调函数
    onComplete?: () => void,// 请求完成回调函数
    tableProps?: TableProps,// 表格配置
}

export const useTable = <T = any>(_props: MaybeRefOrGetter<UseTableProps<T>>) => {
    const props = computed(() => ({
        manualRequest: false,
        pagination: {},
        ...toValue(_props)
    }))
    const data = shallowRef<T[]>([])
    const loading = shallowRef<boolean>(false)
    const error = shallowRef<unknown>(null)
    const pagination = reactive({
        current: 1,
        pageSize: 25,
        total: 0,
        pageSizeOptions: [5, 10, 25, 50],
    })
    let lastParams: any = shallowRef({})
    const tableProps = computed(() => {
        let { pagination: propPagination, tableProps: propTableProps = {} } = props.value
        return {
            rowKey: 'id',
            disableDataPage: true,  
            ...(propPagination === false ? {} : {
                pagination: {
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    pageSizeOptions: pagination.pageSizeOptions,
                    onChange: (params) => {
                        console.log('pagination onChange', params)
                        pagination.current = params.current
                        pagination.pageSize = params.pageSize
                        refresh()
                    },
                    ...(propPagination || {}),
                } as TableProps['pagination']
            }),
            data: data.value,
            loading: loading.value,
            ...(propTableProps || {}),
        } as TableProps
    })
    const request = async (params: TableRequestParams = {}) => {
        let { request: propRequest, onSuccess, onFail, onComplete, pagination: propPagination } = props.value
        try {
            loading.value = true
            error.value = null
            if (propPagination !== false && typeof params.current === 'number') {
                pagination.current = params.current
            }
            if (propPagination !== false && typeof params.pageSize === 'number') {
                pagination.pageSize = params.pageSize
            }
            let newParams = {
                ...params,
            }
            lastParams.value = newParams
            const res = await propRequest({
                ...newParams,
                ...(propPagination === false ? {} : {
                    current: pagination.current,
                    pageSize: pagination.pageSize
                }),
            })
            if (res.success) {
                data.value = res.records
                pagination.total = res.total
                onSuccess?.(res, newParams)
            } else {
                onFail?.(res)
            }
            lastParams.value = newParams
        } catch (err) {
            error.value = err
            onFail?.(err)
        } finally {
            loading.value = false
            onComplete?.()
        }
    }
    const query = async (params: TableRequestParams = {}) => {
        pagination.current = 1
        request(params)
    }
    const refresh = async (params: TableRequestParams = {}) => {
        request({
            ...lastParams.value,
            ...params,
        })
    }
    if (!props.value.manualRequest) {
        query(props.value.defaultParams || {})
    }
    return [tableProps, {
        pagination,
        lastParams,
        data,
        loading,
        error,
        query,
        refresh,
    }] as const
}