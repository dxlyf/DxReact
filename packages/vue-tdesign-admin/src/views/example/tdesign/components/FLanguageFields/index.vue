<script setup lang="ts">
import { computed, nextTick, reactive, ref, shallowRef, toRaw, toValue, unref, watch } from 'vue'
import { useLang } from '@/hooks/useLang'
import { useDialog } from '@/hooks/useDialog'
import { FormInstanceFunctions } from 'tdesign-vue-next'
import { cloneDeep, isObject } from 'lodash-es'
import {storeToRefs} from 'pinia'
import { useNormalizedModel } from 'src/hooks/useNormalizedModel2'
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
    initValue?:boolean
}
const props = withDefaults(defineProps<Props>(), {
    width: 600,
    btnText: '编辑',
    type: 'text',
    defaultValue: '',
    initValue:false,
    fieldProps: () => ({})

})
const emit = defineEmits(['update:modelValue'])
const [allLang] = useLang()
const formRef = shallowRef<FormInstanceFunctions>()
const model = defineModel<Record<string, any>>({ default: () => ({}) })
const formData = ref({})
const innerValue=ref({})
const bindInitialValue = (allLang:any[]) => {
 //   console.log('bindInitialValue', allLang)
    const value = toRaw(model.value)
    const obj=isObject(value)?value:{}
    let initialValue:any = {}
    allLang.forEach((item) => {
        if(obj[item.value]){
            initialValue[item.value] = obj[item.value]
        }else{
            initialValue[item.value] = props.defaultValue
        }
    })
    formData.value = initialValue
}

useNormalizedModel(model,{
    defaults:computed(()=>{
        return allLang.value.reduce((prev, cur) => {
            prev[cur.value] = ''
            return prev
        }, {})
    })
})


// 监听 model 变化，确保结构完整
// watch(
//   () => model.value,
//   (newVal) => {
//     if (newVal) {
//       // 如果缺少某些属性，补充默认值
//       const fullValue ={}
//       // 只有值发生变化时才更新，避免无限循环
//       if (JSON.stringify(newVal) !== JSON.stringify(fullValue)) {
//         model.value = fullValue
//       }
//     }
//   },
//   { immediate: true, deep: true }
// )
// watch(() => allLang.value, async (val) => {
//     if (val) {
//         bindInitialValue(val)
//         if(props.initValue){
//             const data=cloneDeep(toRaw(formData.value))
//         //    Object.assign(model.value,data)
//            // emit('update:modelValue',data)
//         //   console.log('更新model.value-before')
        
//            model.value=data
//           // Object.assign(model.value,data)
//             // console.log('更新model.value-after')
//           // await nextTick()
//           // console.log('initValue','model',toRaw(model.value),'data',data)
//         }
//     }
// },{immediate:true})
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