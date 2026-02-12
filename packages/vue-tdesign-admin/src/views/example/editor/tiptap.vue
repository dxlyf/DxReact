<template>
  <div class="editor-wrapper">
    <!-- 工具栏 -->
    <div class="toolbar" v-if="editor">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        加粗
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        斜体
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
      >
        删除线
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
      >
        一级标题
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      >
        二级标题
      </button>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        无序列表
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        有序列表
      </button>
      <button
        @click="editor.chain().focus().undo().run()"
      >
        撤销
      </button>
      <button
        @click="editor.chain().focus().redo().run()"
      >
        重做
      </button>
    </div>

    <!-- 编辑器 -->
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = shallowRef<Editor>(null)

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
    ],
    content: '<p>欢迎使用 TipTap 编辑器！</p>',
  })
  editor.value.on('update',(view)=>{
    console.log(view.editor.getJSON())
  })
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
}

.toolbar button {
  padding: 4px 8px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  border-radius: 3px;
}

.toolbar button.is-active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.editor-content {
  padding: 12px;
  min-height: 150px;
}
</style>
