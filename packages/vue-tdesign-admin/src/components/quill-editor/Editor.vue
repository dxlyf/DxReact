<template>
  <div class="quill-editor-wrapper">
    <div ref="editorRef" class="quill-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'snow' | 'bubble';
  height?: string | number;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
  (e: 'ready', quill: Quill): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  disabled: false,
  theme: 'snow',
  height: 300,
});

const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement | null>(null);
const quillInstance = ref<Quill | null>(null);
const isInternalChange = ref(false);

const getEditorHeight = () => {
  if (typeof props.height === 'number') {
    return `${props.height}px`;
  }
  return props.height;
};

const initQuill = () => {
  if (!editorRef.value) return;

  const options: Quill.Options = {
    theme: props.theme,
    placeholder: props.placeholder,
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image', 'video'],
      ],
    },
  };

  quillInstance.value = new Quill(editorRef.value, options);

  if (props.modelValue) {
    quillInstance.value.root.innerHTML = props.modelValue;
  }

  if (props.disabled) {
    quillInstance.value.enable(false);
  }

  quillInstance.value.on('text-change', handleTextChange);
  quillInstance.value.on('selection-change', handleSelectionChange);

  emit('ready', quillInstance.value);
};

const handleTextChange = () => {
  if (!quillInstance.value || isInternalChange.value) return;

  const html = quillInstance.value.root.innerHTML;
  const isEmpty = quillInstance.value.getText().trim().length === 0;
  const content = isEmpty ? '' : html;

  emit('update:modelValue', content);
  emit('change', content);
};

const handleSelectionChange = (range: any, oldRange: any) => {
  if (range === null && oldRange !== null) {
    emit('blur');
  } else if (range !== null && oldRange === null) {
    emit('focus');
  }
};

const setHtml = (html: string) => {
  if (!quillInstance.value) return;

  isInternalChange.value = true;
  
  const isEmpty = !html || html.trim() === '' || html === '<p><br></p>';
  
  if (isEmpty) {
    quillInstance.value.setText('');
  } else {
    quillInstance.value.root.innerHTML = html;
  }

  nextTick(() => {
    isInternalChange.value = false;
  });
};

const getHtml = (): string => {
  if (!quillInstance.value) return '';
  
  const html = quillInstance.value.root.innerHTML;
  const isEmpty = quillInstance.value.getText().trim().length === 0;
  
  return isEmpty ? '' : html;
};

const getText = (): string => {
  if (!quillInstance.value) return '';
  return quillInstance.value.getText();
};

const setDisabled = (disabled: boolean) => {
  if (!quillInstance.value) return;
  quillInstance.value.enable(!disabled);
};

const focus = () => {
  if (!quillInstance.value) return;
  quillInstance.value.focus();
};

const blur = () => {
  if (!quillInstance.value) return;
  const selection = quillInstance.value.getSelection();
  if (selection) {
    quillInstance.value.setSelection(null);
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!quillInstance.value) return;

    const currentHtml = getHtml();
    
    if (newValue !== currentHtml) {
      setHtml(newValue || '');
    }
  }
);

watch(
  () => props.disabled,
  (disabled) => {
    setDisabled(disabled);
  }
);

onMounted(() => {
  nextTick(() => {
    initQuill();
  });
});

onBeforeUnmount(() => {
  if (quillInstance.value) {
    quillInstance.value.off('text-change', handleTextChange);
    quillInstance.value.off('selection-change', handleSelectionChange);
  }
});

defineExpose({
  getQuill: () => quillInstance.value,
  getHtml,
  setHtml,
  getText,
  focus,
  blur,
});
</script>

<style scoped lang="scss">
.quill-editor-wrapper {
  width: 100%;
  
  .quill-editor {
    min-height: v-bind(getEditorHeight());
    
    :deep(.ql-editor) {
      min-height: v-bind(getEditorHeight());
      font-size: 14px;
      line-height: 1.5;
    }
    
    :deep(.ql-toolbar) {
      border: 1px solid #dcdcdc;
      border-radius: 4px 4px 0 0;
      background: #fafafa;
    }
    
    :deep(.ql-container) {
      border: 1px solid #dcdcdc;
      border-top: none;
      border-radius: 0 0 4px 4px;
      font-family: inherit;
    }
    
    :deep(.ql-editor.ql-blank::before) {
      font-style: normal;
      color: #bfbfbf;
    }
    
    :deep(.ql-disabled) {
      .ql-editor {
        background-color: #f5f5f5;
        color: rgba(0, 0, 0, 0.25);
        cursor: not-allowed;
      }
    }
  }
}
</style>
