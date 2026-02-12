<script setup lang="ts">
import {reactive,shallowReactive, shallowRef} from 'vue'
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

const visible=shallowRef(false)
const regions=reactive<Region[]>([{
    title:'yz',
    countries:[{
        locale:'cn',
        label:'xjp',
        value:'xjp'
    }]
}])
const handleOpen=()=>{
     visible.value=true
}
const handleConfirm=()=>{

}
const handleClose=()=>{
    visible.value=false
}
</script>

<template>
    <div>
        <slot v-bind="{onClick:handleOpen,disabled:disabled}">
            <t-button @click="handleOpen"  theme="default" :disabled="disabled">选择</t-button>
        </slot>
        <t-dialog attach="body" width="70%" :visible="visible" @close="handleClose" @confirm="handleConfirm">
            <div>
                <div v-for="(r,index) in regions" :key="index">
                    <div class="text-base border-b py-4 border-gray-200">
                    {{ r.title }}
                    </div>
                    <div class="mt-4">
                        <div v-for="c in r.countries" :key="c.value" class="w-40 p-2 border rounded-md flex justify-between items-center border-gray-200">
                          <span>{{ c.locale }}</span>
                          <div class="flex items-center gap-1">
                            <t-checkbox :value="c.value"></t-checkbox>
                          </div>
                        </div>
                    </div>

                </div>
            </div>
        </t-dialog>
    </div>
</template>