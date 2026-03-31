<script setup lang="ts">
import { ref,onBeforeUnmount,onUnmounted } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import BasicInfo from './components/Product/BasicInfo/index.vue'
import ShoppingGuides from './components/Product/ShoppingGuides/index.vue'
import NewShoppingGuides from './components/Product/ShoppingGuides2/index.vue'
import SubNav from './components/Product/SubNav/index.vue'
import Video from './components/Product/Video/index.vue'
import { useRoute,useRouter ,onBeforeRouteLeave} from 'vue-router';
import { nextTick } from 'process';
import { MessagePlugin } from 'tdesign-vue-next';
import MainLayout from './components/Layouts/MainLayout.vue'
const route=useRoute()
const router=useRouter()
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
        label:'ShoppingGuides',
        component:ShoppingGuides
    },{
        value:'new_shopping_guides',
        label:'NewShoppingGuides',
        component:NewShoppingGuides
    },
    {
        value:'sub_nav',
        label:'SubNav',
        component:SubNav
    },
    {
        value:'video',
        label:'Video',
        component:Video
    }
]
// const currentPageTab=computed(()=>{
//     return route.query.tab as string || tabs[0].value
// })
const activeTab=ref(route.query.tab as string || tabs[0].value)
const handleTabChange=(value:string)=>{
    activeTab.value=value
   // localStorage.setItem('app_active_tab',value)
   router.replace({
        query:{
            ...route.query,
            tab:value
        }
   })
}
const breadcrumbOptions= [
        {
            content:'首页',
            to:'/'
        },{
            content:'产品编辑列表',
            to:'/product/edit'
        },
        {
            content:'编辑产品'
        }
    ]
// defineOptions({
//     beforeRouteEnter:((to, from, next) => {
//         console.log('beforeRouteEnter',to, from, next)
//       //  next()
//         // if(! to.query.id){
//         //     next('/error-page')
//         // }else{
//         //     next()
//         // }
//         next()
//     })
// })
</script>
<template>
    <MainLayout show-lang title="Edit" layout="empty" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
                    <t-button theme="primary">返回</t-button>
        </template>
        <t-tabs :value="activeTab" placement="left" @change="handleTabChange" class="p-tabs" theme="normal" default-value="basic" >
                    <t-tab-panel :destroy-on-hide="true" v-for="tab in tabs" :key="tab.value" :value="tab.value" :label="tab.label">
                    <component :is="tab.component" />
                    </t-tab-panel>
        </t-tabs>
    </MainLayout>
</template>
<style lang="css" scoped>   
    .p-tabs{
        background-color: transparent!important;
        height: 100%;
        position: relative;
    }
    .p-tabs>:deep(.t-tabs__header){
        background-color: #fff;
        border-radius: 4px;
        position: sticky;
        top:0;
        margin-right: 8px;
    }
    .p-tabs>:deep(.t-tabs__content){
        background-color: #fff;
        border-radius: 4px;
        min-height: 100%; 
    }
</style>