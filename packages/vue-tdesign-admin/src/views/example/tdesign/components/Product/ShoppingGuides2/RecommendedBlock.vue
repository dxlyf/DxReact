<script setup lang="ts">
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { computed, ref, customRef, toRaw, type PropType, shallowRef } from 'vue'
import CountrySelect from '@/components/country-select/index.vue'
import FUploadImage from '../../FUpload/FUploadImage.vue'

type FormData = {
    icon: string
    countries: string[]
    title: string
    actionName: string
    link: string
    gaLabel: string
    description: string
}
type FastAccessOption={
    name:string
    title:string
    actionName:string
    link:string
    gaLabel:string
}
type Props = {
    prefix?: string
    modelValue: FormData
}
const props = withDefaults(defineProps<Props>(), {
    prefix: 'recommendedContent'
})
const fastAccessOptions=shallowRef<FastAccessOption[]>([
    {
        name:'BuyNow',
        title:'Buy Now',
        actionName:'Buy Now',
        link:'/buy-now',
        gaLabel:'Buy Now'
    },
    {
        name:'WhereToBuy',
        title:'Where to buy',
        actionName:'Where to buy',
        link:'/where-to-buy',
        gaLabel:'Where to buy'
    },
    {
        name:'ContactUs',
        title:'Contact us',
        actionName:'Contact us',
        link:'/contact-us',
        gaLabel:'Contact us'
    },
    {
        name:'ReserveNow',
        title:'Reserve now',
        actionName:'Reserve now',
        link:'/reserve-now',
        gaLabel:'Reserve now'
    },
])
const formData = defineModel<FormData>({
    default: () => ({
        icon: '',
        countries: [],
        title: '',
        actionName: '',
        link: '',
        gaLabel: '',
        description: ''
    })
})

const handleFilledBlock=(item:FastAccessOption)=>{
    formData.value.title=item.title
    formData.value.actionName=item.actionName
    formData.value.link=item.link
    formData.value.gaLabel=item.gaLabel
}
</script>
<template>
    <t-form-item label="Recommended content fast access">
        <div class="flex flex-wrap gap-1">
            <div class="p-2 border border-stone-300 cursor-pointer hover:text-blue-500"
                v-for="(item, i) in fastAccessOptions" :key="i" @click="handleFilledBlock(item)">
                {{ item.name }}
            </div>
        </div>
    </t-form-item>
    <t-form-item label="Icon" :name="`${prefix}.icon`">
       <FUploadImage :vv="formData.title"  v-model="formData.icon" tips="上传文件格式：svg,尺寸:64x64 px" ></FUploadImage>
    </t-form-item>
    <t-form-item label="Countries" :name="`${prefix}.countries`">
        <CountrySelect v-model="formData.countries"></CountrySelect>
    </t-form-item>
    <div class="grid grid-cols-2 gap-2">
        <t-form-item label="Title" :name="`${prefix}.title`">
            <t-input v-model="formData.title" placeholder=""Tile />
        </t-form-item>
        <t-form-item label="Action name" :name="`${prefix}.actionName`">
            <t-input v-model="formData.actionName" placeholder="Action Name" />
        </t-form-item>
    </div>
    <t-form-item label="Link" :name="`${prefix}.link`">
        <t-input v-model="formData.link" placeholder="Link" />
    </t-form-item>
    <t-form-item label="GA label" :name="`${prefix}.gaLabel`" :rules="[{ required: true, message: '请输入ga label' }]">
        <t-input v-model="formData.gaLabel" placeholder="GA Label" />
    </t-form-item>
    <t-form-item label="Description" :name="`${prefix}.description`">
        <t-input v-model="formData.description" placeholder="Description" />
    </t-form-item>
</template>