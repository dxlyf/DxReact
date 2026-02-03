
import { ref, toRef, shallowReadonly, isReactive, type ShallowReactive, type MaybeRef, computed, shallowReactive, watchEffect, onBeforeMount } from "vue";
import type { PrimaryTableProps } from 'tdesign-vue-next'
import { type UseRequestProps, useRequest } from './useRequest'
import data from "tdesign-icons-vue-next/lib/components/data";

export type TableDataResult<T> = {
    records: T[],
    total: number
}
export type UseTableProps<T> = {
    manualRequest?: boolean
    service: (params: any) => Promise<TableDataResult<T>>
    tableProps?: ShallowReactive<Omit<PrimaryTableProps,'rowKey'>> | Omit<PrimaryTableProps,'rowKey'>
    pageSizeField?: string
    pageCurrentField?: string
}

export const useTable = <T>(props: UseTableProps<T>) => {
    const { manualRequest=false,service, tableProps: propTableProps, pageSizeField = 'pageSize', pageCurrentField = 'current' } = props

    const needPagination = computed(() => propTableProps.pagination ? true : false)
    const paginationInfo = shallowReactive({
        current: propTableProps.pagination?.defaultCurrent ?? 1,
        pageSize: propTableProps.pagination?.defaultPageSize ?? 10,
    })
    const [reqState, reqUtil] = useRequest<TableDataResult<T>>({
        manualRequest: true,
        defaultValue: {
            records: [],
            total: 0,
        },
        service: async (params: any = {}) => {
            const { current, pageSize, ...restParams } = params
            const newParams = {
                ...restParams,
                ...(needPagination.value ? {
                    [pageSizeField]: pageSize,
                    [pageCurrentField]: current,
                } : {}),
            }
            if (needPagination.value) {
                paginationInfo.current = current
                paginationInfo.pageSize = pageSize
            }
            const res = await service(newParams)
            return res
        }
    })
    const request = (params: any = {}) => {
        return reqUtil.request({
            ...params,
            ...(needPagination.value ? {
                pageSize: paginationInfo.pageSize,
                current: 1,
            } : {}),
        })
    }
    const refresh = (params: any = {}) => {
        return reqUtil.refresh({
            ...params,
            ...(needPagination.value ? {
                pageSize: paginationInfo.pageSize,
                current: paginationInfo.current,
            } : {}),
        })
    }

    const onTableChange: PrimaryTableProps['onChange'] = (data) => {
        if (needPagination.value) {
            paginationInfo.current = data.pagination?.current ?? paginationInfo.current
            paginationInfo.pageSize = data.pagination?.pageSize ?? paginationInfo.pageSize
        }
        refresh()
    }
    const tableProps = computed(() => {
        return {
            rowKey:'id',
            bordered: true,
            data: reqState.data.records,
            empty: '暂无数据',
            loading: reqState.loading,
            onChange: onTableChange,
            ...propTableProps,
            ...(needPagination.value ? {
                pagination: {
                    ...propTableProps.pagination,
                    current: paginationInfo.current,
                    pageSize: paginationInfo.pageSize,
                    total: reqState.data.total,
                },
            } : {}),
        }
    })
    onBeforeMount(()=>{
        if(!manualRequest){
            request()
        }
    })
    return [tableProps, { request, refresh }] as const
}