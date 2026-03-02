<script setup lang="ts">
import {reactive,ref,shallowReactive, shallowRef, toRaw} from 'vue'
import {Dialog,Drawer} from 'tdesign-vue-next'
type Props={
    disabled?:boolean
}
type CountryItem={
    locale:string
    value:string 
    label:string
}
type Region={
    title:string
    countries:CountryItem[]
}
const props=defineProps<Props>()
const model=defineModel<string[]>({default:[]})
const selectedValues=ref<string[]>([])

const visible=shallowRef(false)
const regions=reactive<Region[]>([{
    title:'中文地区',
    countries:[{
        locale:'cn',
        label:'china',
        value:'china'
    },{
        locale:'cn',
        label:'hongxong',
        value:'hongxong'
    }]
},{
    title:'英文地区',
    countries:[{
        locale:'us',
        label:'us',
        value:'us'
    }]
}])
const handleOpen=()=>{
     visible.value=true
     selectedValues.value=[...toRaw(model.value)]
}
const handleConfirm=()=>{
    model.value=[...toRaw(selectedValues.value)]
    //console.log('toRaw(selectedValues.value)',toRaw(selectedValues.value))
    visible.value=false
}
const handleClose=()=>{
    selectedValues.value=[]
    visible.value=false
}
</script>

<template>
    <div>
        <slot v-bind="{onClick:handleOpen,disabled:disabled}">
            <t-button @click="handleOpen"  theme="default" :disabled="disabled">选择</t-button>
        </slot>
        <t-dialog attach="body" width="70%" :visible="visible" @close="handleClose" @confirm="handleConfirm">
            <t-checkbox-group v-model="selectedValues">
                <div v-for="(r,index) in regions" :key="index">
                    <div class="text-base border-b py-4 border-gray-200">
                    {{ r.title }}
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <div v-for="c in r.countries" :key="c.value" class="w-40 p-2 border rounded-md flex justify-between items-center border-gray-200">
                          <span>{{ c.label }}</span>
                          <div class="flex items-center gap-1">
                            <span>{{ c.locale }}</span>
                            <t-checkbox :value="c.value"></t-checkbox>
                          </div>
                        </div>
                    </div>

                </div>
            </t-checkbox-group>
        </t-dialog>
    </div>
</template>