import { message, Upload,Image, Tooltip, Row, Col, Space,Progress} from 'antd'
import type { UploadProps, UploadFile, GetProp, GetProps } from 'antd'
import useControllerValue from '../../hooks/useControllerValue'
import { useCallback, useMemo, useState } from 'react'
import useMemoizedFn from 'src/hooks/useMemoizedFn'
import {EyeOutlined,DeleteOutlined, FileExcelOutlined, FilePdfOutlined,PlusOutlined, FileTextOutlined, FileUnknownOutlined, FileWordOutlined, FileZipOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import './index.css'
import classNames from 'classnames'

export type SimpleUploadFile<T = any> = UploadFile<T> & {
    order?: number
}
export type SimpleUploadPropss<T = any> = Omit<UploadProps, 'fileList' | 'defaultFileList' | 'onChange'> & {
    value?: Array<SimpleUploadFile<T>>
    defaultValue?: Array<SimpleUploadFile<T>>
    size?: 'small' | 'middle' | 'large'
    extensions?:string[] // 允许上传的文件类型

    maxCount?: number // 最大上传数量 默认无限制
    maxSize?: number // 文件最大上传大小 默认1mb
    onChange?: (fileList: Array<SimpleUploadFile<T>>) => void
}
export const delay=(ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function uploadWithProgress(file, url, onProgress) {
  // 创建自定义可读流来跟踪上传进度
  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    let loaded = 0;
    const total = file.size;
    
    fileReader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 创建自定义可读流
      const readableStream = new ReadableStream({
        start(controller) {
          // 立即报告进度为0%
          onProgress && onProgress(0, total, 0);
          
          // 模拟分块上传以显示进度
          const chunkSize = 1024 * 64; // 64KB 块
          let offset = 0;
          
          function pushChunk() {
            if (offset >= total) {
              controller.close();
              return;
            }
            
            const end = Math.min(offset + chunkSize, total);
            const chunk = uint8Array.subarray(offset, end);
            controller.enqueue(chunk);
            
            loaded = end;
            offset = end;
            
            // 更新进度
            const percent = Math.round((loaded / total) * 100);
            onProgress && onProgress(loaded, total, percent);
            
            // 使用 setTimeout 模拟异步分块上传
            setTimeout(pushChunk, 0);
          }
          
          pushChunk();
        }
      });
      
      // 发送请求
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-File-Size': total.toString()
        },
        body: readableStream
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        onProgress && onProgress(total, total, 100); // 确保显示100%
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
    };
    
    fileReader.onerror = () => reject(new Error('File reading failed'));
    fileReader.readAsArrayBuffer(file);
  });
}
function uploadWithProgressXHR(file, url, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    // 上传进度事件
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress && onProgress(event.loaded, event.total, percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress && onProgress(xhr.total, xhr.total, 100);
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    
    xhr.onerror = () => reject(new Error('Upload failed'));
    
    xhr.open('POST', url);
    xhr.send(formData);
  });
}
// // 使用示例
// const fileInput = document.getElementById('fileInput');
// fileInput.addEventListener('change', async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
  
//   try {
//     await uploadWithProgress(file, '/api/upload', (loaded, total, percent) => {
//       console.log(`上传进度: ${loaded}/${total} bytes (${percent}%)`);
//       // 更新UI进度条
//       // progressBar.style.width = percent + '%';
//       // progressText.textContent = `${percent}%`;
//     });
//     console.log('上传完成！');
//   } catch (error) {
//     console.error('上传失败:', error);
//   }
// });

function readBase64(data:Blob|File){
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(data)
  })
}
export const CustomeRequest: GetProp<typeof Upload, 'customRequest'> =async (options) => {
    const { file, data, filename = 'file', withCredentials, action, headers = {}, method = 'post', onProgress, onError, onSuccess } = options

  const random=Math.random()
  console.log('random',random)
     if(random>0.5){
      
    await (new Promise((resolve)=>{
      let percent = 0
      const handle = () => {
        if (percent > 100) {
          resolve(null)
          return
        }
        let e = new ProgressEvent('progress')
        e.percent = percent++

        options.onProgress(e, file)
        setTimeout(handle, 20)
      }
      setTimeout(handle, 20)

    }))
       options?.onSuccess({
        url:await readBase64(file)
    },file)
     }else{
        console.log('fd')
        options?.onError?.(new Error('上传失败'))
     }
    //options.onError?.(new Error('上传失败'))

}
export enum FileType{
    Image,
    Word,
    Excel,
    Audio,
    Video,
    Pdf,
    Unknow,
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
const isImageFileType = (type: string): boolean => type.indexOf('image/') === 0;
const MEASURE_SIZE = 200;
export function previewImage(file: File | Blob): Promise<string> {
  return new Promise<string>((resolve) => {
    if (!file.type || !isImageFileType(file.type)) {
      resolve('');
      return;
    }
     
    const canvas = document.createElement('canvas');
    canvas.width = MEASURE_SIZE;
    canvas.height = MEASURE_SIZE;
    canvas.style.cssText = `position: fixed; left: 0; top: 0; width: ${MEASURE_SIZE}px; height: ${MEASURE_SIZE}px; z-index: 9999; display: none;`;
    document.body.appendChild<HTMLCanvasElement>(canvas);
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');
    img.onload = () => {
      const { width, height } = img;

      let drawWidth = MEASURE_SIZE;
      let drawHeight = MEASURE_SIZE;
      let offsetX = 0;
      let offsetY = 0;

      if (width > height) {
        drawHeight = height * (MEASURE_SIZE / width);
        offsetY = -(drawHeight - drawWidth) / 2;
      } else {
        drawWidth = width * (MEASURE_SIZE / height);
        offsetX = -(drawWidth - drawHeight) / 2;
      }

      ctx!.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      const dataURL = canvas.toDataURL();
      document.body.removeChild(canvas);
      window.URL.revokeObjectURL(img.src);
      resolve(dataURL);
    };
    img.crossOrigin = 'anonymous';
    if (file.type.startsWith('image/svg+xml')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          img.src = reader.result;
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/gif')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      img.src = window.URL.createObjectURL(file);
    }
  });
}
export const SimpleUpload = (props: SimpleUploadPropss) => {
    const { value: propValue,extensions,size='small', maxCount = Infinity, maxSize = 10, defaultValue: propDefaultValue, onChange, ...restProps } = props
     const [previewCurrentIndex,setPreviewCurrentIndex]=useState(-1)
    // 上传成功的文件
    const [value, setValue] = useControllerValue({
        value: propValue,
        defaultValue: propDefaultValue || [],
        onChange: onChange,
    })
    // // 上传中或上传失败的文件列表
    // const [otherFileList, setOtherFileList] = useState<Array<SimpleUploadFile>>([])
    const handleBeforeUpload = useMemoizedFn<GetProp<typeof Upload, 'beforeUpload'>>((file) => {
        // 针对上传的文件进行校验，如果文件大小超过限制则阻止上传
        const maxSizeMb = maxSize * 1024 * 1024
        if (file.size > maxSizeMb) {
            message.error(`文件大小不能超过${maxSize}Mb`)
            return Upload.LIST_IGNORE
        }
        return file
    })
    const handleChange = useCallback<GetProp<typeof Upload, 'onChange'>>((e) => {
        let fileList = e.fileList as SimpleUploadFile[]
        let newFileList=fileList.map(file=>{
           const oldItem=value.find(d=>d.uid===file.uid)

           return Object.assign(oldItem||{},file)
      
        })
        if(e.file.status==='done'){
          message.success('上传成功')
        }
        if(e.file.status==='error'){
          console.log('e',e.file)
            message.error('上传失败')
        }
        setValue(newFileList)
    }, [setValue,value])
    const isImage=useCallback((file: SimpleUploadFile) => {
        if(file.type&&file.type.startsWith('image/')){
            return true
        } 
        const url=file.url||file.thumbUrl||file.name||''
        if(url.startsWith('data:image:')){
            return true
        }
        const imageReg=/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i
        if(imageReg.test(url)){
            return true
        }
        return false
    },[])

    const handlePreview=useCallback<GetProp<typeof Upload, 'onPreview'>>((file)=>{
        if(isImage(file)){
          const index=value.findIndex(d=>d.uid===file.uid)
          if(index!==-1){
              setPreviewCurrentIndex(index)
          }
            return
        } 
    },[value])
    const handleDownLoad=useCallback<GetProp<typeof Upload, 'onDownload'>>((file)=>{
        const a=document.createElement('a')
        a.href=file.url||file.thumbUrl
        a.target='_blank'
        a.download=file.name
        a.style.position='fixed'
        a.style.opacity='0'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(()=>{
            URL.revokeObjectURL(a.href)
        },100)
    }, [])


    const mergeFileList = useMemo(() => {
        // if (otherFileList.length <= 0) {
        //     return value
        // }
       // return [...value, ...otherFileList].sort((a, b) => a.order - b.order)
      return value
    }, [value])

    const showPreviewIcon=useCallback((file: SimpleUploadFile) => {
        return isImage(file)
    }, [])
    const showDownloadIcon=useCallback((file: SimpleUploadFile) => {
        return !isImage(file)
    }, [])
    const iconRender=useCallback((file: SimpleUploadFile) => {
        return getFileIcon(file.originFileObj?file.originFileObj.name:file.url||file.name)
    }, [])
    const renderUploadBtn = () => {
        if (mergeFileList.length >= maxCount) return null
        if(extensions){
            return <Tooltip  title={<div>
                支持的文件格式：{extensions.join(',')}
            </div>}>
            <div className='simple-upload-btn'>
            <Space direction='vertical' size={0}>
                <UploadOutlined></UploadOutlined>上传
            </Space>
        </div>
            </Tooltip>
        }
        return <div className='simple-upload-btn'>
            <Space direction='vertical' size={0}>
                <UploadOutlined></UploadOutlined>上传
            </Space>
        </div>
    }
    const renderPreviewGroup=()=>{
      const items=Array.isArray(value)?value.map(d=>d.url||d.thumbUrl).filter(Boolean):[]
        return  <div style={{ display: 'none' }}>
        <Image.PreviewGroup items={items} preview={{ current:previewCurrentIndex,visible:previewCurrentIndex!=-1,onChange:(current)=>{
            setPreviewCurrentIndex(current)
        }, onVisibleChange: vis =>{
            if(!vis){
               setPreviewCurrentIndex(-1)
            }
        }}}>
        </Image.PreviewGroup>
      </div>
    }
    const [hoverId,setHoverId]=useState('')
    const itemRender=useCallback<GetProp<typeof Upload,'itemRender'>>((originNode,file,fileList,actions)=>{
        if(false){
            return originNode
        }
        const isImg=isImage(file)
        const done=file.status==='done'||file.status===undefined
        const actionDisabled=done!==true
        const uploading=file.status==='uploading'
        const percent=file.percent=file.percent||0

        const progressDom=(<div className='simple-upload-file-item-progress'>
          <Progress type='line' size="small" showInfo={false} percent={percent} ></Progress>
        </div>)
        const active=hoverId===file.uid
        const fileDom=isImg?(
                <div className='simple-upload-file-item-image'>
                    <img title={file.name} src={file.url||file.thumbUrl} />
                       <div className={classNames('simple-upload-file-item-action',{
                       })}>
                        <div>
                            <EyeOutlined disabled={actionDisabled}  title='预览' onClick={()=>{
                                actions.preview()
                            }}></EyeOutlined>
                        </div>
                        <div>
                            <DeleteOutlined  title='删除' onClick={()=>{
                                actions.remove()
                            }}></DeleteOutlined>
                        </div>
                        </div> 
                </div>
            ):( <div className='simple-upload-file-item-file'>
                      <div>{iconRender(file)}</div>
                      <div className='simple-upload-file-item-filename' title={file.name}>{file.name}</div>
                       <div className='simple-upload-file-item-action'>
                        <div>
                            <DownloadOutlined disabled={actionDisabled}  title='下载' onClick={()=>{
                                actions.download()
                            }}></DownloadOutlined>
                        </div>
                        <div>
                            <DeleteOutlined title='删除' onClick={()=>{
                                actions.remove()
                            }}></DeleteOutlined>
                        </div>
                        </div> 
                </div>)
        let id:any
        return <div onMouseOver={(e)=>{
          if(e.target&&e.target.closest('.simple-upload-file-item-filename')){
            console.log('ffffffff')
             if(id){
              clearTimeout(id)
            }
            setHoverId('')
            return
          }
            if(active){
              return
            }
             console.log('enter')
            if(id){
              clearTimeout(id)
            }
            id=setTimeout(()=>{
              setHoverId(file.uid)
            },300)
        }} onMouseLeave={()=>{
            if(id){
              clearTimeout(id)
            }
            setHoverId('')
        }} className={classNames('simple-upload-file-item',`simple-upload-file-item-${file.status||'done'}`,{
              'active':active
        })}>
          {fileDom}
         {uploading?progressDom:null}
        </div>
    },[hoverId])
    return <>
    <Upload  maxCount={maxCount} itemRender={itemRender} className={classNames('simple-upload-'+size)} iconRender={iconRender} isImageUrl={isImage} showUploadList={{showPreviewIcon,showDownloadIcon}}  customRequest={CustomeRequest} listType='picture-card' fileList={mergeFileList} onDownload={handleDownLoad}  onPreview={handlePreview} beforeUpload={handleBeforeUpload} onChange={handleChange} {...restProps}>
        {renderUploadBtn()}
    </Upload>
    {renderPreviewGroup()}
   </>
}