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
    mountedQuery: true,
    columns: () => []
})
const emit = defineEmits(['search', 'reset','change'])
const expandRows = shallowRef(props.defaultExpand)
const slots = useSlots()
const getSlots = (prefix: string) => {
    let curSlot: any = {}
    for (let [key, slot] of Object.entries(slots)) {
        if (key.startsWith(prefix)) {
            const name = key.replace(prefix, '')
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
        const { colProps,props={},type='t-input', span = defaultSpan, ...restItem } = item
        const newColumn: InnerSearchField = {
            type:type,
            props:props,
            ...restItem,
            colProps: {
                span: span,
                ...(colProps || {})
            },
            hidden: false,
            slots: getSlots(item.name + '_'),
            key: item.name,
        }
        totalSpan += defaultSpan
        return newColumn
    })
    let totalRows = Math.ceil((totalSpan + defaultSpan) / props.spans)

    return {
        columns: finalColumns,
        totalSpan: totalSpan,
        totalRows: totalRows
    }
})


const finalColumns = computed(() => {
    const _expandRows = expandRows.value
    const collapseShowRows = props.collapseShowRows
    const defaultSpan = Math.floor(props.spans / props.defaultColumns)
    let curTotalSpan = 0//_totalRows > collapseShowRows ? defaultSpan : 0
    const queryButton: any = {
        name: 'query-button',
        key: 'query-button',
        colProps: {
            offset:0,
            span: defaultSpan,
        },
        type: 'QueryButton',
    }
    let addedQueryButton = false
    let finalColumns = finalState.value.columns.reduce((acc, item) => {
        curTotalSpan += item.colProps.span
        // 如果当前列超过最大列数，添加查询按钮
        if (curTotalSpan >= props.spans && !addedQueryButton) {
            addedQueryButton = true
         //   queryButton.colProps.span = defaultSpan - offset
            acc.push(queryButton)
            curTotalSpan += defaultSpan
        }
        const curRow = Math.ceil(curTotalSpan / props.spans)
        const newItem = {
            ...item,
            // 如果没有展开，且当前行大于折叠行数，隐藏当前列
            hidden: !_expandRows && curRow > collapseShowRows
        }
        acc.push(newItem)
        return acc;
    }, [])
    if (!addedQueryButton) {
       // queryButton.colProps.offset = props.spans - curTotalSpan-defaultSpan
        finalColumns.push(queryButton)
    }

    return finalColumns
})

const [formData, searchFormInstance] = useSearchForm(computed(() => {
    const initialSearchParams = props.columns.reduce((prev, cur) => {
        prev[cur.name] = cur.defaultValue
        return prev
    }, {} as Record<string, any>)
    return {
        defaultParams: initialSearchParams,
        syncParamsToUrl: props.syncParamsToUrl,
        transform:(params,name,value)=>{
            if(props.transform){
                props.transform(params,name,value)
            }
        },
        normalize:(params,name,value)=>{
            if(props.normalize){
                props.normalize(params,name,value)
            }
        },
        onSearch: (params) => {
            emit('search', params)
            emit('change', params)
        },
        onReset: (params) => {
            emit('reset', params)
            emit('change', params)
        }
    }
}))
const visibleExpandBlock = computed(() => {
    const showExpand = props.showExpand
    if (!showExpand) {
        return false
    }
    const _totalRows = finalState.value.totalRows
    const collapseShowRows = props.collapseShowRows
    return _totalRows > collapseShowRows
})
const toggleExpandRows = () => {
    expandRows.value = !expandRows.value
}
onMounted(() => {
    if (props.mountedQuery) {
        if (props.ready) {
            props.ready.then(() => {
                searchFormInstance.search()
            })
        } else {
            searchFormInstance.search()
        }
    }
})
defineExpose({
    formData: formData,
    formInstance: searchFormInstance
})
</script>
<template>
    <div>
        <t-row :gutter="[8, 8]">
            <t-col v-for="item in finalColumns" :key="item.key" v-bind="item.colProps"
                v-show="item.type === 'QueryButton' || !showExpand || expandRows || !item.hidden">
                <template v-if="$slots[item.name]">
                    <slot :name="item.name" v-bind="item.props" @update:modelValue="formData[item.name] = $event"
                        :modelValue="formData[item.name]"></slot>
                </template>
                <template v-else-if="item.type === 'QueryButton'">
                    <slot name="query" :search="searchFormInstance.search" :reset="searchFormInstance.reset"
                        :toggleExpandRows="toggleExpandRows">
                        <div class="flex">
                            <t-button theme="default" @click="searchFormInstance.reset">重置</t-button>
                            <t-button class="!ml-4" theme="primary" @click="searchFormInstance.search" :loading="loading">查询</t-button>
                            <div class="flex items-end ml-1" v-if="visibleExpandBlock">
                                <t-link size="small" hover="color" theme="primary" @click="toggleExpandRows">
                                    {{ expandRows ? '收起' : '展开' }}
                                    <t-icon v-if="!expandRows" name="chevron-down-s" />
                                    <t-icon v-else name="chevron-up-s" />
                                </t-link>
                            </div>
                        </div>
                    </slot>
                </template>
                 <component v-else-if="item.type=='t-input'" :is="item.type" @enter="searchFormInstance.search"  v-model.trim="formData[item.name]" v-bind="item.props">
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

        </t-row>
    </div>
</template>