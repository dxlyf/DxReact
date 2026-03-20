tem<script setup lang="ts">
import { ref, reactive, type Prop, computed, shallowRef, toRaw, onMounted } from 'vue'
import { useDialog } from '@/hooks/useDialog'
import { debounce } from 'lodash-es'
type Option = {
    value: string | number
    label: string
}
type Props = {
    title?: string
    text?: string
    modelValue?: string[] | string
    multiple?: boolean
    options?: Option[]
    serverFilter?: boolean
    openStartRequest?: boolean
    request?: (keywork:string) => Promise<Option[]>
}
const props = withDefaults(defineProps<Props>(), {
    text: '',
    multiple: true,
    openStartRequest: false,
    serverFilter: true,
    options:()=>[]
})
const searchText = shallowRef('')
const stateOptions = shallowRef<Option[]>([])
const finalOptions = computed(() => {
    const propsOptions = props.options
    return props.request ? stateOptions.value : propsOptions
})
const filterOptions = computed(() => {
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
const selectedItems = shallowRef([])
const [dialogProps,dialogInst]=useDialog(()=>{
    return {
        header:props.title,
        attach:'body',
        width:600
    }
})
const selectedItemsSet = computed(() => {
    return new Set(selectedItems.value)
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
    selectedItems.value=Array.isArray(model.value)?model.value.slice():model.value!=null?[model.value]:[]
    dialogInst.open()
    if(props.openStartRequest){
        loadData()
    }
}
const handleClose = () => {
    dialogInst.close()
}
const handleConfirm = () => {
    setModelValue(selectedItems.value.slice())
    handleClose()
}
const handleSelectAll = () => {
    selectedItems.value = filterOptions.value.map(item => item.value)
}
const handleUnSelectAll = () => {
    selectedItems.value = filterOptions.value.filter(item => !selectedItems.value.includes(item.value)).map(item => item.value)
}
const handleSelect = (checked: boolean, value: any) => {
    if (!props.multiple) {
        selectedItems.value = checked ? [value] : []
        return
    }
    if (checked) {
        selectedItemsSet.value.add(value)
        selectedItems.value = Array.from(selectedItemsSet.value)
    } else {
        selectedItemsSet.value.delete(value)
        selectedItems.value = Array.from(selectedItemsSet.value)
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
                <t-list v-else  :scroll="{ isFixedRowHeight: true, type: 'virtual', rowHeight: 46, bufferSize: 10 }"
                    class="flex-1 h-[460px] max-h-[460px]" layout="vertical">
                    <t-list-item v-for="item in filterOptions" :key="item.value">
                        <slot name="item" :select="handleSelect" :checked="selectedItemsSet.has(item.value)" :item="item">
                        <div class="flex gap-2">
                            <div>
                                <t-checkbox @change="(checked) => handleSelect(checked, item.value)"
                                    :checked="selectedItemsSet.has(item.value)" />
                            </div>
                            <div> {{ item.label }}</div>
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
                        <div class="font-xs self-end">已选择<span class="font-bold">{{ selectedItems.length }}</span>项</div>
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