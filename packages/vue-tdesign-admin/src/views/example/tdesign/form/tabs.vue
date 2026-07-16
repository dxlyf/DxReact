<script setup lang="ts">
import { shallowRef, reactive,shallowReactive } from 'vue';



const contactTypes = shallowRef([
    {
        label: '在线联系人',
        value: 'online'
    },
    {
        label: '电话',
        value: 'phone'
    },
    {
        label: '二维码',
        value: 'qrCode'
    }, {
        label: '小程序',
        value: 'miniProgram'
    }, {
        label: '邮件',
        value: 'email'
    }, {
        label: '论坛',
        value: 'forum'
    }, {
        label: '微信平台',
        value: 'wechat'
    }
])
const activeType = shallowRef(contactTypes.value[0].value)
const activeFroms = reactive<Record<string, number>>({})
type ModelItem = {
    type: string
    id: string
    title: string
    value: string
    isNew: boolean

}
const model = defineModel<Record<string, ModelItem[]>>({
    default: () => {
        return {}
    }
})
const getForms = (type: string) => {
    if (!model.value[type]) {
        model.value[type] = []
    }
    return model.value[type]
}
const getTypeCount = (type: string) => {
    return getForms(type).length
}
const addForm = (type: string) => {
    const item: ModelItem = {
        type,
        id: Math.random().toString(36).slice(-8),
        value: '',
        title: '',
        isNew: true
    }
    model.value[type].push(item)
    activeType.value = type
    activeFroms[type] = getForms(type).length - 1
  //  console.log('mm', model.value, activeFroms[type], 'activeType', activeType.value)
   // console.log('formRefs',formRefs)

}
const removeForm = (type: string, index: number) => {
    return model.value[type].splice(index, 1)
}
const getFormTabLabel = (categoryType: string, item: ModelItem, index: number) => {
    const title = !item.title ? '新分组' : item.title
    return `【${categoryType}】 ${title} #${index + 1}`
}
const formRefs = new Map<string,any>()
const setFormRefMap = (id: string) => {
    return (el:any)=>{
        if(el){
               console.log('add',el)
           formRefs.set(id,el)
        }else{
            console.log('delete',id)
            formRefs.delete(id)
        }
    }
}



</script>

<template>
    <div class="flex gap-2">
        <t-button v-for="ct in contactTypes" @click="addForm(ct.value)" :key="ct.value" theme="primary"
            variant="outline" size="small">+{{ ct.label }}</t-button>
    </div>
    <t-tabs v-model="activeType" :disabled="getTypeCount(activeType) === 0">
        <t-tab-panel v-for="ct in contactTypes" :destroy-on-hide="false" :key="ct.value" :value="ct.value"
            :label="`${ct.label} (${getTypeCount(ct.value)})`">
            <template v-if="getForms(ct.value).length > 0">
                <t-tabs v-model="activeFroms[ct.value]" @remove="e => removeForm(ct.value, e.index)">
                    <t-tab-panel :destroy-on-hide="false" v-for="(item, index) in getForms(ct.value)" :key="item.id"
                        :value="index">
                        <template #label>
                            <span class="truncate inline-block max-w-[200px] align-middle" :title="item.title">
                                {{ getFormTabLabel(ct.label, item, index) }}
                            </span>
                        </template>
                        <div class="bg-gray-100 p-2">
                            <div class="bg-white rounded px-4 pt-4 pb-8">
                                <t-form :ref="setFormRefMap(item.id)" label-align="top" :data="item">
                                    <t-form-item label="标题" name="title">
                                        <t-input v-model="item.title" />
                                    </t-form-item>
                                </t-form>
                            </div>
                        </div>
                    </t-tab-panel>
                </t-tabs>
            </template>
        </t-tab-panel>
    </t-tabs>
</template>