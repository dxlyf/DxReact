<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, shallowRef } from 'vue';
import type { FormInstanceFunctions, TableProps } from 'tdesign-vue-next';
import { useRequest } from '@/hooks/useRequest2'
import CountrySelect from '@/components/country-select/index.vue'
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { useRouter } from 'vue-router'


const router = useRouter()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '视频列表',
        to: '/example/tdesign/video/list'
    },
    {
        content: '新增视频'
    }
]
type VideoDTO = {
    id?: string
    title: string
    locale?: string
    slug: string // 视频slug
    asAlpha: string // ALPHA/normal
    videoCategoryId?: number // 视频分类id
    videoTagIds?: number[] // 视频标签id列表 
    author?: string // 视频作者
    location?: string // 地点
    sourceType?: string // 视频来源类型
    sourceUuid?: string// 视频来源uuid
    associateProducts?: string[] // 关联产品id列表
    videoLink?: string // 视频链接
    publishTime?: string // 发布时间 格式：yyyy-MM-dd HH:mm:ss
    status?: string // 视频状态 值：Draft/Publish
    countries?: string[] // 适用国家/地区
    imageOriginUrl?: string // 视频封面原始url
    description?: string // 视频描述
}
type FormData = VideoDTO

// 基础正则表达式
const videoUrlRegex = /^https?:\/\/[^\s]+\.(mp4|avi|mov|wmv|flv|mkv|webm|m4v|3gp|ogv|m3u8|mpeg|mpg)$/i;

// 使用示例
function isValidVideoUrl(url: string): boolean {
  return videoUrlRegex.test(url);
}
const rules = {
    slug: [
        { required: true, whitespace: true, message: '请输入视频slug' },
        {
            pattern: /^[a-z0-9_\-]+$/,
            message: 'Slug只能包含小写字母、数字、短横线或下划线'
        }
    ],
    title: [
        { required: true, whitespace: true, message: '请输入视频标题' }
    ],
    videoLink: [
        { required: true, whitespace: true, message: '请输入视频链接' },
        {
            pattern: videoUrlRegex,
            message: '请输入正确的视频链接.如:https://example.com/video.mp4'
        }
    ]
}
const formData = reactive<FormData>({
    title: '',
    slug: '',
    asAlpha: 'ALPHA',
    videoCategoryId:undefined,
    videoTagIds: [],
    author: '',
    location: '',
    sourceType: '',
    sourceUuid: '',
    associateProducts: [],
    videoLink: '',
    publishTime: '',
    status: 'Draft',
    countries: [],
    imageOriginUrl: '',
    description: '',
})

const submitLoading = ref(false)
const formRef = shallowRef<FormInstanceFunctions>()

const handleSubmit = async (e) => {
    if (e.validateResult !== true) {
        return
    }
    try {
        submitLoading.value = true
        const submitData: VideoDTO = {
            title: formData.title,
            slug: formData.slug,
            asAlpha: formData.asAlpha,
            videoCategoryId: formData.videoCategoryId,
            videoTagIds: formData.videoTagIds,
            author: formData.author,
            location: formData.location,
            sourceType: formData.sourceType,
            sourceUuid: formData.sourceUuid,
            associateProducts: formData.associateProducts,
            videoLink: formData.videoLink,
            publishTime: formData.publishTime,
            status: formData.status,
            countries: formData.countries,
            imageOriginUrl: formData.imageOriginUrl,
            description: formData.description,
        }
        console.log('提交', submitData)

    } catch (err) {
    } finally {
        submitLoading.value = false
    }
}

const [videoCategoryState, videoCategoryInst] = useRequest({
    defaultValue: [],
    request: async () => {
        return [
            {
                label: '分类1',
                value: 1,
            },
            {
                label: '分类2',
                value: 2,
            },
        ]
    }
})
const [videoTagState, videoTagInst] = useRequest({
    defaultValue: [],
    request: async () => {
        return [
            {
                label: '标签1',
                value: 1,
            },
            {
                label: '标签2',
                value: 2,
            },
            {
                label: '标签3',
                value: 3,
            },
        ]
    }
})
const [productState, productInst] = useRequest({
    defaultValue: [],
    request: async () => {
        return [
            {
                label: '产品1',
                value: '1',
            },
            {
                label: '产品2',
                value: '2',
            },
            {
                label: '产品3',
                value: '3',
            },
        ]
    }
})
const handleReturn = () => {
    router.push('/example/tdesign/video/list')
}
const handlePreviewVideoLink=()=>{
    formRef.value?.validate({
        fields:['videoLink']
    }).then(res=>{
        if(res===true){
            window.open(formData.videoLink,'_blank')
        }
    })
}
</script>

<template>
    <MainLayout title="新增视频" layout="edit" show-lang :breadcrumb-options="breadcrumbOptions">
       <template #operation>
        <t-button theme="default" :disabled="submitLoading" @click="handleReturn">返回</t-button>
       </template>
        <t-form ref="formRef" @submit="handleSubmit" :data="formData" :rules="rules" class="w-full" label-align="top">
            <t-form-item label="Alpha" name="asAlpha">
                <t-select v-model="formData.asAlpha" :options="[{
                    label: 'ALPHA',
                    value: 'ALPHA',
                },
                {
                    label: 'normal',
                    value: 'normal',
                }]" />
                <template #tips>
                    ALPHA：视频标题不能超过20个字符
                </template>
            </t-form-item>
            <div class="grid grid-cols-2 gap-4">
                <t-form-item label="Slug" name="slug">
                    <t-input v-model="formData.slug" />
                </t-form-item>
                <t-form-item label="视频分类" name="videoCategoryId">
                    <t-select clearable filterable :loading="videoCategoryState.loading"
                        :options="videoCategoryState.data" v-model="formData.videoCategoryId" />
                </t-form-item>
            </div>
            <t-form-item label="视频标签" name="videoTagIds">
                <t-select clearable filterable :loading="videoTagState.loading" :options="videoTagState.data" multiple
                    v-model="formData.videoTagIds" />
            </t-form-item>
            <div class="grid grid-cols-2 gap-4">
                <t-form-item label="视频作者" name="author">
                    <t-input v-model="formData.author" />
                </t-form-item>
                <t-form-item label="地点" name="location">
                    <t-input v-model="formData.location" />
                </t-form-item>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <t-form-item label="视频来源类型" name="sourceType">
                    <t-input v-model="formData.sourceType" />
                </t-form-item>
                <t-form-item label="视频来源uuid" name="sourceUuid">
                    <t-input v-model="formData.sourceUuid" />
                </t-form-item>
            </div>
            <t-form-item label="关联产品" name="associateProducts">
                <t-select clearable filterable :loading="productState.loading" :options="productState.data" multiple
                    v-model="formData.associateProducts" />
            </t-form-item>
            <t-form-item label="标题" name="title">
                <t-input v-model="formData.title" />
            </t-form-item>
            <t-form-item label="视频链接" name="videoLink">
                <div class="w-full flex gap-4">
                    <div class="flex-1">
                        <t-input v-model="formData.videoLink" />
                    </div>
                    <div class="flex-none">
                        <t-button theme="primary" @click="handlePreviewVideoLink">预览视频</t-button>
                    </div>
                </div>
            </t-form-item>
          
            <div class="grid grid-cols-2 gap-4">
                <t-form-item label="发布时间" name="publishTime">
                    <t-date-picker clearable enable-time-picker v-model="formData.publishTime"
                        format="YYYY-MM-DD HH:mm:ss" />
                </t-form-item>
                <t-form-item label="状态" name="status">
                    <t-radio-group v-model="formData.status">
                        <t-radio value="Draft">草稿</t-radio>
                        <t-radio value="Publish">已发布</t-radio>
                    </t-radio-group>
                </t-form-item>
            </div>
            <t-form-item label="适用国家/地区" name="countries">
                <CountrySelect v-model="formData.countries" />
                <template #tips>
                    此处选择关联的国家，如果没有选择任何国家，则表示可被任何国家关联
                </template>
            </t-form-item>
            <t-form-item label="图片" name="imageOriginUrl">
                <UploadCover subtitle="支持：JPG" v-model="formData.imageOriginUrl">
                    <template #tips>
                        上传视频封面图片格式：JPG，尺寸380x228（三倍图），大小：≤1MB,且视频封面不得出现文字
                    </template>
                </UploadCover>

            </t-form-item>
            <t-form-item label="描述" name="description">
                <t-textarea :maxlength="255" v-model="formData.description" />
            </t-form-item>
            <div class="flex justify-end">
                <t-space>
                    <t-button theme="primary" :loading="submitLoading" @click="handleSubmit"
                        type="submit">创建视频</t-button>
                </t-space>
            </div>


        </t-form>
    </MainLayout>
</template>