<template>
    <t-form v-bind="normalizeFormProps" @submit="handleSubmit" @reset="handleReset" >
        <t-row v-if="colInfo.columns.length>0">
            <t-col v-for="col in colInfo.columns" :key="col.key" v-show="!colloapsed||col.hidden" :span="col.span" >
                <form-field v-bind="col.props" v-model="props.data[col.key]" />
            </t-col>
            <t-col :span="4">
                <t-space>
                    <t-button type="submit" theme="primary">查询</t-button>
                    <t-button type="reset" theme="default">重置</t-button>
                    <t-link @click="handleToggleColloapse">{{ colloapsed?'展开':'收起' }}</t-link>
                </t-space>
            </t-col>
        </t-row>
        <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
        </template>
    </t-form>
</template>
<script  setup lang="ts">
import { toRefs,computed,ref } from 'vue'
import type {SearchFormProps, RowColType} from './search-form.ts'

const emit=defineEmits<{
    submit:[data:any]
    reset:[data:any]
}>()
const props=withDefaults(defineProps<SearchFormProps>(),{
    alwaysExpand:false,
    defaultColumnSpan:4,
    maxColumnSpan:12,
    maxShowRows:1,
    columns:()=>[],
})
console.log('props',props.columns)
const slots=defineSlots()
const colloapsed=ref(true)

const normalizeColumns=computed(()=>{
    const newColumns= props.columns.map((item,i)=>{
        return {
            key:item.key??item.name??`col-${i}`,
            order:(props.columns.length-i)*10,
            span:props.defaultColumnSpan,
            ...item,
        }
    }).filter((item)=>!item.hidden)
    newColumns.sort((a,b)=>b.order-a.order)
    return newColumns
})
const colInfo=computed(()=>{
    
    const alwaysExpand=props.alwaysExpand
    const cols=normalizeColumns.value,maxShowRows=props.maxShowRows,maxColumnSpan=props.maxColumnSpan
    let totalSpan=4
    let columns:RowColType[]=[]
    for(let i=0;i<cols.length;i++){
        const {span,order,key,hidden,...restColumnProps}=cols[i]
        totalSpan+=span
        let currentRowCount=Math.ceil(totalSpan/maxColumnSpan)
        let realHidden=!alwaysExpand&&currentRowCount>maxShowRows
        columns.push({span,order,hidden:realHidden,key,props:restColumnProps})
    }
    const rowCount=Math.ceil(totalSpan/maxColumnSpan)
    return {
        visibleExpanded:alwaysExpand?false:rowCount>maxShowRows,
        columns,
    }
})

const handleSubmit=(e:any)=>{
    emit('submit',props.data)
}
const handleReset=(e:any)=>{
    emit('reset',props.data)
}
const handleToggleColloapse=()=>{
    colloapsed.value=!colloapsed.value
}
const normalizeFormProps=computed(()=>{
    const {alwaysExpand,defaultColumnSpan,maxColumnSpan,maxShowRows,columns,...restProps}=props
    return restProps
})

</script>
