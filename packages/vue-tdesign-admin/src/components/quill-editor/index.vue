<template>
<div class="quill-wrapper">
    <div id="toolbar">
  <button class="ql-bold">加粗</button>
  <button class="ql-italic">斜体</button>
  <button class="ql-underline">下划线</button>
  <button class="ql-image">图片</button>
  <button class="ql-table">表格</button>
</div>
  <div ref="editorRef"  class="quill-editor"></div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick,useId, shallowRef, onBeforeMount } from 'vue'
import Quill,{type QuillOptions} from 'quill'
import {merge} from 'lodash-es'
import 'quill/dist/quill.snow.css'

const Delta=Quill.import('delta')
const Parchment = Quill.import('parchment');
console.log('Delta',Delta)
window.Quill=Quill
// 在你的模块中（比如 Quill 编辑器组件）
if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    // 如果检测到无法处理的更新，强制刷新整个页面
      import.meta.hot.invalidate();
      console.log('热更新失败，刷新页面')
  });
}

// 定义插件类型
export interface QuillPlugin {
  name: string
  install: (quill: Quill) => void
}

// 定义组件 props
const props = withDefaults(defineProps<{
  modelValue?: string
  options?: QuillOptions
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



// 暴露方法
const getQuill = () => quill
const getText = () => quill?.getText() || ''
const getHTML = () => quill?.root.innerHTML || ''
const setHTML = (html: string) =>{
  const delta= quill?.clipboard.convert({html})
  if (delta) {
    quill?.setContents(delta,'silent')
  }
}
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

const editorRef = ref<HTMLElement>()
let quill: Quill | null = null

// 初始化编辑器
class TableUIModule {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.menuItems = [
      {
        title: '右侧插入列',
        handler: () => {
          const table = quill.getModule('table');
          table.insertColumnRight();
        }
      },
      {
        title: '下方插入行',
        handler: () => {
          const table = quill.getModule('table');
          table.insertRowBelow();
        }
      },
      {
        title: '删除当前列',
        handler: () => {
          const table = quill.getModule('table');
          table.deleteColumn();
        }
      },
      {
        title: '删除当前行',
        handler: () => {
          const table = quill.getModule('table');
          table.deleteRow();
        }
      }
    ];
    
    this.init();
  }
  
  init() {
    // 监听表格选中事件
    this.quill.on('selection-change', (range) => {
      if (range) {
        this.detectTableSelection(range);
      }
    });
  }
  
  detectTableSelection(range) {
    // 检测是否选中了表格
    // 如果是，显示操作菜单
  }
  
  destroy() {
    this.quill.off('selection-change');
  }
}

//Quill.register('modules/tableUI', TableUIModule);
const initEditor = async () => {
  if (!editorRef.value) return
  const defaultOptions:QuillOptions = {
   // debug:'log',
    theme: 'snow',
    placeholder:'请输入内容',
    modules: {
     // toolbar:'#toolbar',
     toolbar:   [['bold', 'italic', 'underline', 'strike'],        // 文本格式
        ['blockquote', 'code-block'],                      // 引用和代码
        [{ 'header': 1 }, { 'header': 2 }],               // 标题级别
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // 列表
        [{ 'script': 'sub'}, { 'script': 'super' }],      // 上下标
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // 缩进
        [{ 'direction': 'rtl' }],                          // 文字方向
        [{ 'size': ['small', false, 'large', 'huge'] }],   // 字号
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],         // 标题下拉
        [{ 'color': [] }, { 'background': [] }],           // 颜色选择
        [{ 'font': [] }],                                   // 字体选择
        [{ 'align': [] }],                                  // 对齐方式
        ['clean'],                                          // 清除格式
        ['link', 'image', 'video'],
        [{ 'table': 'insert-table' }, // 或者用对象形式
        { 'table': 'insert-row-above' }, // 上方插入行
        { 'table': 'insert-row-below' }, // 下方插入行
        { 'table': 'insert-column-left' }, // 左侧插入列
        { 'table': 'insert-column-right' }, // 右侧插入列
        { 'table': 'delete-row' }, // 删除行
        { 'table': 'delete-column' }, // 删除列
        { 'table': 'delete-table' }] // 删除整个表格
      ],                // 插入元素
      toolbar2: [
         ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
      ]
      //  toolbar:true
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
     // quill.setText(props.modelValue,'silent')
     setHTML(props.modelValue)
  }


  // 监听文本变化
  quill.on(Quill.events.TEXT_CHANGE, (delta, oldContents, source) => {
    const html = quill.getSemanticHTML()
    console.log('text-change',html)
    emit('update:modelValue', html)
    emit('textChange', delta, oldContents, source)
  })

  // 监听选区变化
  quill.on(Quill.events.SELECTION_CHANGE, (range, oldRange, source) => {
    emit('selectionChange', range, oldRange, source)
  })

  // 监听编辑器变化
  quill.on(Quill.events.EDITOR_CHANGE, (eventName, ...args) => {
    emit('editorChange', eventName, ...args)
  })

  // 设置禁用状态
  quill.enable(!props.disabled)
}



// 监听禁用状态
watch(() => props.disabled, (disabled) => {
  if (quill) {
    quill.enable(!disabled)
  }
})


onMounted(initEditor)
onBeforeUnmount(() => {
  if (quill) {
    editorRef.value.innerHTML = ''
    quill = null
  }
})
</script>

<style scoped>
.quill-editor {
  min-height: 200px;
}
</style>
