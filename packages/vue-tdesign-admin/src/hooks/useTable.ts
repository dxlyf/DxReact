
import { toRef,toValue, type MaybeRefOrGetter, computed, shallowReactive, onBeforeMount, shallowRef } from "vue";
import type { ProTableProps } from '@/components/pro-table/index.ts'
import {useRequest } from './useRequest'
import type { SearchFormProps } from "src/components/form/search-form";

/**
 * 表格数据结果类型
 * @template T 数据记录类型
 */
export type TableDataResult<T> = {
    records: T[], // 数据记录数组
    total: number // 总记录数
}

/**
 * useTable 钩子的配置参数类型
 * @template T 数据记录类型
 */
export type UseTableProps<T> = {
    manualRequest?: boolean // 是否手动触发请求，默认自动触发
    tableActionRef?:{current:any}
    service: (params: any) => Promise<TableDataResult<T>> // 数据请求服务函数
    searchForm?:Partial<SearchFormProps>
    tableProps?:  Partial<Omit<ProTableProps,'searchForm'>> // 表格属性配置
    pageSizeField?: string // 分页大小字段名，默认 'pageSize'
    pageCurrentField?: string // 当前页码字段名，默认 'current'
    visibleRowSelection?: boolean // 是否显示行选择器
    visibleSerialNumber?: boolean // 是否显示序号列
}

/**
 * 表格操作钩子函数
 * @template T 数据记录类型
 * @param props 配置参数
 * @returns [表格属性, {选中行键值, 请求方法, 刷新方法}]
 */
export const useTable = <T>(props: MaybeRefOrGetter<UseTableProps<T>>) => {

    const propsRef=computed(()=>Object.assign({
        manualRequest:true,
        pageSizeField:'pageSize',
        pageCurrentField:'current',
        tableActionRef:{current:null},
        defaultParams: {},
    },toValue(props))) 

    const propTableProps=toRef(()=>propsRef.value.tableProps)

    // 计算是否需要分页
    const needPagination = computed(() => propTableProps.value.pagination ? true : false)
    
    // 分页信息
    const paginationInfo = shallowReactive({
        current: propTableProps.value.pagination?.defaultCurrent ?? 1, // 当前页码，默认1
        pageSize: propTableProps.value.pagination?.defaultPageSize ?? 10, // 每页大小，默认10
    })
    
    // 选中行的键值数组
    const selectedRowKeys=shallowRef<(string|number)[]>([])
    
    // 使用请求钩子处理数据请求
    const [reqState, reqUtil] = useRequest<TableDataResult<T>>({
        manualRequest: true, // 手动控制请求
        defaultValue: {
            records: [], // 默认空数据
            total: 0, // 默认总数为0
        },
        service: async (params: any = {}) => {
            // 解构分页参数
            const { current, pageSize, ...restParams } = params
            
            // 构建请求参数
            const newParams = {
                ...restParams,
                // 根据是否需要分页添加分页参数
                ...(needPagination.value ? {
                    [propsRef.value.pageSizeField]: pageSize,
                    [propsRef.value.pageCurrentField]: current,
                } : {}),
            }
            
            // 更新分页信息
            if (needPagination.value) {
                paginationInfo.current = current
                paginationInfo.pageSize = pageSize
            }
            
            // 调用服务函数获取数据
            const res = await propsRef.value.service(newParams)
            return res
        }
    })
    
    /**
     * 发起请求（重置到第一页）
     * @param params 请求参数
     * @returns 请求结果
     */
    const request = (params: any = {}) => {
        return reqUtil.request({
            ...params,
            // 添加分页参数
            ...(needPagination.value ? {
                pageSize: paginationInfo.pageSize,
                current: 1, // 重置到第一页
            } : {}),
        })
    }
    
    /**
     * 刷新请求（保持当前页码）
     * @param params 请求参数
     * @returns 请求结果
     */
    const refresh = (params: any = {}) => {
        return reqUtil.refresh({
            ...params,
            // 添加分页参数
            ...(needPagination.value ? {
                pageSize: paginationInfo.pageSize,
                current: paginationInfo.current, // 保持当前页码
            } : {}),
        })
    }

    /**
     * 表格变化回调
     * @param data 表格变化数据
     */
    const onTableChange: ProTableProps['onChange'] = (data) => {
        // 更新分页信息
        if (needPagination.value) {
            paginationInfo.current = data.pagination?.current ?? paginationInfo.current
            paginationInfo.pageSize = data.pagination?.pageSize ?? paginationInfo.pageSize
        }
        // 刷新数据
        refresh()
    }
    
    /**
     * 选择变化回调
     * @param keys 选中行的键值数组
     */
    const onSelectChange: ProTableProps['onSelectChange'] = (keys) => {
        selectedRowKeys.value=keys
    }
    
    /**
     * 计算表格列配置
     */
    const tableColumns=computed(()=>{
        // 复制原始列配置
        const newColumns=propTableProps.value.columns?.map((item)=>{
            return {
                ...item
            }
        })
        
        // 添加序号列
        if(propsRef.value.visibleSerialNumber){
            newColumns.unshift({
                title: '序号',
                width: 80,
                colKey:'__serialNumber',
                align: 'center',
                fixed:'left',
                cell:(h:any,{rowIndex})=>{
                    // 计算序号：(当前页-1)*每页大小+行索引+1
                    return (((paginationInfo.current-1)*paginationInfo.pageSize)+rowIndex+1)+''
                }
            })
        }
        
        // 添加行选择列
        if(propsRef.value.visibleRowSelection){
            newColumns.unshift({
                colKey: 'row-select',
                type: propTableProps.value.rowSelectionType??'multiple', // 默认多选
                width: 46,
                fixed:'left',
            })
        }
        
        return newColumns
    })
    
    /**
     * 计算表格属性配置
     */
    const tableProps = computed<ProTableProps>(() => {
        return {
            rowKey:'id', // 行唯一标识字段
            bordered: true, // 显示边框
            data: reqState.data.records, // 表格数据
            empty: '暂无数据', // 空数据提示
            loading: reqState.loading, // 加载状态
            onChange: onTableChange, // 表格变化回调
            ...propTableProps.value, // 合并用户配置的表格属性
            columns:tableColumns.value, // 使用计算后的列配置
            searchForm:propsRef.value.searchForm,
            // 添加行选择配置
            ...(propsRef.value.visibleRowSelection?({ 
                rowSelectionType:'multiple', // 默认多选
                selectedRowKeys:selectedRowKeys.value, // 选中行键值
                onSelectChange:onSelectChange, // 选择变化回调
            }):{}),
            // 添加分页配置
            ...(needPagination.value ? {
                pagination: {
                    ...propTableProps.value.pagination, // 合并用户配置的分页属性
                    current: paginationInfo.current, // 当前页码
                    pageSize: paginationInfo.pageSize, // 每页大小
                    total: reqState.data.total, // 总记录数
                },
            } : {}),
        }
    })
    
    // 组件挂载前自动请求数据
    onBeforeMount(()=>{
        if(!propsRef.value.manualRequest){ // 非手动请求模式下自动请求
            request()
        }
    })
    if(propsRef.value.tableActionRef){
        propsRef.value.tableActionRef.current={
            request,
            refresh,
        }
    }
    // 返回表格属性和操作方法
    return [tableProps, { selectedRowKeys,request, refresh }] as const
}
