<script setup lang="ts">
import { ref } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import BasicInfo from './components/Product/BasicInfo/index.vue'
import { useRoute ,onBeforeRouteLeave} from 'vue-router';
import { nextTick } from 'process';
import { MessagePlugin } from 'tdesign-vue-next';
const route=useRoute()
const productId=route.query.id
const tabs=[
    {
        value:'basic_info',
        label:'BasicInfo',
        component:BasicInfo
    },
    {
        value:'techs_pecs',
        label:'TechSpecs'
    },
    {
        value:'faq',
        label:'FAQ'
    },{
        value:'shopping_guides',
        label:'ShoppingGuides'
    }
]
const activeTab=ref(localStorage.getItem('app_active_tab')||tabs[0].value)
const handleTabChange=(value:string)=>{
    activeTab.value=value
    localStorage.setItem('app_active_tab',value)
}
defineOptions({
    beforeRouteEnter:((to, from, next) => {
        console.log('beforeRouteEnter',to, from, next)
      //  next()
        // if(! to.query.id){
        //     next('/error-page')
        // }else{
        //     next()
        // }
        next()
    })
})
</script>
<template>
    <EditLayout lang-type='button' title="Edit">
        <template #actions>
                    <t-button theme="primary">返回</t-button>
        </template>
        <t-tabs :value="activeTab" @change="handleTabChange" class="tabs" theme="normal" default-value="basic" >
                    <t-tab-panel v-for="tab in tabs" :key="tab.value" :value="tab.value" :label="tab.label">
                    <component :is="tab.component" />
                    </t-tab-panel>
        </t-tabs>
    </EditLayout>
</template>
<style lang="css" scoped>   
    
</style>