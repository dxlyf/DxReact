tem<script setup lang="ts">
import { ref, reactive, type Prop, computed, shallowRef, toRaw, onMounted } from 'vue'
import { useDialog } from '@/hooks/useDialog'
import { debounce } from 'lodash-es'

type Option = {
    value?: string | number
    label?: string
    [Key:string]:any
}
type ValueType = string | number
type Props = {
    size?: 'small' | 'medium' | 'large'
    title?: string // 弹窗标题
    text?: string // 弹窗按钮文本
    valueField?: string // 选项值的字段
    labelField?: string // 选项显示的字段
    modelValue?: ValueType[] | ValueType // 选中的值或值
    multiple?: boolean // 是否支持多选
    serverFilter?: boolean // 是否开启服务器端过滤
    options?: Option[] // 选项列表
    openStartRequest?: boolean // 是否在打开时请求数据
    itemRows?: number // 显示的行数
    rowHeight?: number // 每行的高度
    request?: (keywork:string) => Promise<Option[]> // 服务器端请求数据的函数
}
const emit = defineEmits(['confirm'])
const props = withDefaults(defineProps<Props>(), {
    text: '',
    valueField:'value',
    labelField:'label',
    multiple: true,
    openStartRequest: false,
    serverFilter: true,
    itemRows: 5,
    rowHeight: 46,
    options:()=>[]
})
const searchText = shallowRef('')
const stateOptions = shallowRef<Option[]>([])
const listStyle=computed(()=>{
    const height=props.itemRows*props.rowHeight
    return {
        height:height+'px',
        maxHeight:height+'px',
    }
})
const finalOptions = computed(() => {
    const propsOptions = props.options
    return props.request ? stateOptions.value : propsOptions
})
const filterOptions = computed<any[]>(() => {
    const filterText = searchText.value.toLowerCase()
    const options = finalOptions.value
    const serverFilter = props.serverFilter
    if (!filterText) {
        return options
    }
    if(serverFilter){
        return options
    }
    return options.filter(item => item.label.toLowerCase().includes(filterText))
})
const model = defineModel<string[] | string>()
const selectedValues = shallowRef([])
const [dialogProps,dialogInst]=useDialog(()=>{
    return {
        header:props.title,
        attach:'body',
        width:600
    }
})
const selectedValuesSet = computed(() => {
    return new Set(selectedValues.value)
})
const loading = shallowRef(false)
const loadData = async () => {
    if (props.request) {
        try {
            loading.value = true
            stateOptions.value = await props.request(searchText.value)
        } catch (e) {
            stateOptions.value = []
        } finally {
            loading.value = false
        }
    }
}
const debounceLoadData = debounce(loadData, 500)
const handleSearch = (val:string) => {
    searchText.value=val
    debounceLoadData()
}
const setModelValue = (value: any[]) => {
    if (props.multiple) {
        model.value = value
    } else {
        model.value = value[0]
    }
}
const handleOpen = () => {
    selectedValues.value=Array.isArray(model.value)?model.value.slice():model.value!=null?[model.value]:[]
    dialogInst.open()
    if(props.openStartRequest){
        loadData()
    }
}
const handleClose = () => {
    dialogInst.close()
}
const handleConfirm = () => {
    setModelValue(selectedValues.value.slice())
    handleClose()
    const selectedDataItem=filterOptions.value.filter(item=>selectedValuesSet.value.has(item[props.valueField]))
    emit('confirm',selectedValues,selectedDataItem)
}
const handleSelectAll = () => {
    selectedValues.value = filterOptions.value.map(item => item[props.valueField])
}
const handleUnSelectAll = () => {
    selectedValues.value = filterOptions.value.filter(item => !selectedValuesSet.value.has(item[props.valueField])).map(item => item[props.valueField])
}
const handleSelect = (checked: boolean, value: any) => {
    if (!props.multiple) {
        selectedValues.value = checked ? [value] : []
        return
    }
    if (checked) {
        selectedValuesSet.value.add(value)
        selectedValues.value = Array.from(selectedValuesSet.value)
    } else {
        selectedValuesSet.value.delete(value)
        selectedValues.value = Array.from(selectedValuesSet.value)
    }
}

</script>

<template>
    <div>
        <slot :open="handleOpen">
            <t-button @click="handleOpen" theme="primary" variant="outline">
                <template #icon>
                    <t-icon name="plus"></t-icon>
                </template>
                {{ text }}
            </t-button>
        </slot>
        <t-dialog v-bind="dialogProps">
            <div class="flex flex-col">
                <div class="mb-2"><t-input  @change="handleSearch" :value="searchText" class="bg-gray-300" clearable placeholder="搜索">
                        <template #label>
                            <t-icon name="search"></t-icon>
                        </template>
                    </t-input></div>
                <t-loading size="small" loading v-if="loading" text="加载数据中..." />
                <t-list v-else  :scroll="{ isFixedRowHeight: true, type: 'virtual', rowHeight: rowHeight, bufferSize: itemRows }"
                    class="flex-1" :style="listStyle" layout="vertical">
                    <t-list-item v-for="item in filterOptions" :key="item[valueField]">
                        <slot name="item" :select="handleSelect" :checked="selectedValuesSet.has(item[valueField])" :item="item">
                        <div class="flex gap-2">
                            <div>
                                <t-checkbox @change="(checked) => handleSelect(checked, item[valueField])"
                                    :checked="selectedValuesSet.has(item[valueField])" />
                            </div>
                            <div> {{ item[labelField] }}</div>
                        </div>
                        </slot>
                    </t-list-item>
                </t-list>
            </div>
            <template #footer>
                <div class="flex justify-between items-center">
                    <div>
                        <t-space v-if="multiple">
                            <t-link theme="primary" @click="handleSelectAll">全选</t-link>
                            <t-link theme="primary" @click="handleUnSelectAll">反选</t-link>
                        </t-space>
                    </div>
                    <div class="flex gap-2">
                        <div class="font-xs self-end">已选择<span class="font-bold">{{ selectedValues.length }}</span>项</div>
                        <t-space>
                            <t-button theme="default" @click="handleClose">取消</t-button>
                            <t-button theme="primary" @click="handleConfirm">确定</t-button>
                        </t-space>
                    </div>
                </div>
            </template>
        </t-dialog>
    </div>
</template>