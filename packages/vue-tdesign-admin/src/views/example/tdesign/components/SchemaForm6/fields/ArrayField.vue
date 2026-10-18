<script setup lang="ts">
// ============================================================================
// ArrayField：数组节点（tabs 模式）
// 每个 tab 对应一个数组项节点；项的增删 / 排序直接操作 ArrayFieldUI.children，
// 因为状态就挂在节点上，不再需要任何下标迁移
// ============================================================================
import { computed, ref } from 'vue'
import { DialogPlugin } from 'tdesign-vue-next'
import CollapseCard from '../components/CollapseCard.vue'
import FieldPopover from '../components/FieldPopover.vue'
import FieldNode from './FieldNode.vue'
import type {ArrayFieldSchema, FieldPath, ObjectVisibleField} from '../types'
import { useSchemaFormContext } from '../composables/useSchemaForm.ts'



const props = defineProps<{
    path:FieldPath
    schema: ArrayFieldSchema
}>()
const form=useSchemaFormContext()
const title = computed(() => {
    const key=typeof props.path[props.path.length-1]
    const index:number|null=typeof key==='number'?key:null
    const label=props.schema.label||''
    return props.schema.formatLabel?props.schema.formatLabel(label,index,props.schema):label
})
const fieldValue=computed({
    get: () => form.getPathValue(props.path,props.schema.defaultValue),
    set: (value) => form.setPathValue(props.path,value),
})
const activeIndex = ref(0)

type RenderItem={
    uid:string
    label:string
    fields:ObjectVisibleField[]
    object:any|null
    isListObject:boolean
}
/** 数组项节点 + 实际要渲染的子节点（对象项直接渲染其字段，避免多套一层卡片） */
const items = computed<RenderItem[]>(() =>
    fieldValue.value.map((child:any, index:number) => {
        const isListObject=props.schema.valueType!=='array<string>'
        const schema=props.schema
        const state = isListObject?form.getObjectState(child,schema.schemas):null
        return {
            uid: index+'',
            label: props.schema.formatItemLabel?props.schema.formatItemLabel(props.schema.label,index,props.schema):`${props.schema.label}${index+1}`,
            fields: (state ? state.fields : [{
                key:schema.schemas[0].key,
                schema:schema.schemas[0],
                visible:true,
            }]).filter(item=>item.visible),
            isListObject,
            object:state?child:null,
        } as RenderItem
    })
)
const realActiveIndex = computed(() => Math.max(0, Math.min(activeIndex.value, items.value.length - 1)))
const activeItem = computed(() => {
    return items.value[realActiveIndex.value]
})
const activeObject = computed(() => {
    return activeItem.value?.object ?? null
})

const activeFields = computed(() =>{
    const isListObject=props.schema.valueType!=='array<string>'
    const obj=fieldValue.value[realActiveIndex.value]
    const state = isListObject&&obj?form.getObjectState(obj,props.schema.schemas):null
    if(state){
        return state.fields
    }
    return []
})

const handleVisibleField = (name: string, visible: boolean) => {
    form.setFieldVisible(activeObject.value,name,visible)
}
const handleAddField = (name: string) => {
    form.addExteralField(activeObject.value,name)
}
const handleRemoveField = (name: string) => {
    form.removeField(activeObject.value,name)
}

const handleTabChange = (value: any) => {
    activeIndex.value = value as number
}
const handleAdd = () => {
    activeIndex.value = form.addItem(props.path,props.schema)
}
const handleRemoveItem = ({ index }: { index: number }) => {
    const dialog = DialogPlugin.confirm({
        header: '确认移除吗？',
        body: '确认移除当前项吗？',
        onConfirm: () => {
            form.removeItem(props.path,index)
            if (index <= activeIndex.value) {
                activeIndex.value = Math.max(0, activeIndex.value - 1)
            }
            dialog.destroy()
        },
    })
}
const moveArrayIndex = (index: number, from: number, to: number) => {
    if (index === from) return to
    if (from < to && index > from && index <= to) return index - 1
    if (from > to && index >= to && index < from) return index + 1
    return index
}

const handleDragSort = ({ currentIndex, targetIndex }: { currentIndex: number; targetIndex: number }) => {
    form.moveItem(props.path,currentIndex, targetIndex)
     activeIndex.value = moveArrayIndex(activeIndex.value, currentIndex, targetIndex)
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover
                v-if="schema.valueType !== 'array<string>' && schema.allowAddedField"
                :fields="activeFields" @visibleField="handleVisibleField" @add="handleAddField"
                @remove="handleRemoveField" />
        </template>
        <t-tabs theme="card" :value="realActiveIndex" :addable="schema.allowAdded"
            :drag-sort="!!schema.sortable" @change="handleTabChange" @add="handleAdd"
            @remove="handleRemoveItem" @drag-sort="handleDragSort">
            <t-tab-panel v-for="(item, index) in items" :key="item.uid" 
                :value="index" removable>
                <template #label>
                    <t-icon v-if="schema.sortable" name="drag-move" class="mr-2 cursor-move"></t-icon>{{ item.label }}
                </template>
                <div class="array-field-body">
                  <div v-for="child in item.fields" :key="child.key" >
                      <FieldNode :path="item.isListObject?[...props.path,index,child.key]:[...props.path,index]" :schema="child.schema"  />
                  </div>
                </div>
            </t-tab-panel>
        </t-tabs>
    </CollapseCard>
</template>
<style scoped>
    .array-field-body{
        padding:4px;
    }
    .array-field-body>div:nth-of-type(n+2){
        margin-top: 6px;
    }
</style>
