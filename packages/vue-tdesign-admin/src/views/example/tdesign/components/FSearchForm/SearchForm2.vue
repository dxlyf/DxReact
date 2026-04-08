<script setup lang="ts">
import { computed, onMounted, shallowRef, toRaw, useSlots } from 'vue';
import type { SearchFormProps, InnerSearchField } from './types'
import { useSearchForm } from '../../hooks/useSearchForm2';

const props = withDefaults(defineProps<SearchFormProps>(), {
    loading:false,
    defaultColumns: 4,
    collapseShowRows: 1,
    spans: 12,
    syncParamsToUrl: true,
    showExpand: true,
    defaultExpand: false,
    mountedQuery:false,
    columns: () => []
})
const emit = defineEmits(['search', 'reset'])
const expandRows = shallowRef(props.defaultExpand)
const slots = useSlots()
const getSlots = (prefix: string) => {
    let curSlot: any = {}
    for (let [key,slot] of Object.entries(slots)) {
        if (key.startsWith(prefix)) {
            const name=key.replace(prefix,'')
            curSlot[name] = key
        }
    }
    return curSlot
}

const finalState = computed<{ columns: InnerSearchField[], totalSpan: number, totalRows: number }>(() => {
    const columns = props.columns.map((item) => ({
        visible: true,
        ...item
    })).filter((item) => item.visible)
    const defaultSpan = Math.floor(props.spans / props.defaultColumns)
    let totalSpan = 0
    const finalColumns = columns.map((item, index) => {
        const { colProps, span = defaultSpan, ...restItem } = item
        const newColumn: InnerSearchField = {
            ...restItem,
            colProps: {
                span: span,
                ...(colProps || {})
            },
            hidden: false,
            slots: getSlots(item.name + '_'),
            key: item.name
        }
        totalSpan += defaultSpan
        newColumn.totalSpan=totalSpan
        return newColumn
    })
    let totalRows = Math.ceil(totalSpan / props.spans)
    const offset=totalSpan%props.spans
    if(offset===0&&totalSpan>0){
        totalRows++
    }
    return {
        columns: finalColumns,
        totalSpan: totalSpan,
        totalRows: totalRows
    }
})
const finalColumns = computed(() => {
    const _expandRows = expandRows.value
 //   const _totalSpan = finalState.value.totalSpan
    const _totalRows = finalState.value.totalRows
    const collapseShowRows = props.collapseShowRows
    const defaultSpan = Math.floor(props.spans / props.defaultColumns)
    let curTotalSpan = _totalRows > collapseShowRows ? defaultSpan : 0
    return finalState.value.columns.map((item) => {
        curTotalSpan += item.colProps.span
        const curRow = Math.ceil(curTotalSpan / props.spans)
         item.hidden = !_expandRows && curRow > collapseShowRows
        return item;
    })
})
const queryColProps = computed(() => {
    const totalSpan = finalState.value.columns.filter(items => expandRows.value || !items.hidden).reduce((sum, item) => {
        return sum + item.colProps.span
    }, 0)
    const offset = totalSpan % props.spans
    const defaultSpan = Math.floor(props.spans / props.defaultColumns)

    return {
        span: defaultSpan,
       // offset:offset===0?(props.spans - defaultSpan - offset):0
        offset: finalState.value.totalRows>props.collapseShowRows?(props.spans - defaultSpan - offset):0
    }
})
const [formData, searchFormInstance] = useSearchForm(computed(() => {
    const initialSearchParams = props.columns.reduce((prev, cur) => {
        prev[cur.name] = cur.defaultValue
        return prev
    }, {} as Record<string, any>)
    return {
        defaultParams: initialSearchParams,
        syncParamsToUrl: props.syncParamsToUrl,
        onSearch: (params) => {
            emit('search', params)
        },
        onReset: (params) => {
            emit('reset', params)
        }
    }
}))
const visibleExpandBlock = computed(() => {
    const showExpand = props.showExpand
    if(!showExpand){
        return false
    }
    const _totalRows = finalState.value.totalRows
    const collapseShowRows = props.collapseShowRows
    return _totalRows > collapseShowRows
})
const toggleExpandRows=()=>{
    expandRows.value=!expandRows.value
}
onMounted(()=>{
    if(props.mountedQuery){
        if(props.ready){
            props.ready.then(()=>{
                searchFormInstance.search()
            })
        }else{
            searchFormInstance.search()
        }
    }
})
defineExpose({
    formData:formData,
    formInstance:searchFormInstance
})
</script>
<template>
   <div>
     <t-row :gutter="[8, 8]">
        <t-col v-for="item in finalColumns" :key="item.key" v-bind="item.colProps"
            v-show="!showExpand || expandRows || !item.hidden">
            <template v-if="$slots[item.name]">
                <slot :name="item.name" v-bind="item.props" @update:modelValue="formData[item.name]=$event"  :modelValue="formData[item.name]"></slot>
            </template>
            <component v-else-if="item.type=='t-input'" :is="item.type" v-model:trim="formData[item.name]" v-bind="item.props">
                <template v-for="(value, name) in item.slots" #[name]="slotData">
                    <slot :name="value" v-bind="slotData || {}"></slot>
                </template>
            </component>
            <component v-else :is="item.type" v-model="formData[item.name]" v-bind="item.props">
                <template v-for="(value, name) in item.slots" #[name]="slotData">
                    <slot :name="value" v-bind="slotData || {}"></slot>
                </template>
            </component>
        </t-col>
        <slot name="query" :search="searchFormInstance.search" :reset="searchFormInstance.reset" :toggleExpandRows="toggleExpandRows">
            <t-col v-bind="queryColProps">
                <div class="flex">
                    <t-button theme="default" @click="searchFormInstance.reset" >重置</t-button>
                    <t-button class="ml-4!" theme="primary" @click="searchFormInstance.search" :loading="loading">查询</t-button>
                    <div class="flex items-end ml-1" v-if="visibleExpandBlock">
                        <t-link size="small" theme="primary" @click="toggleExpandRows">
                            {{ expandRows ? '收起' : '展开' }}
                        </t-link>
                    </div>
                </div>
            </t-col>
        </slot>
    </t-row>
   </div>
</template>