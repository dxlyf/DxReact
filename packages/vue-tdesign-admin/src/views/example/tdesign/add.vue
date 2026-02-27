<script setup lang="ts">
import { getCurrentInstance, onBeforeMount, reactive, toRaw } from 'vue';
import EditLayout from './components/Layouts/EditLayout.vue'
import FField from './components/FForm/FField.vue'
import FUploadCover2 from './components/FUpload/index.vue'
import FUploadCover from './components/FUpload/FUploadCover.vue'
import FUploadCover3 from './components/FUpload/FUploadCover2.vue'
import FNativeUpload from './components/FNativeUpload/index.vue'
import { Collapse, type TdFormItemProps, type TdFormProps } from 'tdesign-vue-next';

import { useRouter } from 'vue-router';
const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    }, {
        content: '列表',
        to: '/list'
    }, {
        content: '新增'
    }
]
const formData = reactive({})
const router = useRouter()
onBeforeMount(() => {
    console.log('onBeforeMount')
})
const handleSubmit: TdFormProps['onSubmit'] = (e) => {
    if (e.validateResult !== true) {
        return
    }
    console.log('handleSubmit', toRaw(formData))
}
const instance = getCurrentInstance()
const handleRefreshRouter = () => {
    instance.vnode.key = Date.now()
    console.log('instance', instance.vnode)

    // instance.appContext.app.config.globalProperties.$i18n.
}
const rules: Record<string, TdFormItemProps['rules']> = {
    slug: [{ required: true, message: '请输入Slug' }, {
        pattern: /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
        message: 'Slug只能包含小写字母、数字、短横线或下划线'
    }],
    cover: [{ required: true, message: '请上传图片' }]
}
</script>

<template>
    <EditLayout :breadcrumbOptions="breadcrumbOptions" title="新增">
        <t-form @submit="handleSubmit" :data="formData" class="w-full" label-align="top" :rules="rules">
            <t-collapse default-expand-all class="form-collapse" expand-icon-placement="right"
                :expand-on-row-click="false" :borderless="true">
                <t-collapse-panel value="0">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2 leading-none">基础信息</div>
                    </template>
                    <t-form-item name="slug" label="Slug(唯一标识)" required-mark>
                        <t-input placeholder="Product slug" :maxlength="255" v-model="formData.slug"></t-input>
                    </t-form-item>
                    <t-form-item name="cover" label="Cover(封面图)">
                        <FUploadCover3 v-model="formData.cover">
                        </FUploadCover3>
                    </t-form-item>
                    <t-form-item name="title" label="Title(产品标题)" required-mark>
                        <t-input placeholder="Product title" v-model="formData.title"></t-input>
                    </t-form-item>
                    <t-form-item name="summary" label="Summary(产品摘要)" required-mark>
                        <t-textarea placeholder="Product summary" v-model="formData.summary"
                            :maxlength="255"></t-textarea>
                    </t-form-item>
                </t-collapse-panel>
                <t-collapse-panel value="1">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2">发布和展示控制</div>
                    </template>

                    <t-form-item name="status" label="Status(发布状态)">
                        <t-select
                            :options='[{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }]'
                            v-model="formData.status"></t-select>
                    </t-form-item>
                    <t-form-item name="status" label="Status">
                        <t-select
                            :options='[{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }]''></t-select>
        </t-form-item>
        
        <t-form-item name="country" label="Country(上线地区)">
                    <t-button>上传地区</t-button>
                    <template #tips>
                        <div class="text-sm text-gray-500 mt-1">
                            请上传产品上线地区的图片
                        </div>
                    </template>
        </t-form-item>
              <t-form-item name="publish_at" label="Publish at(发布时间)">
                    <t-date-picker v-model="formData.publish_at" enable-time-picker format="YYYY-MM-DD hh:mm:ss"></t-date-picker>
                    <template #tips>
                        <div class="text-sm text-gray-500 mt-1">
                            北京时间的日期 / Date in timezone of Beijing
                            <br/>
                            区分多语言
                        </div>
        
                    </template>
        </t-form-item>
     </t-collapse-panel>
     <t-collapse-panel value="2">
                    <template #header>
                        <div class="border-l-4 border-l-blue-600 pl-2">其他信息</div>
                    </template>
                    <t-form-item name="description" label="Description(产品描述)">
                        <t-textarea placeholder="Product description" v-model="formData.description"></t-textarea>
                    </t-form-item>
                    </t-collapse-panel> 
      </t-collapse>

        
        <t-form-item>
          <t-space >
             <t-button theme="primary" type="submit" >{{ $t(' common.create', { label: 'Product' }) }}</t-button>
                            <t-button theme="primary" @click="handleRefreshRouter">刷新路由</t-button>
                            </t-space>
                    </t-form-item>
        </t-form>
    </EditLayout>
</template>
    <style>
    .form-collapse .t-collapse-panel__header {
        padding: 8px 0;
        /* border-bottom: solid 1px var(--td-gray-color-4)!important; */
    }

    .form-collapse .t-collapse-panel__content {
        padding: 16px 8px;
    }
</style>