<template>
    <t-button theme="default" @click="handleOpen">
        <slot></slot>
    </t-button>

    <t-dialog attach="body" width="60%" :footer="!disabled" :destroy-on-close="true" :header="title" :visible="visible"
        @confirm="handleConfirm" @close="handleClose">
        <t-form :disabled="disabled" :data="formData" @submit="handleSubmit" ref="formRef">
            <div class="flex flex-col gap-2">
                <div v-for="item in langList" :key="item.value">
                    <div class="flex justify-between align-middle">
                        <span>{{ item.label }}</span>
                        <t-button size="small" shape="circle" theme="primary" @click="handleAddSection(item.suffix)">
                            <template #icon> <t-icon  name="plus"></t-icon></template>
                        </t-button>
                    </div>
                    <div class="flex flex-col gap-2 my-2">
                         <div class="grid grid-cols-[1fr_1fr_1fr_40px] gap-2" v-if="localeSectionItems(item.suffix).length > 0"
                        v-for="(sectionItem, index) in localeSectionItems(item.suffix)">
                        <div>
                            <t-form-item :label-width="0" :name="`section_${item.suffix}[${index}].color`">
                                <t-select :options="colorOptions" v-model="sectionItem.color"></t-select>
                            </t-form-item>
                        </div>
                        <div>
                            <t-select ></t-select>
                        </div>
                        <div> <t-select></t-select></div>
                        <div class="flex justify-end items-center">
                            <t-button size="small" shape="circle" theme="danger"
                                @click="handleRemoveSection(item.suffix, index)">
                                <template #icon> <t-icon size='16px' name="minus"></t-icon></template>
                            </t-button>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </t-form>
    </t-dialog>
</template>
<script setup lang="ts">
import { ref, shallowRef,watch } from 'vue'
import { type TdFormProps, type FormInstanceFunctions } from 'tdesign-vue-next'
import { useLang } from '@/hooks/useLang'

type Props = {
    title: string
    disabled?: boolean
}
type SelectionItem = {
    color: string
    type: string
    slug: string
}
const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    title: '',
})
const formRef = shallowRef<FormInstanceFunctions>()
const visible = ref(false)
const model = defineModel<Record<string, SelectionItem[]>>({ default: () => ({}) })
const formData = ref<Record<string, SelectionItem[]>>({})
const [langList] = useLang()

const colorOptions=[{
    label:'红色',
    value:'red',
},{
    label:'绿色',
    value:'green',
}]
const localeSectionItems = (local: string): SelectionItem[] => {
    const items = formData.value[`section_${local}`]
    return items || []
}
const handleOpen = () => {
    visible.value = true
    formData.value = { ...model.value }
}
const handleConfirm = () => {
    formRef.value.submit()
}
const handleClose = () => {
    visible.value = false
}
const handleSubmit: TdFormProps['onSubmit'] = (e) => {
    model.value = { ...formData.value }
    visible.value = false
}
// 一键填充
const handleAutoFill = () => {
    langList.value.forEach((item, i) => {
        if (i > 0) {
            formData.value['text_' + item.suffix] = formData.value['text_' + langList.value[0].suffix]
        }
    })
}
watch(()=>formData.value,(v)=>{
    console.log('formData change',v)
},{deep:true})
const handleAddSection = (suffix: string) => {
    if (!formData.value[`section_${suffix}`]) {
        formData.value[`section_${suffix}`] = []
    }

    formData.value[`section_${suffix}`].push({
        slug: '',
        type: 'text',
        color: ''
    })
}
const handleRemoveSection = (suffix: string, index: number) => {
    formData.value[`section_${suffix}`].splice(index, 1)
}
defineOptions({
    name: 'LabelSection',
})
</script>
