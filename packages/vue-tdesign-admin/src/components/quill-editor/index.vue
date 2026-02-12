<template>
  <div ref="editorRef" class="quill-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Quill,{type QuillOptions} from 'quill'
import 'quill/dist/quill.snow.css'

// 定义插件类型
export interface QuillPlugin {
  name: string
  install: (quill: Quill) => void
}

// 定义组件 props
const props = withDefaults(defineProps<{
  modelValue?: string
  options?: any
  plugins?: QuillPlugin[]
  disabled?: boolean
}>(), {
  modelValue: '',
  options: () => ({}),
  plugins: () => [],
  disabled: false
})

// 定义事件
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'textChange': [delta: any, oldContents: any, source: string]
  'selectionChange': [range: any, oldRange: any, source: string]
  'editorChange': [eventName: string, ...args: any[]]
}>()

const editorRef = ref<HTMLElement>()
let quill: Quill | null = null

// 初始化编辑器
const initEditor = async () => {
  await nextTick()
  if (!editorRef.value) return

  const defaultOptions:QuillOptions = {
    theme: 'snow',
    modules: {
    //   toolbar: [
    //     [{ header: [1, 2, 3, false] }],
    //     ['bold', 'italic', 'underline', 'strike'],
    //     [{ list: 'ordered' }, { list: 'bullet' }],
    //     ['link', 'image'],
    //     ['clean']
    //   ]
        toolbar:true
    },
    ...props.options
  }

  quill = new Quill(editorRef.value, defaultOptions)

  // 注册插件
  props.plugins.forEach(plugin => {
    if (typeof plugin.install === 'function') {
      plugin.install(quill!)
    }
  })

  // 设置初始内容
  if (props.modelValue) {
    //quill.root.innerHTML = props.modelValue
      quill.setText(props.modelValue,'silent')
  }


  // 监听文本变化
  quill.on('text-change', (delta, oldContents, source) => {
    const html = quill.getText()
    emit('update:modelValue', html)
    emit('textChange', delta, oldContents, source)
    console.log('text-change')
  })

  // 监听选区变化
  quill.on('selection-change', (range, oldRange, source) => {
    emit('selectionChange', range, oldRange, source)
  })

  // 监听编辑器变化
  quill.on('editor-change', (eventName, ...args) => {
    emit('editorChange', eventName, ...args)
  })

  // 设置禁用状态
  quill.enable(!props.disabled)
}

// 监听内容变化
watch(() => props.modelValue, (newVal) => {
  if (quill && newVal !== quill.getText()) {
    quill.setText(newVal,'silent')
  }
})

// 监听禁用状态
watch(() => props.disabled, (disabled) => {
  if (quill) {
    quill.enable(!disabled)
  }
})

// 暴露方法
const getQuill = () => quill
const getText = () => quill?.getText() || ''
const getHTML = () => quill?.root.innerHTML || ''
const getLength = () => quill?.getLength() || 0
const focus = () => quill?.focus()
const blur = () => quill?.blur()
const insertText = (index: number, text: string, formats?: any) => quill?.insertText(index, text, formats)
const deleteText = (index: number, length: number) => quill?.deleteText(index, length)
const formatText = (index: number, length: number, format: string, value: any) => quill?.formatText(index, length, format, value)

defineExpose({
  getQuill,
  getText,
  getHTML,
  getLength,
  focus,
  blur,
  insertText,
  deleteText,
  formatText
})

onMounted(initEditor)

onBeforeUnmount(() => {
  if (quill) {
    quill.off()
    quill = null
  }
})
</script>

<style scoped>
.quill-editor {
  min-height: 200px;
}
</style>
