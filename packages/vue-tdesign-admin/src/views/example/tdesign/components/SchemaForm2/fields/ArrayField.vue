<script setup lang="ts">
import { computed, inject, reactive, ref, watch } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { type UseSchemaFormInstance, USE_SCHEMA_CONTEXT_KEY } from '../composables/useSchemaForm';
import { AllFieldSchema, ArrayFieldSchema, AtomFieldSchema, FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';
import FormField from './FormField.vue';
import { createItemBySchema, createAtomFieldSchema } from '../util'
import { DialogPlugin } from 'tdesign-vue-next'

const props = defineProps<{
    schema: ArrayFieldSchema;
    path: FieldPath;
}>()
const title = computed(() => {
    return props.schema.formatLabel ? props.schema.formatLabel(props.schema.label, props.schema) : props.schema.label
})

const activeKey = ref(0)
const realActiveKey = computed(() => {
    return Math.max(0, Math.min(activeKey.value, fieldValue.value.length - 1))
})
const form = inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)
const fieldValue = computed({
    get() {
        return form.getValue(props.path, props.schema.defaultValue)
    },
    set(val) {
        form.setValue(props.path, val)
    }
})
type VisibleField = {
    name: string
    checked: boolean
    canRemove: boolean
    schema: AllFieldSchema
}
const arrayFieldMap = ref<Record<number, VisibleField[]>>({})

const getOrCreateVisibleFeelds = (index: number): VisibleField[] => {
    const schemas = props.schema.schemas
    const value = fieldValue.value[index]
    // 排除schema中的key
    const extraKeys = Object.keys(value).filter((key) => !schemas.some((item) => item.key === key))
    
    const curFields:VisibleField[]=schemas.map((item)=>({
        name:item.key,
        checked:true,
        canRemove:false,
        schema:item
    }))
    // 如果没有，就初始化构建
    const extraFields:VisibleField[]=extraKeys.map(key => ({
        name: key,
        checked: true,
        canRemove: true,
        schema: createAtomFieldSchema({
            key: key,
            label: key,
            component: 't-input',
            props: {
                placeholder: `请输入${key}`
            }
        })
    }))
    const curFieldsWithExtra:VisibleField[]=curFields
    
    if (!arrayFieldMap.value[index]) {
        // 如果没有，就初始化构建
        extraFields.forEach(item=>{
            curFieldsWithExtra.push(item)
        })
        arrayFieldMap.value[index] =curFieldsWithExtra
    } else {
        const visibleMap = new Map((arrayFieldMap.value[index] || []).map(item => [item.name, item]))
        let hasNewKey=false // 是否有新的key
        let alreadyKeys=new Set<string>()
        visibleMap.forEach((item)=>{
            if(item.canRemove){
                const extraItem = extraFields.find((extraItem) => extraItem.name === item.name)
                if(extraItem){
                    curFieldsWithExtra.push(extraItem)
                    alreadyKeys.add(extraItem.name)
                }else{
                    curFieldsWithExtra.push(item)
                }
            }
        })
        extraFields.forEach(item=>{
            if(!alreadyKeys.has(item.name)){
                curFieldsWithExtra.push(item)
            }
        })
        curFieldsWithExtra.forEach((item) => {
            const visibleItem = visibleMap.get(item.name)
            if(!visibleItem){
                hasNewKey=true
            }
            if (!visibleItem || visibleItem.checked) {
                item.checked = true
            }else{
                item.checked = false
            }
        })
        // 如果有新的key，就更新
        if(hasNewKey){
            arrayFieldMap.value[index]=curFieldsWithExtra
        }
    }
    return curFieldsWithExtra
}
const getFieldSchemas = (index: number) => {
    const schemas = getOrCreateVisibleFeelds(index)
    return schemas.filter(d => d.checked).map(d => d.schema)
}

const visibleFields = computed(() => {
    return getOrCreateVisibleFeelds(realActiveKey.value)
})
const handleAdd = () => {
    fieldValue.value = [...fieldValue.value, createItemBySchema(props.schema)]
    activeKey.value = fieldValue.value.length - 1

}
const handleRemove = ({ index }: { index: number }) => {
    const dialog = DialogPlugin.confirm({
        header: '确认移除吗？',
        body: '确认移除当前项吗？',
        onConfirm: () => {
            fieldValue.value = fieldValue.value.filter((item: any, i: number) => i !== index)
            if (index <= activeKey.value) {
                activeKey.value = Math.max(0, activeKey.value - 1)
            }
            arrayFieldMap.value[index] = null
            dialog.destroy()

        }
    })
}
const handleTabChange = (val: any) => {
    activeKey.value = val
}

const handleVisibleFieldChange = (fields: any[]) => {
    arrayFieldMap.value[realActiveKey.value] = fields
   
}
const handleVisibleField=(name:string,visible:boolean)=>{
    if(visible){
       form.restorePath([...props.path,realActiveKey.value,name])
    }else{
       form.hidePath([...props.path,realActiveKey.value,name])
    }
}
const handleRemoveVisibleField=(name:string)=>{
   form.removePath([...props.path,realActiveKey.value,name])
   debugger
   const fields=arrayFieldMap.value[realActiveKey.value]
   arrayFieldMap.value[realActiveKey.value]=fields.filter(f=>f.name!==name)

}
const handleAddVisibleField=(fields:VisibleField[])=>{
    arrayFieldMap.value[realActiveKey.value]=fields
    const lastField=fields[fields.length-1]
    form.setValue([...props.path,realActiveKey.value,lastField.name],lastField.schema.defaultValue)
  
}
</script>
<template>
    <CollapseCard :title="title" class="mt-4">
        <template #extra>
            <FieldPopover @add="handleAddVisibleField" @remove="handleRemoveVisibleField" @visibleField="handleVisibleField" @change="handleVisibleFieldChange"
                v-if="fieldValue.length > 0 && schema.valueType === 'array<object>' && schema.allowAddedField"
                :fields="visibleFields" :path="props.path" />
        </template>
        <t-tabs theme="card" :value="realActiveKey" :addable="schema.allowAdded" @change="handleTabChange"
            @add="handleAdd" @remove="handleRemove">
            <t-tab-panel :value="index" removable v-for="(item, index) in fieldValue" :key="index">
                <div class="p-2">
                    <template v-for="(field, fieldIndex) in getFieldSchemas(index as number)"
                        :key="field.key || fieldIndex">
                        <FormField :schema="field"
                            :path="schema.valueType === 'array<object>' ? [...path, index, field.key] : [...path, index, fieldIndex]">
                        </FormField>
                    </template>
                </div>
            </t-tab-panel>
        </t-tabs>
    </CollapseCard>
</template>