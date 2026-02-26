<script setup lang="ts">
    import { getCurrentInstance, onBeforeMount, reactive, toRaw } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import FField from './components/FForm/FField.vue'
import FUploadCover2 from './components/FUpload/index.vue'
import FUploadCover from './components/FUpload/FUploadCover.vue'
import FUploadCover3 from './components/FUpload/FUploadCover2.vue'
import FNativeUpload from './components/FNativeUpload/index.vue'
import { Collapse } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
    const breadcrumbOptions=[
        {
            content:'首页',
            to:'/'
        },{
            content:'列表',
            to:'/list'
        },{
            content:'新增'
        }
    ]
    const formData=reactive({})
    const router=useRouter()
    onBeforeMount(()=>{
        console.log('onBeforeMount')
    })
    const handleSubmit=()=>{
        console.log('handleSubmit',toRaw(formData))
    }
    const instance=getCurrentInstance()
    const handleRefreshRouter=()=>{
        instance.vnode.key=Date.now()
        console.log('instance',instance.vnode)
        
        // instance.appContext.app.config.globalProperties.$i18n.
    }
</script>

<template>
    <EditLayout :breadcrumbOptions="breadcrumbOptions" title="新增">
       <t-form :data="formData" class="w-full" label-align="top">
        <t-collapse default-expand-all class="form-collapse" expand-icon-placement="right" :expand-on-row-click="false" :borderless="true">
            <t-collapse-panel value="0" header="基础信息">
                    <t-form-item name="cover" label="Cover">
            <FUploadCover class="w-[300px] h-[200px]">
            </FUploadCover>
        </t-form-item>

            <t-form-item name="cover" label="Cover2">
            <FUploadCover2>
            </FUploadCover2>
        </t-form-item>

               <t-form-item name="cover" label="Cover3">
            <FNativeUpload>
            </FNativeUpload>
        </t-form-item>
                  <t-form-item :rules="[{required:true,message:'请上传图片'}]"" name="cover4" label="Cover4">
            <FUploadCover3 v-model="formData.cover4">
            </FUploadCover3>
        </t-form-item>
            </t-collapse-panel>

      </t-collapse>

            
           <t-form-item name="slug" label="Slug">
            <t-input placeholder="Product slug"></t-input>
        </t-form-item>
                   <t-form-item name="title" label="Title">
            <t-input placeholder="Product title"></t-input>
        </t-form-item>
                   <t-form-item name="status" label="Status">
            <t-select :options='[{label:"Draft",value:"draft"},{label:"Published",value:"published"}]''></t-select>
        </t-form-item>
                   <t-form-item name="slug" label="Slug">
            <t-input placeholder="Product slug"></t-input>
        </t-form-item>
        <t-form-item>
           <t-button theme="primary" type="submit" @click="handleSubmit">{{$t('common.create',{label:'Product'})}}</t-button>
            <t-button theme="primary" @click="handleRefreshRouter">刷新路由</t-button>
        </t-form-item>
    </t-form>
    </EditLayout>
</template>
<style>
.form-collapse .t-collapse-panel__header{
    padding: 8px 0;
    /* border-bottom: solid 1px var(--td-gray-color-4)!important; */
}
.form-collapse .t-collapse-panel__content{
    padding: 16px 8px;
}
</style>