<template>
    <div @click="handleOpen"><slot v-bind="{disabled:disabled}"></slot></div>

    <t-dialog attach="body" :footer="!disabled" :destroy-on-close="true" :header="title" :visible="visible"
        @confirm="handleConfirm" @close="handleClose">
        <div class="flex justify-end mb-4">
            <t-button type='button' @click="handleAutoFill">用英文一键填充</t-button>
        </div>
        <t-form :required-mark="false" :disabled="disabled" :data="formData" @submit="handleSubmit" ref="formRef">
            <t-form-item :rules="[{ required: true, message: `请输入${item.label}标签文案` }]" v-for="item in langList"
                :key="item.value" :label="item.label" :name="`text_${item.suffix}`">
                <t-input placeholder="请输入标签文案" v-model="formData[`text_${item.suffix}`]" />
            </t-form-item>
        </t-form>
    </t-dialog>
</template>
<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { type TdFormProps, type FormInstanceFunctions } from 'tdesign-vue-next'
import { useLang } from '@/hooks/useLang'
type Props = {
    title: string
    disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    title: '',
})
const formRef = shallowRef<FormInstanceFunctions>()
const visible = ref(false)
const model = defineModel<Record<string, string>>({ default: () => ({}) })
const formData = ref<any>({})
const [langList] = useLang()

const handleOpen = () => {
    if(props.disabled){
        return
    }
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
    if (e.validateResult !== true) {
        return
    }
    model.value = { ...formData.value }
    visible.value = false
}
// 一键填充
const handleAutoFill = () => {
    const english = langList.value.find((item) => item.value === 'en-US')
    langList.value.forEach((item, i) => {
        if (item.value !== english.value) {
            formData.value['text_' + item.suffix] = formData.value['text_' + english.suffix]
        }
    })
}
defineOptions({
    name: 'LabelText',
})
</script>
