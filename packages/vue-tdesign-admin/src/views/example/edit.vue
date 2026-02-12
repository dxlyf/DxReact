<template>
    <div class="bg-gray-100 flex flex-row flex-wrap p-4 gap-1">
        <div v-for="lang in langs" @click="curLang=lang" :class="[lang==curLang?'bg-sky-600 text-white hover:bg-sky-700':'hover:bg-gray-300']" class="bg-gray-200  h-6 w-20 text-center cursor-pointer rounded-md">{{lang }}</div>
    </div>
    <div class="mb-3">
        <t-breadcrumb>
            <t-breadcrumb-item>首页</t-breadcrumb-item>
            <t-breadcrumb-item>示例</t-breadcrumb-item>
            <t-breadcrumb-item>编辑</t-breadcrumb-item>
        </t-breadcrumb>
    </div>
    
    <t-card :loading="loading" :loading-props="{attach:'body',fullscreen:true,text:'提交中...',showOverlay:false}" title="编辑" header-bordered :bordered="false">
        <t-form class="w-md" layout='vertical' label-align='top' :data="formData" @submit="handleSubmit" :rules="rules">
                    <t-form-item  label="id" name="name">
                   <t-input v-model="formData.id"></t-input>
                </t-form-item>  
            <t-form-item  label="标签文案" name="text">
                    <label-text v-slot="textProps"  title="标签文案" v-model="formData.text">
                        <t-button v-bind="textProps">编辑</t-button>
                    </label-text>
                </t-form-item>
                <t-form-item  label="标签板块" name="labelSection">
                    <label-section title="标签板块" v-slot="sectionProps" v-model="formData.labelSection">
                                     <t-button v-bind="sectionProps">编辑</t-button>
                    </label-section>
                </t-form-item>
                <t-form-item label="" name="countryPublish">
                    <country-publish prefix="countryPublish" v-model="formData.countryPublish"></country-publish>
                </t-form-item>
                <t-form-item label="国家" name="country">
                     <country-select v-model="formData.country"></country-select>
                </t-form-item>
        
                <t-form-item>
                    <t-space>
                    <t-button theme="primary" type="submit">保存</t-button>
                    <t-button theme="default" @click="handleBack">返回</t-button>
                </t-space>
                </t-form-item>
    </t-form>
</t-card>
<t-dialog v-bind="dialogProps">
</t-dialog>
</template>
<script setup lang="ts">
import { type FormRules,type BreadcrumbItemProps, MessagePlugin} from 'tdesign-vue-next'
import { onMounted, reactive, ref, shallowReactive ,shallowRef,Teleport, watch} from 'vue'
import { useRoute,useRouter,onBeforeRouteUpdate } from 'vue-router'
import { useDialog } from '@/hooks/useDialog'
import LabelText from '@/components/label-text/index.vue'
import LabelSection from '@/components/label-section/index.vue'
import CountryPublish from '@/components/country-publish/index.vue'
import CountrySelect from '@/components/country-select/index.vue'
import { delay } from 'src/utils'

const title=ref('选择国家')
const [dialogProps,dialogCountry]=useDialog(()=>({
    header:title.value,
}))
const disbaledText=shallowRef(false)
const router = useRouter()
const route = useRoute()
const params = route.params
const loading=shallowRef(false)
const formData=shallowReactive<any>({
    theme:'primary',
})

const rules:FormRules={
    text:[{message:'请填写文案',required:true,}],
  //  country:[{message:'请选择国家',required:true}]
}
setTimeout(()=>{
    disbaledText.value=true
},2000)
const langs=['zh','en']
const curLang=ref(langs[0])
watch(curLang,(newVal,oldVal)=>{
    router.replace({
        path:route.path,
        query:{
            lang:newVal,
        }
     })
})

watch(()=>route.query.lang,(newVal,oldVal)=>{
    console.log('newVal',newVal)
})
const handleBack=()=>{
    router.replace('/example/components/list')
}

onBeforeRouteUpdate((to,from)=>{
    console.log('beforeRouteUpdate',to)
})
onMounted(()=>{
    console.log('onMounted',route.query.lang)
})

const handleSubmit=async (e)=>{
   
    console.log('submit',{...formData})
    if(e.validateResult!==true){
        MessagePlugin.error(e.firstError)
        return
    }
    console.log('submit完成')
    // loading.value=true
    // await delay(100000)
    // loading.value=false
}
</script>