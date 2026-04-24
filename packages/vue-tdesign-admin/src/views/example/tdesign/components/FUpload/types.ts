// types.ts - 类型定义文件
export interface Limit {
  width?: number;
  height?: number;
}

export interface ValidateResult {
  valid: boolean;
  message?: string;
}

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type?: string;
  status?: 'uploading' | 'success' | 'error';
  percent?: number;
  url?: string;
  previewUrl?: string;
  originFile?: File;
  dimensions?: {
    width: number;
    height: number;
  };
  errorMessage?: string;
}

export interface UploadProps {
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