<script setup lang="ts">
import { onMounted, reactive, shallowRef, toRaw } from 'vue';
import Tabs, { type ModelItem } from './tabs.vue'
import { MessagePlugin } from 'tdesign-vue-next';

const formRef = shallowRef<any>()
const formData = reactive<{
    mp: Record<string, ModelItem[]>
}>({
    mp: {}
})
const setData = () => {
    // 模拟编辑回显数据
    formData.mp['wechat'] = [
        {
            type: 'wechat',
            id: 'wx_001',
            title: '微信公众号',
            icon: '',
            desc: '扫码关注公众号获取最新资讯',
            linkText: '查看详情',
            linkUrl: 'https://mp.weixin.qq.com/',
            telephone: '',
            isNew: false,
            groups: [
                {
                    id: 'grp_001',
                    title: '技术文章',
                    icon: '',
                    remark: '技术相关的推文分组',
                    isNew: false
                },
                {
                    id: 'grp_002',
                    title: '产品动态',
                    icon: '',
                    remark: '产品更新和版本发布',
                    isNew: false
                }
            ],
            activeGroupId: 'grp_001'
        },
        {
            type: 'wechat',
            id: 'wx_002',
            title: '微信客服',
            icon: '',
            desc: '在线客服，工作时间9:00-18:00',
            linkText: '联系客服',
            linkUrl: '',
            telephone: '400-888-8888',
            isNew: false
        }
    ]
    formData.mp['phone'] = [
        {
            type: 'phone',
            id: 'ph_001',
            title: '技术支持热线',
            icon: '',
            desc: '技术支持',
            linkText: '拨打电话',
            linkUrl: '',
            telephone: '010-88888888',
            isNew: false
        }
    ]
    formData.mp['email'] = [
        {
            type: 'email',
            id: 'em_001',
            title: '商务合作邮箱',
            icon: '',
            desc: '商务合作',
            linkText: '发送邮件',
            linkUrl: 'mailto:business@example.com',
            telephone: '',
            isNew: false
        }
    ]
  //  formRef.value.bindData(formData.mp)
}
const handleSubmit = async () => {
    const valid = await formRef.value.validate()
    if (valid !== true) {
        MessagePlugin.error(valid)
    }
    console.log(toRaw(formData.mp))
}
onMounted(() => {
    setTimeout(() => {
        setData()
    }, 1000)
})
</script>
<template>
    <t-button theme="primary" @click="handleSubmit">提交</t-button>
    <Tabs ref="formRef" v-model="formData.mp" />

</template>