<script setup lang="ts">
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { computed,ref,customRef, toRaw, type PropType, shallowRef, inject,watch} from 'vue'
type SecondaryButtonItem={
    title:string
    link:string
    linkType:string
}
type FormData = {
    title: string
    cover: string
    highlight: string[]
    slogan:string
    primaryButtonTitle:string
    primaryLinkTitle:string
    primaryLinkType:string
    gaLabel:string
    secondaryButton:SecondaryButtonItem[]
}
type FastAccessOption={
    name:string
    buttonTitle:string
    linkTitle:string
    linkType:string
    gaLabel:string
}
type Props={
    prefix?:string
    modelValue:FormData
}
const props=withDefaults(defineProps<Props>(),{
    prefix:'guideList'
})
const fastAccessOptions=shallowRef<FastAccessOption[]>([
    {
        name:'BuyNow',
        buttonTitle:'购买',
        linkTitle:'/buy',
        linkType:'relative-path',
        gaLabel:'fdfd'
    },
    {
        name:'WhereToBuy',
        buttonTitle:'cdddd',
        linkTitle:'aa',
        linkType:'absolute-path',
        gaLabel:''
    },
    {
        name:'ContactUs',
        buttonTitle:'ac',
        linkTitle:'',
        linkType:'relative-path',
        gaLabel:''
    },
    {
        name:'ReserveNow',
        buttonTitle:'fa',
        linkTitle:'bsa',
        linkType:'absolute-path',
        gaLabel:'fd'
    },
])
const formData = defineModel<FormData>({ default: ()=>({
    title:'',
    cover:'',
    slogan:'',
    highlight:[],
    primaryButtonTitle:'',
    primaryLinkTitle:'',
    primaryLinkType:'',
    gaLabel:'',
    secondaryButton:[]
}) })

const LinkTypeOptions=shallowRef([{ label: '相对链接', value: 'relative-path' }, { label: '绝对链接', value: 'absolute-path' },{ label: '商城相对链接', value: 'store-link' }])


// const highlight=customRef((track,trigger)=>{
//         return {
//             get(){
//                 console.log('get',toRaw(formData.value))
//                 track()
//                 return Array.isArray(formData.value.highlight)?formData.value.highlight:[]
//             },
//             set(val){
//                 formData.value.highlight=val
//                 trigger()
//             }
//         }
// })
// const highlight=computed({
//     get(){
//         console.log('get')
//         return Array.isArray(formData.value.highlight)?formData.value.highlight:[]
//     },
//     set(val){
//         formData.value.highlight=[...val]
//     }
// })
const emit=defineEmits()
const highlightJson=computed(()=>{
    try{
        return JSON.stringify(formData.value.highlight)
    }catch(e){
        return ''
    }
})
const handleAddHiglight=()=>{
    formData.value.highlight.push('')
    if(formData.value.highlight.length<3){
        handleAddHiglight()
    }
}
const visibleDelHighlight=computed(()=>{
    return formData.value.highlight.length>3
})
const handleAddSecondaryItem=()=>{
    formData.value.secondaryButton.push({
        title:'',
        link:'',
        linkType:'relative-path'
    })
}
const handleFilledPrimaryBlock=(item:FastAccessOption)=>{
    formData.value.primaryButtonTitle=item.buttonTitle
    formData.value.primaryLinkTitle=item.linkTitle
    formData.value.primaryLinkType=item.linkType
    formData.value.gaLabel=item.gaLabel
}
const {fastAccessOptions:fastAccessOptionsFromParent}=inject('guidedata')
watch(fastAccessOptionsFromParent,(val)=>{
    console.log('fastAccessOptions-update',val)
})
</script>
<template>
    <t-form-item :rules="[{required:true,message:'请上传title'}]" label="Title" :name="`${prefix}.title`">
        <UploadCover v-model="formData.title"></UploadCover>
    </t-form-item>
    <t-form-item :rules="[{required:true,message:'请上传cover'}]" label="Cover" :name="`${prefix}.cover`">
        <UploadCover v-model="formData.cover"></UploadCover>
    </t-form-item>
    <t-form-item label="Highlight">
        <div class="flex flex-col w-full">
            <div class="grid grid-cols-[1fr_200px] gap-x-2 w-full">
                <div>
                    <t-form-item :label-width="0">
                        <t-input readonly :value="highlightJson">
                        </t-input>
                    </t-form-item>
                </div>
                <div><t-button theme="primary" @click="handleAddHiglight">Add Highlight</t-button></div>
            </div>
            <div><t-icon name="info-circle-filled" class="text-yellow-700 mr-1"></t-icon>当前字段内容复英语</div>
            <div class="text-gray-500 text-sm mt-1">Please input AT LEAST 3 highlights</div>

            <div class="grid grid-cols-[1fr_200px] mt-2 gap-2" >
               <template v-for="(item,index) in formData.highlight" :key="index">
                <div><t-input v-model="formData.highlight[index]"></t-input></div>
                <div >
                    <t-button v-if="visibleDelHighlight" theme="danger" @click="formData.highlight.splice(index,1)">Delete This Highlight</t-button>
                </div>
               </template>
            </div>
        </div>
    </t-form-item>
    <t-form-item label="slogan" :name="`${prefix}.slogan`">
        <t-input v-model="formData.slogan"></t-input>
    </t-form-item>
    <t-form-item label="Primary button fast access">
        <t-radio-group value="0">
            <t-radio-button @click="handleFilledPrimaryBlock(item)" v-for="(item,i) in fastAccessOptions" :key="i" >
                {{item.name}}
            </t-radio-button>
        </t-radio-group>
    </t-form-item>
    <div class="grid grid-cols-2 gap-x-2">
        <div>
            <t-form-item :rules="[{required:true,message:'请输入title'}]" label="Primary Button Title" :name="`${prefix}.primaryButtonTitle`">
                <t-input v-model="formData.primaryButtonTitle" placeholder="Primary Button title"></t-input>
            </t-form-item>
               <div></div>
        </div>
        <div>
            <t-form-item :rules="[{required:true,message:'请输入link'}]" label="Primary Link title" :name="`${prefix}.primaryLinkTitle`">
                <t-input v-model="formData.primaryLinkTitle" placeholder="Primary Button link"></t-input>
            </t-form-item>
               <div></div>
        </div>
         <div>
            <t-form-item :rules="[{required:true,message:'请选择link type'}]" label="Primary Link Type" :name="`${prefix}.primaryLinkType`">
                <t-select placeholder="请选择link type" v-model="formData.primaryLinkType" :options="LinkTypeOptions"></t-select>
            </t-form-item>
            <div></div>
        </div>
        <div>
            <t-form-item :rules="[{required:true,message:'请输入ga label'}]" label="GA Label" :name="`${prefix}.gaLabel`">
                <t-input placeholder="GA Label" v-model="formData.gaLabel"></t-input>
            </t-form-item>
               <div></div>
        </div>
    </div>
     <t-form-item label="Secondary button">
        <div class="grid grid-cols-[1fr_200px] gap-2 w-full">
                <div>
                    <t-textarea disabled style="height:60px"></t-textarea>
                    <div><t-icon name="info-circle-filled" class="text-yellow-700 mr-1"></t-icon>当前字段内容复英语</div>
                </div>
                <div>
                    <t-button @click="handleAddSecondaryItem">Add Secondary Button</t-button>
                </div>
                <template v-for="(item,index) in formData.secondaryButton" :key="index">
                    <div>
                    <div class="grid grid-cols-3 gap-x-2">
                      <div>
                        <t-form-item :name="`${prefix}.secondaryButton[${index}].title`">
                            <t-input v-model="formData.secondaryButton[index].title" placeholder="Secondary Button Title"></t-input>
                        </t-form-item>
                      </div>
                      <div>
                        <t-form-item :name="`${prefix}.secondaryButton[${index}].link`">
                            <t-input v-model="formData.secondaryButton[index].link" placeholder="Secondary Button Link"></t-input>
                        </t-form-item>
                      </div>
                      <div>
                        <t-form-item :name="`${prefix}.secondaryButton[${index}].linkType`">
                            <t-select v-model="formData.secondaryButton[index].linkType" placeholder="Select an Option" :options="LinkTypeOptions"></t-select>
                        </t-form-item>
                      </div>
                    </div>
                    </div>
                    <div>
                        <t-button theme="danger" @click="formData.secondaryButton.splice(index,1)">Delete</t-button>
                    </div>
                </template>
            </div>
    </t-form-item>
</template>