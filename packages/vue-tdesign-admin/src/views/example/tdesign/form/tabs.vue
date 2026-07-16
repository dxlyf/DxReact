<script setup lang="ts">
import { shallowRef, reactive, toRaw, watch } from 'vue'
import FUploadCover from '../components/FUpload/FUploadCover2.vue'
import { MessagePlugin } from 'tdesign-vue-next'

type Props = {
    destroyOnHide?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    destroyOnHide: true
})
const model = defineModel<Record<string, ModelItem[]>>({
    default: () => ({})
})

export type GroupItem = {
    id: string
    title: string
    icon: string
    remark: string
    isNew: boolean
}

export type ModelItem = {
    type: string
    id: string
    title: string
    icon: string
    desc: string
    linkText: string
    linkUrl: string
    telephone: string
    isNew: boolean
    groups?: GroupItem[]
    activeGroupId?: string
}

const contactTypes = shallowRef([
    { label: '在线联系人', value: 'online' },
    { label: '电话', value: 'phone' },
    { label: '二维码', value: 'qrCode' },
    { label: '小程序', value: 'miniProgram' },
    { label: '邮件', value: 'email' },
    { label: '论坛', value: 'forum' },
    { label: '微信平台', value: 'wechat' }
])

const activeType = shallowRef(contactTypes.value[0].value)
const activeFroms = reactive<Record<string, string>>({})

const fromData = reactive<Record<string, ModelItem[]>>({})

// 父组件数据 → 本地 fromData（初始同步完成后停止监听，避免循环）
// let locked=false
// const stopSync = watch(model, (val) => {
//   if (val && Object.keys(val).length > 0) {
//     Object.assign(fromData, JSON.parse(JSON.stringify(val)))
//     stopSync()
//   }
// }, { immediate: true, deep: true })

// 本地编辑 → 父组件
watch(fromData, (newVal) => {
    model.value = {...toRaw}
}, { deep: true })

const getForms = (type: string) => {
    if (!fromData[type]) {
        fromData[type] = []
    }
    return fromData[type]
}

const getTypeCount = (type: string) => getForms(type).length

const addForm = (type: string) => {
    const item: ModelItem = {
        type,
        id: Math.random().toString(36).slice(-8),
        title: '',
        icon: '',
        desc: '',
        linkText: '',
        linkUrl: '',
        telephone: '',
        isNew: true,
        groups: []
    }
    fromData[type].push(item)
    activeType.value = type
    activeFroms[type] = item.id
}

const removeForm = (type: string, id: string) => {
    const forms = getForms(type)
    const currentIndex = forms.findIndex(item => item.id === activeFroms[type])
    const targetIndex = forms.findIndex(item => item.id === id)
    
    if (currentIndex === targetIndex) {
        activeFroms[type] = currentIndex > 0 
            ? forms[currentIndex - 1].id 
            : forms[currentIndex + 1]?.id
    }
    forms.splice(targetIndex, 1)
}

const addGroup = (parent: ModelItem) => {
    const group: GroupItem = {
        id: Math.random().toString(36).slice(-8),
        title: '',
        icon: '',
        remark: '',
        isNew: true
    }
    parent.groups.push(group)
    parent.activeGroupId = group.id
}

const removeGroup = (parent: ModelItem, id: string) => {
    const currentIndex = parent.groups.findIndex(item => item.id === parent.activeGroupId)
    const targetIndex = parent.groups.findIndex(item => item.id === id)
    
    if (currentIndex === targetIndex) {
        parent.activeGroupId = currentIndex > 0 
            ? parent.groups[currentIndex - 1].id 
            : parent.groups[currentIndex + 1]?.id
    }
    parent.groups.splice(targetIndex, 1)
}

const getFormTabLabel = (categoryType: string, item: ModelItem, index: number) => {
    const title = item.isNew ? `新${categoryType}` : item.title
    return `${title} #${index + 1}`
}

const getGroupTabLabel = (item: GroupItem, index: number) => {
    const title = item.isNew ? '新子分组' : item.title
    return `${title} #${index + 1}`
}

const isNullOrEmpty = (value: any) => 
    value === undefined || value === null || value === ''

const validateGroups = (typeName: string, index: number, group: GroupItem) => {
    if (isNullOrEmpty(group.title)) {
        return `【${typeName}-分组 #${index + 1}】标题不能为空`
    }
    return ''
}

const validateForm = (typeName: string, index: number, item: ModelItem) => {
    if (isNullOrEmpty(item.title)) {
        return `【${typeName}】#${index + 1} 标题不能为空`
    }
    
    if (Array.isArray(item.groups) && item.groups.length > 0) {
        for (const group of item.groups) {
            const msg = validateGroups(typeName, index, group)
            if (msg) return msg
        }
    }
    return ''
}

const validate = () => {
    const modelValues = toRaw(fromData)
    for (const [type, forms] of Object.entries(modelValues)) {
        const typeName = contactTypes.value.find(item => item.value === type)?.label || type
        for (const [index, item] of forms.entries()) {
            const msg = validateForm(typeName, index, item)
            if (msg) {
                return msg
            }
        }
    }
    return true
}
const bindData = (data: Record<string, ModelItem[]>) => {
    Object.assign(fromData, JSON.parse(JSON.stringify(data)))
    let setActiveType=false
    for(const [type,forms] of Object.entries(fromData)){
        if(forms.length>0){
            activeFroms[type]=forms[0].id
            if(!setActiveType){
                activeType.value=type
                setActiveType=true
            }
        }else{
            activeFroms[type]=''
        }
    }
    if(!setActiveType){
        activeType.value=contactTypes.value[0].value
    }
}
defineExpose({ validate,bindData })
</script>

<template>
    <div class="flex gap-2 mb-2">
        <t-button 
            v-for="ct in contactTypes" 
            @click="addForm(ct.value)" 
            :key="ct.value" 
            theme="primary"
            variant="outline" 
            size="small"
        >
            +{{ ct.label }}
        </t-button>
    </div>
    
    <t-tabs v-model="activeType">
        <t-tab-panel 
            v-for="ct in contactTypes" 
            :destroy-on-hide="destroyOnHide"
            :disabled="getTypeCount(ct.value) === 0" 
            :key="ct.value" 
            :value="ct.value"
            :label="`${ct.label} (${getTypeCount(ct.value)})`"
        >
            <template v-if="getForms(ct.value).length > 0">
                <t-tabs 
                    v-model="activeFroms[ct.value]" 
                    @remove="e => removeForm(ct.value, e.value as string)"
                >
                    <t-tab-panel 
                        v-for="(item, index) in getForms(ct.value)"
                        :key="item.id" 
                        :value="item.id"
                        removable 
                        :destroy-on-hide="destroyOnHide"
                    >
                        <template #label>
                            <span 
                                class="truncate inline-block max-w-[200px] align-middle"
                                :title="getFormTabLabel(ct.label, item, index)"
                            >
                                {{ getFormTabLabel(ct.label, item, index) }}
                            </span>
                        </template>
                        
                        <div class="bg-gray-100 p-2">
                            <div class="bg-white rounded px-4 pt-4 pb-8">
                                <t-form label-align="top" :data="item">
                                    <t-form-item label="标题" name="title" :rules="[{ required: true, message: '请输入标题' }]">
                                        <t-input v-model="item.title" />
                                    </t-form-item>
                                    <t-form-item label="图标" name="icon">
                                        <FUploadCover v-model="item.icon" />
                                    </t-form-item>
                                    <t-form-item label="描述" name="desc">
                                        <t-input v-model="item.desc" />
                                    </t-form-item>
                                    <t-form-item label="链接文本" name="linkText">
                                        <t-input v-model="item.linkText" />
                                    </t-form-item>
                                    <t-form-item label="链接地址" name="linkUrl">
                                        <t-input v-model="item.linkUrl" />
                                    </t-form-item>
                                    <t-form-item label="电话号码" name="telephone">
                                        <t-input v-model="item.telephone" />
                                    </t-form-item>

                                    <div class="mb-2">
                                        <t-button theme="primary" variant="outline" size="small" @click="addGroup(item)">
                                            添加分组
                                        </t-button>
                                    </div>

                                    <t-tabs 
                                        v-model="item.activeGroupId"
                                        @remove="e => removeGroup(item, e.value as string)"
                                    >
                                        <t-tab-panel 
                                            v-for="(group, groupIndex) in item.groups" 
                                            :key="group.id"
                                            :value="group.id" 
                                            removable
                                        >
                                            <template #label>
                                                <span 
                                                    class="truncate inline-block max-w-[200px] align-middle"
                                                    :title="getGroupTabLabel(group, groupIndex)"
                                                >
                                                    {{ getGroupTabLabel(group, groupIndex) }}
                                                </span>
                                            </template>
                                            <t-form-item label="分组标题" :name="`groups[${groupIndex}].title`" :rules="[{ required: true, message: '请输入分组标题' }]">
                                                <t-input v-model="group.title" />
                                            </t-form-item>
                                            <t-form-item label="分组描述" :name="`groups[${groupIndex}].remark`">
                                                <t-input v-model="group.remark" />
                                            </t-form-item>
                                        </t-tab-panel>
                                    </t-tabs>
                                </t-form>
                            </div>
                        </div>
                    </t-tab-panel>
                </t-tabs>
            </template>
        </t-tab-panel>
    </t-tabs>
</template>
