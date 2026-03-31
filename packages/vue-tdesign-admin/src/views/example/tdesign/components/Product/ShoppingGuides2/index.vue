<script setup lang="ts">
import { reactive, toRaw,ref,shallowRef, shallowReactive,provide} from 'vue'
import GuideBlock from './GuideBlock.vue'
import RecommendedBlock from './RecommendedBlock.vue'

const formData = reactive({
    showShoppingGuide: 0,
    backgroundColor: '#ffffff',
    themeColor: 'white',
    guideList:[],
    recommendedContent:[]
})

const rules = {

}
const fastAccessOptions=shallowRef([])
provide('guidedata',{
fastAccessOptions
})
setTimeout(()=>{
    fastAccessOptions.value=[
        {
            name:'BuyNow',
            buttonTitle:'Buy Now',
            linkTitle:'Buy Now',
            linkType:'url',
            gaLabel:'Buy Now'
        }
    ]
},5000)
const handleSubmit = (e) => {
    console.log('submit', toRaw(formData))
}
const handleAddGuideBlock=()=>{
    formData.guideList.push({
        title:'',
        cover:'',
        slogan:'',
        highlight:[],
        primaryButtonTitle:'',
        primaryLinkTitle:'',
        primaryLinkType:'',
        gaLabel:'',
        secondaryButton:[]
    })
    //   formData.guideList=[...formData.guideList,{
    //     title:'',
    //     cover:'',
    //     highlight:[]
    // }]
}
const handleRemoveGuide=(index:number)=>{
    formData.guideList.splice(index,1)
   //formData.guideList=formData.guideList.filter((v,i)=>i!==index)
}
const handleAddRecommended=()=>{
    formData.recommendedContent.push({
        icon: '',
        countries:[],
        title:'',
        actionName:'',
        link:'',
        gaLabel:'',
        description:''
    })
}
const handleRemoveRecommended=(index:number)=>{
    formData.recommendedContent.splice(index,1)
}
</script>

<template>
    <t-form class="w-full" @submit="handleSubmit" :data="formData" :rules="rules" label-align="top" layout='vertical'>
        <div class="px-6 py-4">
              <t-form-item label="Background color" name="backgroundColor">
                    <t-color-picker :color-modes="['monochrome','linear-gradient']" :swatch-colors="['RGB']" enable-alpha format="HEX" v-model="formData.backgroundColor" />
                </t-form-item>

                 <t-form-item label="Show shopping guide" name="showShoppingGuide">
                    <t-switch v-model="formData.showShoppingGuide" :custom-value="[1, 0]" :label="['ON', 'OFF']" />
                </t-form-item>
            <t-form-item label="Theme color" name="themeColor">
                <t-radio-group v-model="formData.themeColor"
                    :options="[{ label: 'White', value: 'white' }, { label: 'Black', value: 'black' }]">
                </t-radio-group>
            </t-form-item>
     
        <t-collapse class="content" :borderless="false" default-expand-all expand-icon-placement="left"  :expand-on-row-click="false">
            <t-collapse-panel value="0">
                <template #header>
                    <div class="header">添加指南</div>
                </template>
                <template #headerRightContent>
                    <t-button @click="handleAddGuideBlock" theme="primary" variant="base" size="small" >添加</t-button>
                </template>
                <div v-for="(guide,index) in formData.guideList" :key="index"  class="block" >
                    <GuideBlock :prefix="`guideList[${index}]`" v-model="formData.guideList[index]"></GuideBlock>
                    <div class="flex justify-between mt-4">
                        <div></div>
                        <div>
                            <t-button theme="danger" @click="handleRemoveGuide(index)">Remove Guide</t-button>
                        </div>
                    </div>
                </div>
            </t-collapse-panel>
        </t-collapse>
        <t-collapse class="content !mt-8" :borderless="false" default-expand-all expand-icon-placement="left"  :expand-on-row-click="false">
            
            <t-collapse-panel value="1">
                <template #header>
                    <div class="header">Recommended content</div>
                </template>
                <template #headerRightContent>
                    <t-button @click="handleAddRecommended" theme="primary" variant="base" size="small" >Add Content</t-button>
                </template>
                <div v-for="(recommend,index) in formData.recommendedContent" :key="index"  class="block" >
                    <RecommendedBlock :prefix="`recommendedContent[${index}]`" v-model="formData.recommendedContent[index]"></RecommendedBlock>
                    <div class="flex justify-between mt-4">
                        <div></div>
                        <div>
                            <t-button theme="danger" @click="handleRemoveRecommended(index)">Remove Content</t-button>
                        </div>
                    </div>
                </div>
            </t-collapse-panel>
        </t-collapse>

        <div class="p-4">
             <t-space>
             <t-button theme="primary" type="submit">提交</t-button>
           </t-space>
        </div>
        </div>

    </t-form>
</template>
<style lang="css" scoped>
/* .header {
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
} */
/* .content :deep(.t-collapse-panel__content){
    background-color: rgba(0,0,0,0.1)!important;
    padding: 16px!important;
}
.block{
    background-color: #fff;                            
    padding: 16px;
}
.block:nth-of-type(n+2){
    margin-top: 16px;
} */
 .content{
    border-radius: 4px;
 }
 .content :deep(.t-collapse-panel__header){
    background-color:#f8f9fa!important;
    padding: 16px!important;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}
.content :deep(.t-collapse-panel__body){
    background-color: #fff;;
        border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 20px;
}
</style>