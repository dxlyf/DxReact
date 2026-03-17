<script lang="ts">
import { ref, watch, getCurrentInstance, getCurrentScope, reactive, useTemplateRef, defineComponent, useModel, type PropType, toRef, toRefs, computed, shallowRef, onMounted, onBeforeMount, shallowReactive, toRaw, customRef } from 'vue'
import type { TdFormItemProps } from 'tdesign-vue-next'
import { omit } from 'lodash-es'
import FField from './FField.vue';

export default defineComponent({
    name: 'FromField',
    components:{
        FField
    },
    props: {
        type: {
            type: String,
            default: 't-input'
        },
        label:{
            type:String
        },
        required: {
            type: Boolean,
            default: false
        },
        fieldProps: {
            type: Object,
            default: () => ({})
        },
        modelValue: {
        }
    },
    slots:{
        tips:{},
        label:{},
        help:{},
    },
    setup(props, { attrs, emit, slots, expose }) {
 
        const model = useModel(props, 'modelValue')
        const fieldRef = useTemplateRef<any>('fieldRef')
        const formItemRef = useTemplateRef('formItemRef')
        const fieldProps = computed(() => {
            return {
                modelValue: model.value,
                'onUpdate:modelValue': (val: any) => {
                    model.value = val
                },
                ...props.fieldProps,
            }
        })
        const formItemProps = computed(() => {
            return {
                ...(props.required?{
                    rules:[{required:true,message:'请输入'+props.label}]
                }:{}),
                label:props.label,
                ...attrs
            }
        })

        const parseSlots=()=>{
                const fieldSlots:any = {}
             const formItemSlots:any = {}
              Object.keys(slots).forEach((key) => {
                if (key.startsWith('field-')) {
                    fieldSlots[key.replace('field-', '')] = slots[key]
                }else{
                    formItemSlots[key] = slots[key]
                }
            })
            return {
                fieldSlots,
                formItemSlots
            }
        }
        const {fieldSlots,formItemSlots}=parseSlots()
        
        const curType = computed(() => {
            return props.type
        })
        const instance = getCurrentInstance()
        expose({
            formItemRef,
            fieldRef:computed(()=>{
                return fieldRef.value.fieldRef.value
            })
        })
        return {
            type: curType,
            fieldProps,
            formItemProps,
            fieldSlots,
            formItemSlots
        }
    }
})
</script>
<template>
    <t-form-item ref="formItemRef"  v-bind="formItemProps">
        <FField ref="fieldRef" :ctype="type" v-bind="fieldProps">
            <template v-for="(value, name, index) of fieldSlots" :key="name" #[name]="slotData">
                <slot v-if="name" :name="name" v-bind="slotData || {}" />
            </template>
        </FField>
        <template v-for="(value, name, index) of formItemSlots" :key="name" #[name]="slotData">
            <slot v-if="name" :name="name" v-bind="slotData || {}" />
        </template>
    </t-form-item>
</template>