<template>
    <div class="quill-editor-container">
        <quill-editor v-model="content" />
    </div>
    </template>
    <script setup lang="ts">
    import QuillEditor from '@/components/quill-editor/index.vue'
    import { ref } from 'vue'
    const content = ref('')
</script>