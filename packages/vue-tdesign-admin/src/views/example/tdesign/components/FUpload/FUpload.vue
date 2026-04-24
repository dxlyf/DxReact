<!-- ImageUpload.vue -->
<template>
  <div class="image-upload">
    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{
        'upload-area--dragover': isDragover,
        'upload-area--disabled': disabled
      }"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        :disabled="disabled"
        @change="handleFileChange"
      />
      <div class="upload-area__content">
        <slot name="uploadIcon">
          <UploadIcon class="upload-icon" />
        </slot>
        <div class="upload-text">
          <slot name="uploadText">
            <p class="upload-text__main">点击或拖拽上传图片</p>
            <p class="upload-text__hint">支持单个或多个文件上传</p>
          </slot>
        </div>
      </div>
    </div>

    <!-- 图片列表 -->
    <div v-if="fileList.length > 0" class="image-list">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid"
        class="image-card"
        :class="{ 'image-card--error': file.status === 'error' }"
      >
        <!-- 图片预览 -->
        <div class="image-card__preview">
          <img
            v-if="file.url || file.previewUrl"
            :src="file.url || file.previewUrl"
            :alt="file.name"
            class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <ImageIcon />
          </div>
          
          <!-- 加载状态 -->
          <div v-if="file.status === 'uploading'" class="image-card__loading">
            <LoadingIcon />
            <span>{{ file.percent }}%</span>
          </div>

          <!-- 错误状态 -->
          <div v-if="file.status === 'error'" class="image-card__error">
            <ErrorIcon />
            <span>{{ file.errorMessage }}</span>
          </div>

          <!-- 成功状态遮罩 -->
          <div v-if="file.status === 'success'" class="image-card__success">
            <CheckIcon />
          </div>
        </div>

        <!-- 图片信息 -->
        <div class="image-card__info">
          <div class="info-name" :title="file.name">
            {{ file.name }}
          </div>
          <div class="info-size">
            {{ formatFileSize(file.size) }}
          </div>
          <div v-if="file.dimensions" class="info-dimensions">
            {{ file.dimensions.width }} × {{ file.dimensions.height }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="image-card__actions">
          <button
            v-if="file.status === 'success'"
            class="action-btn preview-btn"
            @click.stop="handlePreview(file)"
            title="预览"
          >
            <EyeIcon />
          </button>
          <button
            class="action-btn delete-btn"
            @click.stop="handleRemove(file)"
            title="删除"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>

    <!-- 预览模态框 -->
    <Teleport to="body">
      <div v-if="previewVisible" class="preview-modal" @click="closePreview">
        <div class="preview-modal__content" @click.stop>
          <img :src="previewUrl" :alt="previewFile?.name" />
          <button class="close-btn" @click="closePreview">×</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch,h,defineComponent} from 'vue';
import type { UploadProps, UploadFile, Limit, ValidateResult } from './types';

// 图标组件（简化版，实际可以使用 iconfont 或 SVG 图标）
const UploadIcon = defineComponent(() => () => h('span', { class: 'icon-upload' }, '📁'));
const ImageIcon = defineComponent(() => () => h('span', { class: 'icon-image' }, '🖼️'));
const LoadingIcon = defineComponent(() => () => h('span', { class: 'icon-loading' }, '⏳'));
const ErrorIcon = defineComponent(() => () => h('span', { class: 'icon-error' }, '❌'));
const CheckIcon = defineComponent(() => () => h('span', { class: 'icon-check' }, '✓'));
const EyeIcon = defineComponent(() => () => h('span', { class: 'icon-eye' }, '👁️'));
const DeleteIcon = defineComponent(() => () => h('span', { class: 'icon-delete' }, '🗑️'));

// Props
interface Props {
  limit?: Limit;
  multiple?: boolean;
  maxCount?: number;
  disabled?: boolean;
  accept?: string;
  action?: string;
  headers?: Record<string, string>;
  data?: Record<string, any>;
  withCredentials?: boolean;
  beforeUpload?: (file: File) => Promise<boolean | ValidateResult>;
  onSuccess?: (response: any, file: UploadFile) => void;
  onError?: (error: Error, file: UploadFile) => void;
  onProgress?: (percent: number, file: UploadFile) => void;
  onRemove?: (file: UploadFile) => void;
  onPreview?: (file: UploadFile) => void;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  maxCount: undefined,
  disabled: false,
  accept: 'image/*'
});

const emit = defineEmits<{
  'change': [fileList: UploadFile[]];
  'success': [response: any, file: UploadFile];
  'error': [error: Error, file: UploadFile];
  'remove': [file: UploadFile];
}>();

// 响应式数据
const fileInputRef = ref<HTMLInputElement>();
const isDragover = ref(false);
const fileList = ref<UploadFile[]>([]);
const previewVisible = ref(false);
const previewUrl = ref('');
const previewFile = ref<UploadFile>();

// 计算属性
const canUpload = computed(() => {
  if (props.disabled) return false;
  if (props.maxCount !== undefined && fileList.value.length >= props.maxCount) {
    return false;
  }
  return true;
});

// 图片尺寸校验工具类
class ImageSizeValidator {
  private limit: Limit;

  constructor(limit: Limit) {
    this.limit = limit;
  }

  async validateBeforeUpload(file: File): Promise<ValidateResult> {
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        message: '请上传图片文件'
      };
    }

    try {
      const dimensions = await this.getImageDimensionsFromFile(file);
      return this.checkDimensions(dimensions);
    } catch (error) {
      return {
        valid: false,
        message: '图片加载失败，请重试'
      };
    }
  }

  async validateAfterUpload(imageUrl: string): Promise<ValidateResult> {
    try {
      const dimensions = await this.getImageDimensionsFromUrl(imageUrl);
      return this.checkDimensions(dimensions);
    } catch (error) {
      return {
        valid: false,
        message: '图片尺寸校验失败'
      };
    }
  }

  private getImageDimensionsFromFile(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  private getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = url;
    });
  }

  private checkDimensions(dimensions: { width: number; height: number }): ValidateResult {
    const { width, height } = dimensions;

    if (this.limit.width !== undefined && width !== this.limit.width) {
      return {
        valid: false,
        message: `图片宽度必须为 ${this.limit.width}px，当前宽度为 ${width}px`
      };
    }

    if (this.limit.height !== undefined && height !== this.limit.height) {
      return {
        valid: false,
        message: `图片高度必须为 ${this.limit.height}px，当前高度为 ${height}px`
      };
    }

    return {
      valid: true,
      message: '图片尺寸校验通过'
    };
  }
}

const validator = computed(() => props.limit ? new ImageSizeValidator(props.limit) : null);

// 工具函数
const generateUid = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const createPreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  });
};

// 文件处理
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (files.length === 0) return;

  await uploadFiles(files);
  target.value = '';
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragover.value = false;
  
  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length === 0) return;

  await uploadFiles(files);
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragover.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragover.value = false;
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const triggerFileInput = () => {
  if (canUpload.value && fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 上传文件
const uploadFiles = async (files: File[]) => {
  if (!canUpload.value) return;

  // 过滤文件
  let newFiles = files;
  if (props.maxCount !== undefined) {
    const remaining = props.maxCount - fileList.value.length;
    if (remaining <= 0) {
      console.warn(`最多只能上传 ${props.maxCount} 个文件`);
      return;
    }
    newFiles = files.slice(0, remaining);
  }

  for (const file of newFiles) {
    await uploadFile(file);
  }
};

const uploadFile = async (file: File) => {
  // 创建文件对象
  const uploadFile: UploadFile = {
    uid: generateUid(),
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'uploading',
    percent: 0,
    originFile: file
  };

  // 创建预览URL
  uploadFile.previewUrl = await createPreviewUrl(file);
  
  // 添加到列表
  fileList.value.push(uploadFile);
  emit('change', fileList.value);

  try {
    // 执行上传前校验
    if (validator.value) {
      const validateResult = await validator.value.validateBeforeUpload(file);
      if (!validateResult.valid) {
        throw new Error(validateResult.message);
      }
    }

    // 执行自定义 beforeUpload
    if (props.beforeUpload) {
      const beforeResult = await props.beforeUpload(file);
      if (typeof beforeResult === 'object' && !beforeResult.valid) {
        throw new Error(beforeResult.message);
      }
      if (beforeResult === false) {
        throw new Error('上传被拦截');
      }
    }

    // 模拟上传（实际项目中替换为真实的上传逻辑）
    await simulateUpload(uploadFile);

    // 上传成功后获取图片实际尺寸
    if (validator.value && uploadFile.url) {
      const afterValidateResult = await validator.value.validateAfterUpload(uploadFile.url);
      if (!afterValidateResult.valid) {
        uploadFile.status = 'error';
        uploadFile.errorMessage = afterValidateResult.message;
        emit('error', new Error(afterValidateResult.message), uploadFile);
        return;
      }
    }

    uploadFile.status = 'success';
    emit('success', { url: uploadFile.url }, uploadFile);
  } catch (error: any) {
    uploadFile.status = 'error';
    uploadFile.errorMessage = error.message;
    emit('error', error, uploadFile);
  } finally {
    emit('change', fileList.value);
  }
};

// 模拟上传
const simulateUpload = (file: UploadFile): Promise<void> => {
  return new Promise((resolve, reject) => {
    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      file.percent = percent;
      props.onProgress?.(percent, file);
      
      if (percent >= 100) {
        clearInterval(interval);
        // 模拟上传成功
        file.url = file.previewUrl;
        resolve();
      }
    }, 200);

    // 模拟可能的上传失败（10%概率，仅用于演示）
    // setTimeout(() => {
    //   clearInterval(interval);
    //   reject(new Error('上传失败，请重试'));
    // }, 1000);
  });
};

// 真实上传逻辑（示例）
const realUpload = async (file: UploadFile): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file.originFile!);
  
  if (props.data) {
    Object.entries(props.data).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.open('POST', props.action!, true);
    
    if (props.withCredentials) {
      xhr.withCredentials = true;
    }
    
    if (props.headers) {
      Object.entries(props.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    
    xhr.upload.onprogress = (event) => {
      if (event.total > 0) {
        const percent = Math.round((event.loaded / event.total) * 100);
        file.percent = percent;
        props.onProgress?.(percent, file);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        file.url = response.url;
        resolve();
      } else {
        reject(new Error('上传失败'));
      }
    };
    
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send(formData);
  });
};

// 删除文件
const handleRemove = (file: UploadFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid);
  if (index !== -1) {
    fileList.value.splice(index, 1);
    emit('remove', file);
    emit('change', fileList.value);
    props.onRemove?.(file);
  }
};

// 预览图片
const handlePreview = (file: UploadFile) => {
  previewFile.value = file;
  previewUrl.value = file.url || file.previewUrl || '';
  previewVisible.value = true;
  props.onPreview?.(file);
};

const closePreview = () => {
  previewVisible.value = false;
  previewUrl.value = '';
  previewFile.value = undefined;
};

// 监听文件列表变化
watch(fileList, (newList) => {
  emit('change', newList);
}, { deep: true });
</script>

<style scoped lang="scss">
.image-upload {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

// 上传区域样式
.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
  
  &:hover {
    border-color: #4096ff;
    background-color: #f0f7ff;
  }
  
  &--dragover {
    border-color: #4096ff;
    background-color: #e6f4ff;
  }
  
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      border-color: #d9d9d9;
      background-color: #fafafa;
    }
  }
  
  &__content {
    padding: 40px 20px;
    text-align: center;
  }
}

.upload-icon {
  font-size: 48px;
  display: inline-block;
  margin-bottom: 16px;
}

.upload-text {
  &__main {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
  }
  
  &__hint {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
}

// 图片列表样式
.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-card {
  position: relative;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    
    .image-card__actions {
      opacity: 1;
    }
  }
  
  &--error {
    border-color: #ff4d4f;
    background-color: #fff2f0;
  }
  
  &__preview {
    position: relative;
    width: 100%;
    padding-top: 100%;
    background-color: #f5f5f5;
    overflow: hidden;
    
    .preview-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .preview-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      color: #ccc;
    }
  }
  
  &__loading,
  &__error,
  &__success {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 14px;
    
    span {
      margin-top: 8px;
    }
  }
  
  &__success {
    background-color: rgba(82, 196, 26, 0.9);
  }
  
  &__error {
    background-color: rgba(255, 77, 79, 0.9);
  }
  
  &__info {
    padding: 12px;
    background: white;
    
    .info-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }
    
    .info-size,
    .info-dimensions {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }
  
  &__actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s ease;
      
      &.preview-btn {
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.8);
        }
      }
      
      &.delete-btn {
        background-color: #ff4d4f;
        color: white;
        
        &:hover {
          background-color: #ff7875;
        }
      }
    }
  }
}

// 预览模态框样式
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &__content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    
    img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
    }
    
    .close-btn {
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>