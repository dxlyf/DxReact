import React, { useState, useMemo } from 'react';
import { Upload, Image, message } from 'antd';
import type { UploadProps, UploadFile } from 'antd';
import { EyeOutlined,DeleteOutlined,UploadOutlined, FileTextOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileZipOutlined, FileUnknownOutlined, DownloadOutlined } from '@ant-design/icons';
import './index.css';
import useControllerValue from '../../hooks/useControllerValue';

// 文件类型定义
export interface CustomUploadFile extends UploadFile {
  thumbUrl?: string;
}

// 组件 Props 类型定义
export interface CustomUploadProps extends Omit<UploadProps, 'fileList'|'defaultFileList' | 'onChange'> {
  value?: CustomUploadFile[];
  defaultValue?: CustomUploadFile[];
  onChange?: (fileList: CustomUploadFile[]) => void;
  maxCount?: number;
  accept?: string;
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle';
  showUploadList?: boolean;

  maxSize?: number; // 文件大小限制（单位：MB）
  fileTypeErrorMsg?: string;
  fileSizeErrorMsg?: string;
  fileCountErrorMsg?: string;
}

// 文件类型图标映射
const fileIconMap: Record<string, React.ReactNode> = {
  'pdf': <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />,
  'doc': <FileWordOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
  'docx': <FileWordOutlined style={{ color: '#1890ff', fontSize: '24px' }} />,
  'xls': <FileExcelOutlined style={{ color: '#52c41a', fontSize: '24px' }} />,
  'xlsx': <FileExcelOutlined style={{ color: '#52c41a', fontSize: '24px' }} />,
  'zip': <FileZipOutlined style={{ color: '#faad14', fontSize: '24px' }} />,
  'rar': <FileZipOutlined style={{ color: '#faad14', fontSize: '24px' }} />,
  'txt': <FileTextOutlined style={{ color: '#666', fontSize: '24px' }} />,
  'default': <FileUnknownOutlined style={{ color: '#999', fontSize: '24px' }} />
} as const;

// 获取文件类型图标
const getFileIcon = (fileName: string): React.ReactNode => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return fileIconMap.pdf;
    case 'doc':
    case 'docx':
      return fileIconMap.doc;
    case 'xls':
    case 'xlsx':
      return fileIconMap.xls;
    case 'zip':
    case 'rar':
    case '7z':
      return fileIconMap.zip;
    case 'txt':
      return fileIconMap.txt;
    default:
      return fileIconMap.default;
  }
};

// 判断是否为图片文件
const isImage = (type:string,name?:string): boolean => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
  return imageTypes.includes(type || '') || 
         /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name || '');
};

// 判断是否为图片文件
const isImageFile = (file: CustomUploadFile | File): boolean => {
  if (file instanceof File) {
    return isImage(file.type, file.name);
  } else {
    return isImage(file.type, file.name);
  }
};
class FileDownloader {
  /**
   * 下载数据为文件
   * @param {*} data - 要下载的数据
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME 类型
   */
  static download(data:any, filename:string, mimeType = 'application/octet-stream') {
    // 如果是 Blob 或 File 对象，直接使用
    if (data instanceof Blob) {
      this.downloadBlob(data, filename);
      return;
    }
    
    // 如果是字符串或对象，转换为 Blob
    let blobData = data;
    if (typeof data === 'object' && !(data instanceof Blob)) {
      blobData = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    }
    
    const blob = new Blob([blobData], { type: mimeType });
    this.downloadBlob(blob, filename);
  }
  
  /**
   * 下载 Blob 对象
   * @param {Blob} blob - Blob 对象
   * @param {string} filename - 文件名
   */
  static downloadBlob(blob:Blob, filename:string) {
    const url = URL.createObjectURL(blob);
    this.downloadFormPath(url,filename)
   
  }
  static downloadFormPath(url:string, filename:string) {
    const link = document.createElement('a');
  
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // 延迟释放 URL，确保下载完成
    setTimeout(() => URL.revokeObjectURL(url), 100);

  }
  
  /**
   * 从 URL 下载文件
   * @param {string} url - 文件 URL
   * @param {string} filename - 自定义文件名
   */
  static async downloadFromUrl(url:string, filename:string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      this.downloadBlob(blob, filename);
    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  }
}

async function downloadWithProgress(url, onProgress) {
  // 1. 发起fetch请求
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 2. 获取数据总长度 (注意可能不存在)
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  
  // 如果无法获取总长度，则无法精确计算进度百分比
  if (isNaN(total)) {
    console.warn('无法从响应头获取 Content-Length，进度将显示为已下载字节数。');
  }

  // 3. 获取流读取器
  const reader = response.body.getReader();
  
  // 4. 初始化变量用于追踪进度和存储数据
  let receivedLength = 0;
  let chunks = [];
  
  // 5. 循环读取数据流
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      break;
    }
    
    // 存储当前数据块
    chunks.push(value);
    // 更新已接收数据长度
    receivedLength += value.length;
    
    // 6. 调用进度回调函数
    if (onProgress) {
      if (!isNaN(total)) {
        // 如果能获取总长度，计算百分比
        const percent = Math.round((receivedLength / total) * 100);
        onProgress(receivedLength, total, percent);
      } else {
        // 否则只传递已接收长度
        onProgress(receivedLength, null, null);
      }
    }
  }
  
  // 7. 所有数据读取完成，合并数据
  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }
  
  // 8. 根据需要进行数据转换，例如转换为文本或Blob
  // 转换为文本 (适用于JSON、文本等)
  // const text = new TextDecoder("utf-8").decode(chunksAll);
  // const data = JSON.parse(text);
  
  // 或者转换为Blob对象 (适用于文件)
  const blob = new Blob(chunks);
  
  return blob;
}

// // 使用示例
// downloadWithProgress('https://example.com/large-file.zip', (loaded, total, percent) => {
//   if (percent !== null) {
//     console.log(`下载进度: ${loaded}/${total} 字节 (${percent}%)`);
//     // 更新UI进度条
//     // progressBar.style.width = percent + '%';
//   } else {
//     console.log(`已下载: ${loaded} 字节`);
//   }
// })
// .then(blob => {
//   console.log('下载完成', blob);
//   // 处理下载完成后的逻辑，例如创建对象URL供下载或显示
//   // const downloadUrl = URL.createObjectURL(blob);
//   // ... 使用 downloadUrl
// })
// .catch(error => {
//   console.error('下载失败:', error);
// });

// 自定义上传组件
const CustomUpload: React.FC<CustomUploadProps> = (props) => {
  const {
    value:propValue,
    defaultValue:propDefaultValue,
    onChange,
    maxCount = 10,
    maxSize = 10, // 默认 10MB
    accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt',
    listType = 'picture-card',
    showUploadList = true,
    fileTypeErrorMsg = '文件类型不支持',
    fileSizeErrorMsg = '文件大小超过限制',
    fileCountErrorMsg = '文件数量超过限制',
    beforeUpload: propBeforeUpload,
    children,
    
    ...restProps
  } = props;
  const [value,setValue]=useControllerValue({
      value:propValue,
      defaultValue:propDefaultValue,
      onChange:onChange,
  })
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
 // 验证文件类型
  const validateFileType = (file: File): boolean => {
    if (!accept || accept === '*') return true;
    
    const acceptTypes = accept.split(',').map(type => type.trim());
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = file.type.toLowerCase();

    return acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return type.slice(1).toLowerCase() === fileExtension;
      } else if (type.includes('/*')) {
        const mainType = type.split('/*')[0];
        return fileType.startsWith(mainType);
      } else {
        return fileType === type;
      }
    });
  };

  // 验证文件大小
  const validateFileSize = (file: File): boolean => {
    const sizeInMB = file.size / 1024 / 1024;
    return sizeInMB <= maxSize;
  };

  // 验证文件数量
  const validateFileCount = (file: File, currentCount: number): boolean => {
    if (!maxCount) return true;
    return currentCount < maxCount;
  };

  // 上传前验证
  const beforeUpload: UploadProps['beforeUpload'] = (file, fileList) => {
    // 调用外部传入的 beforeUpload
    if (propBeforeUpload) {
      const result = propBeforeUpload(file, fileList);
      if (result === false) return false;
    }

    // 验证文件类型
    if (!validateFileType(file)) {
      message.error(`${fileTypeErrorMsg}: ${file.name}`);
      return Upload.LIST_IGNORE;
    }

    // 验证文件大小
    if (!validateFileSize(file)) {
      message.error(`${fileSizeErrorMsg} (最大 ${maxSize}MB): ${file.name}`);
      return Upload.LIST_IGNORE;
    }

    // 验证文件数量
    if (!validateFileCount(file, value.length)) {
      message.error(`${fileCountErrorMsg} (最多 ${maxCount} 个文件)`);
      return Upload.LIST_IGNORE;
    }

    return true;
  };
  const handleRemove = (file: CustomUploadFile) => {
    const newFileList = value.filter(item => item.uid !== file.uid);
    setValue(newFileList);

    // 移除文件时清理对象 URL 以避免内存泄漏
    if (file.thumbUrl && file.originFileObj) {
      URL.revokeObjectURL(file.thumbUrl);
    }
  };
  // 处理文件列表变化
  const handleChange: UploadProps['onChange'] = (info) => {
    let fileList = [...info.fileList];

  
    fileList = fileList.map(file => {
       // 为每个文件添加缩略图 URL（如果是图片）
      if (!file.thumbUrl&&file.originFileObj && isImageFile(file.originFileObj)) {
        // 只有在文件状态是 uploading 或 done 时才生成缩略图
        if (file.status === 'uploading' || file.status === 'done') {
          file.thumbUrl = URL.createObjectURL(file.originFileObj);
        }
      }
      // 如果文件上传到后端成功;
      if(file.response){
        file.url = file.response?.url || '';
        // 清理对象 URL 以避免内存泄漏
        if (file.thumbUrl && file.originFileObj) {
          URL.revokeObjectURL(file.thumbUrl);
        }
      }
      return file;
    });

  


    setValue(fileList);
  };

  // 处理预览
  const handlePreview = async (file: CustomUploadFile) => {
    if (isImageFile(file)) {
      setPreviewImage(file.thumbUrl || file.url || '');
      setPreviewVisible(true);
    } else {
    // 非图片文件，可以在这里处理下载或其他操作
      if (file.url) {
        FileDownloader.downloadFormPath(file.url,file.name)
        //window.open(file.url, '_blank');
      } else if (file.originFileObj) {
        // 如果是本地文件，可以创建下载链接
         FileDownloader.downloadBlob(file.originFileObj,file.name)
  
      }
    }
  };

  // 自定义上传列表项渲染
  const customItemRender = (originNode: React.ReactElement, file: CustomUploadFile, fileList: object[]) => {
    if (!showUploadList) return originNode;

    return (
      <div className="custom-upload-item" >
        {isImageFile(file) ? (
          <div className="image-item" >
            <img 
              src={file.thumbUrl || file.url} 
              alt={file.name}
              className="upload-image"
              onLoad={() => {
                // 清理对象 URL 以避免内存泄漏
                if (file.thumbUrl && file.originFileObj) {
                  URL.revokeObjectURL(file.thumbUrl);
                }
              }}
            />
            <div className='image-action'>
              <div><EyeOutlined onClick={()=>{
            console.log('file',file)
            handlePreview(file)
          }}></EyeOutlined></div>
              <div><DeleteOutlined onClick={()=>{
                handleRemove(file)
          }}></DeleteOutlined></div>
            </div>
          </div>
        ) : (
          <div className="file-item" >
            <div className="file-icon">
              {getFileIcon(file.name || '')}
            </div>
            <div className="file-name" title={file.name}>
              {file.name}
            </div>
              <div className='image-action'>
              <div><DownloadOutlined onClick={()=>{
            console.log('file',file)
            handlePreview(file)
          }}></DownloadOutlined></div>
              <div><DeleteOutlined onClick={()=>{
                handleRemove(file)
          }}></DeleteOutlined></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 上传按钮
  const uploadButton = useMemo(() => {
    if (listType === 'picture-card' || listType === 'picture-circle') {
      return (
        <div className="upload-button">
          <UploadOutlined />
          <div style={{ marginTop: 8 }}>上传</div>
        </div>
      );
    }
    
    return children || (
      <div className="default-upload-button">
        <UploadOutlined />
        <span>点击上传</span>
      </div>
    );
  }, [listType, children]);

  return (
    <>
      <Upload
        {...restProps}
        fileList={value}
        onChange={handleChange}
        onPreview={handlePreview}
        beforeUpload={beforeUpload}
        accept={accept}
        listType={listType}
        showUploadList={showUploadList ? {
          showPreviewIcon: true,
          showRemoveIcon: true,
          showDownloadIcon: false,
        } : false}
        itemRender={customItemRender}
        isImageUrl={isImageFile}
      >
        {(!maxCount || !value || value.length < maxCount) && uploadButton}
      </Upload>

      {/* 图片预览模态框 */}
      {previewVisible && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewVisible,
            onVisibleChange: (visible) => setPreviewVisible(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
    </>
  );
};

export default CustomUpload;