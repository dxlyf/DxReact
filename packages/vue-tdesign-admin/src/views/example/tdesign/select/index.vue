<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import { FormProps } from 'tdesign-vue-next';
import { computed, reactive, ref, shallowReactive, shallowRef, toRaw } from 'vue';
import { useSelect } from './useSelect';

const formData=shallowReactive({
    local: ''
})
const handleSubmit:FormProps['onSubmit'] = (e) => {
    console.log('formData', toRaw(formData))
}
const localOptions=Array.from({length:30},(v,i)=>({
    label:`选项${i+1}`,
    value:`m${i+1}`
}))
const [selectProps]=useSelect({
    options:localOptions
})
</script>
<template>
    <t-form @submit="handleSubmit" :data="formData">
        <t-form-item label="本地options" name="local">
            <t-select v-model="formData.local" v-bind="selectProps" />
        </t-form-item>
        <div>
            <t-button theme="primary" type="submit">提交</t-button>
        </div>
    </t-form>
</template>