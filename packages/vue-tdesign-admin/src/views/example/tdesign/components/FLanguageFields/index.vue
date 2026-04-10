<script setup lang="ts">
import { reactive, ref, shallowRef, toRaw, watch } from 'vue'
import { useLang } from '@/hooks/useLang'
import { useDialog } from '@/hooks/useDialog'
import { FormInstanceFunctions } from 'tdesign-vue-next'
import { isObject } from 'lodash-es'
import {storeToRefs} from 'pinia'
type Props = {
    title: string
    btnText?: string
    width?: number
    type?: 'text' | 'textarea' | 'select'
    placeholder?: string
    options?: { label: string, value: string }[]
    fieldProps?: Record<string, any>
    defaultValue?: any
    rules?: any[]
}
const props = withDefaults(defineProps<Props>(), {
    width: 600,
    btnText: '编辑',
    type: 'text',
    defaultValue: '',
    fieldProps: () => ({})

})
const emit = defineEmits(['update:modelValue'])
const [allLang] = useLang()
const formRef = shallowRef<FormInstanceFunctions>()
const model = defineModel<Record<string, any>>({ default: () => ({}) })
const formData = ref({})

const bindInitialValue = (allLang:any[]) => {
    const value = toRaw(model.value)
    let initialValue:any = {}
    allLang.forEach((item) => {
        initialValue[item.value] = props.defaultValue
    })
    formData.value = isObject(value) ? { ...initialValue, ...value } : initialValue
}
watch(() => allLang.value, (val) => {
    if (val) {
        bindInitialValue(val)
    }
})
const handleOpen = () => {

    bindInitialValue(allLang.value)
    dialogInst.open()

}
const handleConfirm = async () => {
    const res = await formRef.value?.validate()
    if (res !== true) {
        return
    }
    const newValue = {}
    allLang.value.forEach((item) => {
        newValue[item.value] = formData.value[item.value] ?? props.defaultValue
    })
    model.value = newValue
    dialogInst.close()
}

const [dialogProps, dialogInst] = useDialog(() => {
    return {
        header: props.title,
        width: props.width,
        // footer:false,
        onConfirm: handleConfirm
    }
})

const handleChange = (name: string, value: any) => {
    formData.value[name] = value
}
</script>

<template>
    <slot :open="handleOpen">
        <t-button theme="default" @click="handleOpen">{{ btnText }}</t-button>
    </slot>
    <t-dialog v-bind="dialogProps">
        <t-form ref="formRef" :data="formData"  class="w-full" label-align="top">
            <t-form-item v-for="(item) in allLang" :key="item.value" :label="item.label" :rules="rules" :name="item.value">
                <slot :value="formData[item.value]" :change="handleChange.bind(null, item.value)">
                    <t-textarea v-if="type === 'textarea'" v-bind="fieldProps" v-model="formData[item.value]"
                        :placeholder="placeholder" />
                    <t-select v-else-if="type === 'select'" v-bind="fieldProps" v-model="formData[item.value]"
                        :options="options" :placeholder="placeholder" />
                    <t-input v-else v-bind="fieldProps" v-model="formData[item.value]" :placeholder="placeholder" />
                </slot>
            </t-form-item>
        </t-form>
    </t-dialog>
</template>