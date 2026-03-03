<script setup lang="ts">
import { reactive, toRaw,ref,shallowRef } from 'vue'
import GuideBlock from './GuideBlock.vue'
import RecommendedBlock from './RecommendedBlock.vue'

const formData = reactive({
    showShoppingGuide: 0,
    backgroundColor: '#ffffff',
    themeColor: 'white',
})
const guideList = shallowRef([])
const rules = {

}
const handleSubmit = (e) => {
    console.log('submit', toRaw(formData))
}
const handleAddGuideBlock=()=>{
    guideList.value=[...guideList.value,1]
    console.log('fffff')
}
</script>

<template>
    <t-form class="w-full" @submit="handleSubmit" :data="formData" :rules="rules" label-align="top" layout='vertical'>
        <div class="py-4 px-4">
            <div class="grid grid-cols-2 w-full">
                <t-form-item label="Background color" name="backgroundColor">
                    <t-color-picker v-model="formData.backgroundColor" />
                </t-form-item>
                <t-form-item label="Show shopping guide" name="showShoppingGuide">
                    <t-switch v-model="formData.showShoppingGuide" :custom-value="[1, 0]" :label="['ON', 'OFF']" />
                </t-form-item>
            </div>
            <t-form-item label="Theme color" name="themeColor">
                <t-radio-group v-model="formData.themeColor"
                    :options="[{ label: 'White', value: 'white' }, { label: 'Black', value: 'black' }]">
                </t-radio-group>
            </t-form-item>
        </div>
        <t-collapse class="content" default-expand-all expand-icon-placement="right" borderless>
            <t-collapse-panel value="0">
                <template #header>
                    <div class="header">Guide</div>
                </template>
                <template #headerRightContent>
                    <t-button @click="handleAddGuideBlock" theme="primary" variant="base" size="small" type="submit">Add Guide</t-button>
                </template>
                <div v-for="(guide,index) in guideList" :key="index"  class="guide-block" >
                    <GuideBlock></GuideBlock>
                </div>
            </t-collapse-panel>
        </t-collapse>

        <t-form-item>
           <t-space class="ml-4 mt-4">
             <t-button theme="primary" type="submit">提交</t-button>
           </t-space>
        </t-form-item>


    </t-form>
</template>
<style lang="css" scoped>
.header {
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}
.content :deep(.t-collapse-panel__content){
    background-color: rgba(0,0,0,0.1)!important;
    padding: 16px!important;
}
.guide-block{
    background-color: #fff;
    padding: 16px;
}
.guide-block:nth-of-type(n+2){
    margin-top: 16px;
}

</style>