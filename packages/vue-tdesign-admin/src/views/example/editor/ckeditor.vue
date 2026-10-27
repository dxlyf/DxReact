<template>
    <div class="ckeditor-demo">
        <section class="ckeditor-demo__section">
            <div class="ckeditor-demo__title">CKEditor 4（CDN 4.22.1 / standard）</div>
            <CKEditor4
                v-model="content4"
                upload-mode="custom"
                upload-url="/api/upload"
                link-upload-url="/api/attachmentfile"
                :height="320"
                @ready="onReady('v4')"
                @error="onError('v4')"
            />
            <div class="ckeditor-demo__label">v-model 输出</div>
            <pre class="ckeditor-demo__html">{{ content4 }}</pre>
        </section>

        <section class="ckeditor-demo__section">
            <div class="ckeditor-demo__title">CKEditor 5（CDN 41.4.2 / classic）</div>
            <CKEditor5
                v-model="content5"
                :height="260"
                @ready="onReady('v5')"
                @error="onError('v5')"
            />
            <div class="ckeditor-demo__label">v-model 输出</div>
            <pre class="ckeditor-demo__html">{{ content5 }}</pre>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CKEditor4, CKEditor5 } from '@/components/CKEditor'

const content4 = ref('<p>Hello <strong>CKEditor 4</strong>，由 CDN 动态注入加载。</p>')
const content5 = ref('<p>Hello <strong>CKEditor 5</strong>，通过 UMD 构建动态注入加载。</p>')

function onReady(version: string) {
    console.log(`[CKEditor ${version}] ready`)
}

function onError(version: string) {
    return (error: Error) => console.error(`[CKEditor ${version}] error`, error)
}
</script>

<style scoped>
.ckeditor-demo {
    padding: 16px;
}

.ckeditor-demo__section + .ckeditor-demo__section {
    margin-top: 24px;
}

.ckeditor-demo__title {
    margin-bottom: 8px;
    font-size: 15px;
    font-weight: 600;
}

.ckeditor-demo__label {
    margin: 12px 0 8px;
    color: #666;
    font-size: 13px;
}

.ckeditor-demo__html {
    margin: 0;
    padding: 12px;
    overflow: auto;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
