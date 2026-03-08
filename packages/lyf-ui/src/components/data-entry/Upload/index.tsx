import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  url?: string;
  percent?: number;
}

export interface UploadProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: string;
  method?: 'post' | 'put';
  headers?: Record<string, string>;
  data?: Record<string, any>;
  name?: string;
  multiple?: boolean;
  maxCount?: number;
  accept?: string;
  disabled?: boolean;
  onUpload?: (file: File) => void;
  onChange?: (file: UploadFile) => void;
  onRemove?: (file: UploadFile) => void;
  children?: React.ReactNode;
}

export const Upload: React.FC<UploadProps> = ({
  action = '',
  method = 'post',
  headers = {},
  data = {},
  name = 'file',
  multiple = false,
  maxCount,
  accept = '',
  disabled = false,
  onUpload,
  onChange,
  onRemove,
  children,
  className,
  ...props
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: UploadFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadFile: UploadFile = {
        uid: `${Date.now()}-${i}`,
        name: file.name,
        status: 'uploading',
        percent: 0,
      };
      newFiles.push(uploadFile);
      
      // 模拟上传进度
      simulateUpload(uploadFile);
      
      onUpload?.(file);
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const simulateUpload = (file: UploadFile) => {
    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      if (percent >= 100) {
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.uid === file.uid 
            ? { ...f, status: 'done', percent: 100, url: `https://example.com/${f.name}` }
            : f
        ));
        onChange?.(file);
      } else {
        setFiles(prev => prev.map(f => 
          f.uid === file.uid ? { ...f, percent } : f
        ));
      }
    }, 300);
  };

  const handleRemove = (file: UploadFile) => {
    setFiles(prev => prev.filter(f => f.uid !== file.uid));
    onRemove?.(file);
  };

  const uploadClass = classNames('lyf-upload', {
    'lyf-upload-disabled': disabled,
  }, className);

  return (
    <div className={uploadClass} {...props}>
      <input
        type="file"
        className="lyf-upload-input"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
      />
      <div className="lyf-upload-trigger">
        {children || (
          <div className="lyf-upload-button">
            <span className="lyf-upload-icon">📁</span>
            <span>点击上传</span>
          </div>
        )}
      </div>
      <div className="lyf-upload-list">
        {files.map(file => (
          <div key={file.uid} className="lyf-upload-item">
            <div className="lyf-upload-item-info">
              <span className="lyf-upload-item-name">{file.name}</span>
              {file.status === 'uploading' && file.percent !== undefined && (
                <div className="lyf-upload-item-progress">
                  <div 
                    className="lyf-upload-item-progress-bar" 
                    style={{ width: `${file.percent}%` }}
                  ></div>
                </div>
              )}
            </div>
            <div 
              className="lyf-upload-item-remove" 
              onClick={() => handleRemove(file)}
            >
              ×
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Upload;
