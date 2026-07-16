<script setup lang="ts">

import { reactive, type Directive,ref } from 'vue'
const visibleName=ref(true)
const form = reactive({
    name: '',
    title: '',
    content: '',
})

function handleSubmit() {
    console.log('表单提交:', JSON.parse(JSON.stringify(form)))
}

function onTitleBeforeInput(e: InputEvent) {
 //   console.log('beforeinput', e.data)
    if (e.data && /\p{Emoji}/u.test(e.data)) {
        e.preventDefault()
    }
}
// 使用更全面的 emoji 匹配（涵盖大部分 emoji）
function removeEmoji(text: string) {
    // 匹配所有 emoji（包括组合表情、肤色修饰等）
    return text.replace(/[\p{Emoji}]/gu, '');
}

function onTitleInput(e: Event) {
    const target = e.target as HTMLInputElement
    target.value = removeEmoji(target.value)
}

// 注册一个全局指令
const vNoEmoji: Directive = {
    mounted(el, binding) {
        console.log('指令', binding.value)
        const inputEl = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : binding.value ? el.querySelector(binding.value) : el.querySelector('input')
        if (inputEl) {
            inputEl.addEventListener('beforeinput', onTitleBeforeInput)
            inputEl.addEventListener('input', onTitleInput)
        }
        el._unmountAA='fff'
    },
    beforeUnmount(el, binding) {
        console.log('卸载指令', el._unmountAA)
        const inputEl = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : binding.value ? el.querySelector(binding.value) : el.querySelector('input')
        if (inputEl) {
            inputEl.removeEventListener('beforeinput', onTitleBeforeInput)
            inputEl.removeEventListener('input', onTitleInput)
        }
    }
}

// 使用
// <input v-no-emoji v-model="text" />
</script>

<template>
    <div style="max-width: 480px; margin: 40px auto; padding: 24px;">
        <t-form :data="form" @submit="handleSubmit">
            <t-form-item label="名称" name="form.name" v-if="visibleName">
                <input type="text" v-model="form.name" v-no-emoji />
            </t-form-item>
            <t-form-item label="标题" name="title">
                <t-input v-no-emoji="'.t-input__inner'" v-model="form.title" placeholder="请输入标题（不支持 emoji）"
                    :style="{ width: '100%' }" />
            </t-form-item>

            <t-form-item label="内容" name="content">
                <t-textarea v-no-emoji="'.t-textarea__inner'" v-model="form.content" placeholder="请输入内容" :autosize="{ minRows: 4, maxRows: 8 }"
                    :style="{ width: '100%' }" />
            </t-form-item>

            <t-form-item>
               <t-space>
                 <t-button type="button" theme="primary" @click="visibleName=!visibleName" >不显示名称</t-button>
                 <t-button type="submit" theme="primary" >提交</t-button>
               </t-space>
            </t-form-item>
        </t-form>

        <div
            style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; color: #555; white-space: pre-wrap; word-break: break-all;">
            <strong style="color: #1677ff;">表单 JSON:</strong>
            {{ JSON.stringify(form, null, 2) }}
        </div>
    </div>
</template>
