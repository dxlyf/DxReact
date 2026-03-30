<script setup lang="ts">
import { type TdSelectProps } from 'tdesign-vue-next'
import { shallowReactive, shallowRef,onBeforeUnmount, useAttrs, computed, ref, reactive, onMounted } from 'vue'
import { debounce } from 'lodash-es'
type Props = {
    defaultOptions?:any[]
    request: (params: { keyword: string, current: number, pageSize: number }) => Promise<{ total: number, records: any[] }>
    debounce?: number // 搜索防抖时间
    multiple?: boolean // 是否支持多选
    manualRequest?: boolean
    keys?:{
        label:string
        value:string
    },
    valueType?:string
    modelValue?:any
}
const props = withDefaults(defineProps<Props>(), {
    debounce: 1000,
    multiple: false,
    manualRequest: false,
    defaultOptions:()=>[],
    keys:()=>({
        label:'label',
        value:'value'
    }),
    valueType:'object'
})
const attrs = useAttrs()
const options = shallowRef<any[]>([])
const modelValue=defineModel<any>()
const valueSet=new Set()
const getItemValue=(item:any)=>{
    return item[props.keys.value]
}
const getLabel=(item:any)=>{
    return item[props.keys.label]
}
const displayOptions = computed(() => {
    let curOptions=options.value
    let newValueSet=valueSet
    let headOptions=Array.isArray(props.defaultOptions)?props.defaultOptions:[]
    if(headOptions.length>0){
        newValueSet=new Set(Array.from(valueSet))
       headOptions.forEach(item=>{
            newValueSet.add(getItemValue(item))
       })
    }
    if (props.valueType === 'object') {
        let valueArray:any =[]
        if(props.multiple){
            valueArray=Array.isArray(modelValue.value)?modelValue.value:[]
        }
        else{
            valueArray=[modelValue.value]
        }
        valueArray=valueArray.filter(item=>{
            if(typeof item === 'object' && getItemValue(item)!==null&&getItemValue(item)!==undefined){
                return true
            }
            return false
        })
        
        if (valueArray&&valueArray.length>0) {
            const restOptions= valueArray.filter(item => {
                return !newValueSet.has(getItemValue(item))
            })
            return headOptions.concat(restOptions).concat(curOptions)
        }
    }
    return headOptions.concat(curOptions)
})
const loading=ref(false)
const lastParams={curent:''}


const request = async (keyword:string,loadMore:boolean=false) => {
    try{
        
        const newPamras={
            keyword,
            current: pagination.current,
            pageSize: pagination.pageSize
        }
        loading.value=true
        const data = await props.request(newPamras)
        lastParams.curent=keyword
        pagination.total = data.total
        pagination.totalPages=Math.ceil(data.total/pagination.pageSize)
        if(loadMore){
            options.value=options.value.concat(data.records)
        }else{
            options.value=data.records
        }
        valueSet.clear()
        options.value.forEach(item=>{
            valueSet.add(getItemValue(item))
        })
    }catch(err){
        pagination.current = 1
        pagination.total = 0
        options.value = []
        console.log('err', err)
    }finally{
        loading.value=false
    }
}

const searchKeyword = shallowRef('')

const pagination = shallowReactive({
    current: 1,
    total: 0,
    pageSize: 10,
    totalPages:0
})
const hasMore=computed(()=>{
    const hasPage= pagination.current<pagination.totalPages
    return hasPage
})
const handlePageChange = ({ current, pageSize }: { current: number, pageSize: number }) => {
    pagination.current = current
    pagination.pageSize = pageSize
    //selectInst.loadData(true)
    request(lastParams.curent)
}

const selectProps = computed<TdSelectProps>(() => {
    const {filterable,...restAttrs}=attrs
    const curOptions=displayOptions.value
    return {
        ...(props.request ? {
            options:curOptions,
            onSearch:handleSearchDebounce
        } : {}),
        clearable:true,
        filterable:true,
      //  loading:loading.value,
        keys: props.keys,
        valueType: props.valueType,
        multiple: props.multiple,
        emptyText:loading.value?'':'暂无数据',
        ...restAttrs
    }
})
const handleSearch=(val: string) => {
    pagination.current = 1
    request(val)
}
const handleSearchDebounce=debounce(handleSearch,props.debounce)
const handlePopVisible=(visible:boolean)=>{
    if(visible){
        pagination.current = 1
        request('')
    }
}
const handleScrollToBottom=()=>{
    console.log('handleScrollToBottom',pagination.current,pagination.totalPages)
    if(!loading.value&&pagination.current<pagination.totalPages){
        pagination.current++
        request(lastParams.curent,true)
    }
}

</script>


<template>
    <t-select :popup-props="{ 'onScrollToBottom': handleScrollToBottom}" v-bind="selectProps"  v-model="modelValue" @popup-visible-change="handlePopVisible">
        <template #panelTopContent>
            <div>
                <!-- <div style="padding: 6px 6px 0 6px">
                    <t-input v-model="searchKeyword" @change="handleSearchDebounce" clearable placeholder="请输入关键词搜索" />
                </div> -->
                <div class="px-2 py-1">
                    <t-pagination size="small" theme='simple' :show-page-size="false" @change="handlePageChange"
                        :current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize" />
                </div>
            </div>
        </template>
        <template #suffixIcon><t-icon name="search" /></template>
        <template v-if="pagination.totalPages>1" #panelBottomContent>
            <div class="text-gray-300 text-sm text-center py-1">
                {{ hasMore?'滚动加载更多':'没有更多了' }}
            </div>
        </template>
    </t-select>
</template>