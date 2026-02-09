<template>
    <t-button theme="default" @click="handleOpen">
        <slot></slot>
    </t-button>

    <t-dialog attach="body" width="600" :footer="!disabled" :destroy-on-close="true" :header="title" :visible="visible"
        @confirm="handleConfirm" @close="handleClose">
        <t-form :show-error-message="false" :disabled="disabled" :data="formData" @submit="handleSubmit" ref="formRef">
            <div class="flex flex-col gap-2">
                <div v-for="item in langList" :key="item.value">
                    <div class="flex justify-between align-middle">
                        <span>{{ item.label }}</span>
                        <t-button class="!size-5" shape="circle" theme="primary" @click="handleAddSection(item)">
                            <template #icon> <t-icon size="22" name="plus"></t-icon></template>
                        </t-button>

                    </div>
                    <div class="flex flex-col gap-2 my-2">
                        <div class="grid grid-cols-[100px_140px_1fr_40px] gap-2"
                            v-if="localeSectionItems(item.suffix).length > 0"
                            v-for="(sectionItem, index) in localeSectionItems(item.suffix)">
                            <div>
                                <t-form-item :rules="[{ required: true, message: '请选择颜色' }]" :label-width="0"
                                    :name="`section_${item.suffix}[${index}].color`">
                                    <t-select clearablefilterable :options="colorOptions" v-model="sectionItem.color"></t-select>
                                </t-form-item>
                            </div>
                            <div>
                                <t-form-item :rules="[{ required: true, message: '请选择类型' },{
                                    validator:(val,ctx)=>{
                                        
                                        const items=localeSectionItems(item.suffix)
                                        if(items.some((item,i)=>i!==index&&item.type===val)){
                                            return {
                                                message:`${item.label}有重复板块项`,
                                                result:false,
                                                type:'error'
                                            }
                                        }
                                        return true
                                    }
                                }]" :label-width="0"
                                    :name="`section_${item.suffix}[${index}].type`">
                                    <t-select clearable filterable :options="typeOptions" @change="sectionItem.slug = []"
                                        v-model="sectionItem.type"></t-select>
                                </t-form-item>
                            </div>
                            <div>
                                <t-form-item :rules="[{ required: true, message: '请选择Slug' }]" :label-width="0"
                                    :name="`section_${item.suffix}[${index}].slug`">
                                    <t-select clearable :min-collapsed-num="3" filterable multiple :options="getSlugOptions(sectionItem.type)"
                                        v-model="sectionItem.slug">
                                    </t-select>
                                </t-form-item>
                            </div>
                            <div class="flex justify-end items-center">
                                <t-button class="!size-5" shape="circle" theme="danger"
                                    @click="handleRemoveSection(item.suffix, index)">
                                    <template #icon> <t-icon size='22' name="minus"></t-icon></template>
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
import { ref, shallowRef, watch } from 'vue'
import { type TdFormProps, type FormInstanceFunctions, type TdSelectProps, MessagePlugin } from 'tdesign-vue-next'
import { useLang ,type LangItem} from '@/hooks/useLang'

type Props = {
    title: string
    disabled?: boolean
}
type SelectionItem = {
    locale: string
    color: string
    type: string
    slug: string[]
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

const colorOptions = [{
    label: '红色',
    value: 'red',
}, {
    label: '绿色',
    value: 'green',
}]
const typeOptions = [{
    label: '文本',
    value: 'text',
}, {
    label: '图片',
    value: 'image',
}]
const getSlugOptions = (type: string) => {
    if (type === 'text') {
        return [{
            label: 'Slug1',
            value: 'slug1',
        }, {
            label: 'Slug2',
            value: 'slug2',
        }, {
            label: 'Slug3',
            value: 'slug3',
        }, {
            label: 'Slug4',
            value: 'slug4',
        }, {
            label: 'Slug5',
            value: 'slug5',
        }, {
            label: 'Slug6',
            value: 'slug6',
        }]
    }else if(type === 'image'){
        return [{
            label: '图片Slug',
            value: 'image_slug',
        }]
    }
    return []
}

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
    if (e.validateResult !== true) {
        MessagePlugin.error((e.firstError))
        console.log('eee',e)
        return
    }
    model.value = { ...formData.value }
    visible.value = false
}

// watch(()=>formData.value,(v)=>{
//     console.log('formData change',v)
// },{deep:true})
const handleAddSection = (item:LangItem) => {
    if (!formData.value[`section_${item.suffix}`]) {
        formData.value[`section_${item.suffix}`] = []
    }

    formData.value[`section_${item.suffix}`].push({
        locale: item.value,
        slug:[],
        type: 'text',
        color: 'red'
    })
}
const handleRemoveSection = (suffix: string, index: number) => {
    formData.value[`section_${suffix}`].splice(index, 1)
}
defineOptions({
    name: 'LabelSection',
})
</script>
