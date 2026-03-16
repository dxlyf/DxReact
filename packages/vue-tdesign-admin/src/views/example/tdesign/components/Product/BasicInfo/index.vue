<script setup lang="ts">
import { CollapsePanel, type TdFormProps, type TdInputProps, type TdSelectInputProps, type TdTagInputProps } from 'tdesign-vue-next'
import { reactive, ref, shallowReactive, shallowRef, computed, onBeforeMount, toRaw } from 'vue';
import FUploadCover from '../../FUpload/FUploadCover2.vue'
import CountrySelect from '@/components/country-select/index.vue'
import IconProvide from '../../FIcon/IconProvide.vue';
import Icon from '../../FIcon/Icon.vue';
const loading = ref(false)
const detailData = ref<Record<string, any>>(null)
const formData = reactive({
    cover:'/uploads/aaa.jpg',
    showInfoSwitch: 0,
    isVirtual: 0,
    hideInSearch: 1,
    searchSynonym: [],
    searchSynonym2: [],
    searchSynonym3: [],
    searchSynonym4:[]
})
const rules: TdFormProps['rules'] = {
    slug: [
        { required: true, message: '请输入Slug' }
    ],
    cover: [
        { required: true, message: '请输入Cover' }
    ],
    videoGroupSlug: [
        { required: true, message: '请选择视频组Slug' }
    ],
    videoGroupSlugValue: [
        { required: true, message: '请输入视频组Slug值' }
    ],
    accessoryLink: [
        { required: true, message: '请输入配件链接' }
    ],
    buylink2: [{
        validator(val, { formData }) {
            if (typeof val === 'string'&&val.trim()!==''&&!isJson(val)) {
                return   {
                    result: false,
                    message: '必须是JSON格式'
                }
            }
             return {
                    result: true
            }
          
        }
    }]
}
// 是否是json格式
const isJson = (str: string) => {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}
const videoGroupSlugOptions = ref([])
const showEnglishDefaultValue = (fieldName: string) => {
    if (!detailData.value) {
        return false
    }
    return detailData.value[fieldName] === null
}
const handleSubmit = async (e) => {
    console.log('e', e.validateResult, toRaw(formData))
}
const searchSynonymOptions = ref([])
const handleAddSearchSynonym = (value) => {
    const index = searchSynonymOptions.value.findIndex((item) => item.value === value)
    //console.log('create',index)
    if (index === -1) {
        searchSynonymOptions.value.push({
            label: value,
            value
        })
    }
}
const handleSearchSynonymOptions = (value) => {
    return searchSynonymOptions.value.some((item) => item.label.includes(value))
}
const handleSelectSearchSynonym = (value, ctx) => {
    console.log('ff', value, ctx)
    const newValue = [...value]
    const current = newValue[newValue.length - 1]
    const existItems = newValue.filter((item) => item === current)
    if (existItems.length > 1) {
        formData.searchSynonym2 = newValue.filter((v) => v !== current)
    } else {
        formData.searchSynonym2 = [...value]
    }
}
// const enterSearchSynonym=({value})=>{
//     console.log('enter',value)
// }
const selectInputProps = {
    onChange: (v) => {
        console.log('vvvvvvvv', v)
    }
}
const handleChangeSearchSynonym = (value, { index, item }) => {
    console.log('change', value, index, item)
    const list = value.filter((v) => v === item)
    if (list.length > 1) {
        formData.searchSynonym = value.filter((v) => v !== item)
    } else {
        formData.searchSynonym = [...value]
    }

}
const enterSearchSynonym = (value, { inputValue }) => {
    // console.log('enter',value,inputValue)
    // const list=value.filter((item)=>item===inputValue)
    // if(list.length>1){
    //     formData.searchSynonym=value.filter((item)=>item!==inputValue)
    // }else{
    //     formData.searchSynonym=[...value]
    // }
}
const inputValue = ref([])
const SearchSelectInputProps = computed<TdTagInputProps>(() => {
    return {
        value: inputValue.value,
        disabled: formData.searchSynonym3.includes(inputValue.value),
        onChange: (v) => {
            console.log('fffffffffffff', v)
            inputValue.value = v
        }

    } as TdTagInputProps
})
const handleSelectSearchSynonym3 = (value, ctx) => {
    const item = value[value.length - 1]
    const list = value.filter((v) => v === item)
    if (list.length > 1) {
        formData.searchSynonym3 = value.filter((v) => v !== item)
    } else {
        formData.searchSynonym3 = [...value]
    }
}
const searchSynonym3Options = computed(() => {
    return formData.searchSynonym3.map((item) => {
        return {
            label: item,
            value: item
        }
    })
})
const handleAddSearchSynonym3 = (value) => {
    const index = formData.searchSynonym3.findIndex((item) => item === value)
    //console.log('create',index)
    if (index === -1) {
        formData.searchSynonym3 = [...formData.searchSynonym3, value]
    }

}
const handleEnterSearchSynonym3 = ({ inputValue }) => {
    const index = formData.searchSynonym3.findIndex((item) => item === inputValue)
    //console.log('create',index)
    if (index === -1) {
        formData.searchSynonym3 = [...formData.searchSynonym3, inputValue]
      //  return true
    }
}
const handlePasteeSearchSynonym3:TdInputProps['onPaste']=(ctx)=>{
   if(ctx.pasteValue.trim()===''){
    return
   }
   const values=ctx.pasteValue.split(',')
   values.forEach(value=>{
        handleAddSearchSynonym3(value)
   })
   ctx.e.preventDefault()
   ctx.e.stopImmediatePropagation()
}

const searchSynonym4Options=computed(()=>{
    return formData.searchSynonym4.map(v=>{
        return {
            value:v,
            label:v,
        }
    })
})
const handleSynonymChange=(values:string[])=>{
     const value=values[values.length-1]
     const list=values.filter(v=>v==value)
     if(list.length>1){
        formData.searchSynonym4=values.filter(v=>v!==value)
     }else{
        formData.searchSynonym4=[...values]
     }
}
const handleSynonymEnter=({inputValue})=>{
     const index=formData.searchSynonym4.findIndex(item=>item==inputValue)
     if(index==-1){
        formData.searchSynonym4=[...formData.searchSynonym4,inputValue]
     }
}
const handleSynonymPaste=(ctx)=>{
     if(ctx.pasteValue.trim()===''){
    return
   }
   const values=ctx.pasteValue.split(/,|;/g)
   values.forEach(value=>{
        handleSynonymEnter({inputValue:value})
   })
   ctx.e.preventDefault()
   ctx.e.stopImmediatePropagation()
}

const vvvv=shallowRef({})
// setTimeout(()=>{
//     vvvv.value={title:'fff'}
// },3000)
</script>
<template>
    <IconProvide :value="vvvv">
    <t-form class="w-full" @submit="handleSubmit" :data="formData" :rules="rules" label-align="top" layout='vertical'>
        <t-collapse :default-expand-all="true" :expand-mutex="false" :expand-on-row-click="true"
            expand-icon-placement="right" borderless>
            <t-collapse-panel value="1">
                <template #header>
                    <div class="header">基础信息配置</div>
                </template>
                <t-form-item label="Slug(唯一标识)" name="slug">
                    <t-input v-model="formData.slug" placeholder="请输入唯一标识" :maxlength="255" />
                </t-form-item>
                <t-form-item label="Cover(封面图)" name="cover">
                    <FUploadCover v-model="formData.cover" :load-check-image-config="{
                        width: 870,
                        height: 870,
                        type: 'png'
                    }">
                        <template #subtitle>
                            支持扩展名：JPG、PNG、GIF、SVG
                        </template>
                        <template #tips>
                            上传图片格式：PNG，尺寸：200*200(三倍图)，大小：≤2MB
                        </template>
                    </FUploadCover>
                </t-form-item>
                <t-form-item label="Title(产品名称)" name="title">
                    <t-input v-model="formData.title" placeholder="请输入产品名称" :maxlength="255" />
                    <template #help >
                        <Icon name="title"></Icon>
                    </template>
                </t-form-item>
                <t-form-item label="Slogan(产品标语)" name="slogan">
                    <t-input v-model="formData.slogan" placeholder="请输入产品标语" :maxlength="255" />
                    <template #help v-if="showEnglishDefaultValue('slogan')">
                        <div>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Summary(产品摘要)" name="summary">
                    <t-textarea v-model="formData.summary" placeholder="请输入产品摘要" :maxlength="255" />
                    <template #help v-if="showEnglishDefaultValue('summary')">
                        <div>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Video group slug">
                    <t-row :gutter="12" class="w-full">
                        <t-col :span="6">
                            <t-form-item name="videoGroupSlug" :label-width="0">
                                <t-select v-model="formData.videoGroupSlug" placeholder="请选择视频组Slug"
                                    :options="videoGroupSlugOptions" />
                            </t-form-item>
                        </t-col>
                        <t-col :span="6">
                            <t-button variant="outline">Go to group:视频组Slug</t-button>
                            <!-- <t-form-item name="videoGroupSlugValue" :label-width="0">
                                <t-input v-model="formData.videoGroupSlugValue" placeholder="请输入视频组Slug值" :maxlength="255" />
                            </t-form-item> -->
                        </t-col>
                    </t-row>

                </t-form-item>

                <div></div>
            </t-collapse-panel>

            <t-collapse-panel value="2">
                <template #header>
                    <div class="header">发布与展示控制</div>
                </template>
                <t-form-item label="Status(发布状态)" name="status">
                    <t-select v-model="formData.status"
                        :options="[{ label: 'Publish', value: 'Publish' }, { label: 'Draft', value: 'Draft' }]"
                        placeholder="请输入发布状态" />
                    <template #help v-if="showEnglishDefaultValue('status')">
                        <div>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Publish at(发布时间)" name="publish_at">
                    <t-date-picker :enable-time-picker="true" v-model="formData.publish_at" placeholder="请输入发布时间"
                        :maxlength="255">
                    </t-date-picker>
                    <template #tips>
                        <div>发布时间为UTC时间，格式为YYYY-MM-DD HH:mm:ss</div>
                    </template>
                    <template #help v-if="showEnglishDefaultValue('publish_at')">
                        <div>当前字段内容复用英文</div>
                    </template>
                </t-form-item>
                <t-form-item label="Countries(上线地区)" name="countries">
                    <CountrySelect v-model="formData.countries"></CountrySelect>
                    <template #help v-if="showEnglishDefaultValue('countries')">
                        <div>当前字段内容复用英文</div>
                    </template>
                    <template #tips>
                        <div>仅上线地区的用户才能访问</div>
                    </template>
                </t-form-item>
                <t-form-item label="Show Info switch" name="showInfoSwitch">
                    <t-switch :custom-value="[1, 0]" v-model="formData.showInfoSwitch" :label="['ON', 'OFF']"></t-switch>
                </t-form-item>
                <t-form-item label="is virtual" name="isVirtual">
                    <t-switch :custom-value="[1, 0]" v-model="formData.isVirtual" :label="['ON', 'OFF']"></t-switch>
                </t-form-item>
                <t-form-item label="Hide in search" name="hideInSearch">
                    <t-switch :custom-value="[1, 0]" v-model="formData.hideInSearch" :label="['ON', 'OFF']"></t-switch>
                    <div class="ml-4">是否隐藏在搜索结果中</div>
                </t-form-item>

                <t-form-item label="Search synonym" name="searchSynonym">
                    <t-tag-input :drag-sort="true" @change="handleChangeSearchSynonym" @enter="enterSearchSynonym"
                        :value="formData.searchSynonym"></t-tag-input>

                    <div class="ml-4">是否隐藏在搜索结果中</div>
                </t-form-item>
                <t-form-item label="Search synonym" name="searchSynonym2">

                    <t-select  @change="handleSelectSearchSynonym" creatable :multiple="true" :min-collapsed-num="3"
                        :options="searchSynonymOptions" @create="handleAddSearchSynonym" :clearable="true"
                        :filterable="true" :value="formData.searchSynonym2"></t-select>
                    <div class="ml-4">是否隐藏在搜索结果中</div>
                </t-form-item>
                <t-form-item label="Search synonym" name="searchSynonym3">

                    <t-select @change="handleSelectSearchSynonym3" :input-props="{onPaste:handlePasteeSearchSynonym3}" @enter="handleEnterSearchSynonym3" creatable
                        :multiple="true" :min-collapsed-num="3" :options="searchSynonym3Options"
                        @create="handleAddSearchSynonym3" :clearable="true" :filterable="true"
                        :value="formData.searchSynonym3"></t-select>
                    <div class="ml-4">是否隐藏在搜索结果中</div>
                </t-form-item>
                  <t-form-item label="Search synonym" name="searchSynonym4">

                    <t-select :options="searchSynonym4Options" 
                   
                    :input-props="{onPaste:handleSynonymPaste}"
                     creatable 
                     multiple
                     clearable
                     filterable
                      @change="handleSynonymChange" 
                         @enter="handleSynonymEnter"
                        :value="formData.searchSynonym4">
                   
                    </t-select>
                    <div class="ml-4">是否隐藏在搜索结果中</div>
                </t-form-item>
            </t-collapse-panel>
            <t-collapse-panel value="3">
                <template #header>
                    <div class="header">链接与扩展配置</div>
                </template>
                <t-form-item label="Eab" name="ean">
                    <t-input v-model="formData.ean" placeholder="请输入ean" :maxlength="255" />
                    <template #tips>
                        <div>ean 参数可以从商品中心获取</div>
                    </template>
                </t-form-item>
                <t-form-item label="Buy link(购买链接)" name="buylink">
                    <t-input v-model="formData.buylink" placeholder="请输入buylink" :maxlength="255" />
                    <template #tips>
                        <div>支持配置相对链接路径</div>
                    </template>
                </t-form-item>
                <t-form-item label="Buy link(旧版)" name="buylink2">
                    <t-input placeholder="旧版本购买链接" v-model="formData.buylink2" :maxlength="255" />
                </t-form-item>
                <t-form-item label="Third party link" name="thirdPartyLink">
                    <t-input placeholder="旧版本购买链接" v-model="formData.thirdPartyLink" :maxlength="255" />
                </t-form-item>
                <t-form-item label="Accessory Link(配件链接)">
                    <div class="grid grid-cols-[200px_1fr] gap-x-2 w-full">
                        <t-form-item :label-width="0" name="accessoryLinkType">
                            <t-select :options="[{ label: '相对链接', value: '相对链接' }, { label: '绝对链接', value: '绝对链接' }]"
                                placeholder="Select an Option" v-model="formData.accessoryLinkType" />
                        </t-form-item>
                        <t-form-item :label-width="0" name="accessoryLink">
                            <t-input placeholder="配件链接" v-model="formData.accessoryLink" :maxlength="255" />
                        </t-form-item>
                    </div>
                </t-form-item>
                <div></div>
            </t-collapse-panel>
        </t-collapse>


        <t-form-item>
            <t-space class="pl-10">
                <t-button type="submit">提交</t-button>
            </t-space>
        </t-form-item>
    </t-form>
    </IconProvide>  
</template>
<style lang="css" scoped>
.header {
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}
</style>