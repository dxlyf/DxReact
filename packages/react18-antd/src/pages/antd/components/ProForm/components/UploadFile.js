import React, { useRef,useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { LoadingOutlined, FileUnknownOutlined,UploadOutlined,FileWordOutlined, FilePdfOutlined, FileExcelOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { message, Upload, Button, Tooltip, Image, Space } from 'antd';
import EllipsisText from '../components/EllipsisText';
import fileApi from "$UI/wxsys/lib/base/fileApi";
import UUID from "$UI/wxsys/lib/base/uuid";
import styles from './upload.module.css'
import {useControllerValue,useMemoizedFn} from '$UI/pcx/hooks'
import { usePage } from '../../ProPage';

const isImage = (file) => {
  if (file.type && file.type.startsWith('image/')) {
    return true
  }
  const url = file.url || file.thumbUrl || file.name || ''
  if (url.startsWith('data:image:')) {
    return true
  }
  const imageReg = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i
  if (imageReg.test(url)) {
    return true
  }
  return false
}


const UploadFile = (props) => {
  const {fileList:propFileList,defaultFileList,action:propAction,accept,fileType, fileSize, onChange:propOnChange, disabled, maxCount, defaultValue, ...rest } = props
  const page=usePage()
  const [fileList,setFileList]=useControllerValue({
    value:propFileList,
    defaultValue:defaultFileList??[],
    onChange:propOnChange
  })
  const [previewImageindex, setPreviewImageindex] = useState(-1);

  const uploadAction = useMemo(()=>{
    return fileApi.getFileUrl({
        actionUrl: page.getServiceUrl("/storage"),
        operateType: "upload"
      })
  },[])

  const genStoreFileName = useMemo((file) => {
    let storeFileName = file.storeFileName;
    if (!storeFileName) {
      let realFileName = file.name;
      const date = new Date();
      const [month, day, year] = [
        date.getMonth() + 1,
        date.getDate(),
        date.getFullYear(),
      ];

      storeFileName = `/${year}/${month}/${day}` + "/anoy_" + new UUID() + realFileName;
      if (file.newFile) {
        file.newFile.storeFileName = storeFileName;
        file.newFile.realFileName = realFileName;
      }
      file.storeFileName = storeFileName;
      file.realFileName = realFileName;

    }
    let data = { ...props.data } || {};
    data.storeFileName = storeFileName;
    return data;
  },[])

  const handleChange = useMemoizedFn((info) => {
 
    const newFileList=info.fileList.map(file=>{
      if(file.status === 'done'&&!file.realFileName) {
          file.realFileName = file.response?.data?.storeFileName || file.name;
          file.storeFileName = file.response?.data?.storeFileName;
      }
      return file
    })
    setFileList(fileList);
  })
  const handlePreview = useMemoizedFn((file) => {
    // Use the URL generated in updateFileList if available
    const url = file.url ? file.url : currentPageInstance.getServiceUrl(fileApi.getFileUrl({
      actionUrl: "/storage",
      operateType: "preview",
      realFileName: file.realFileName,
      storeFileName: file.storeFileName
    }));
     setPreviewImage(url);
  })
  const handleDownLoad = useCallback((file) => {
    const url = file.url ? file.url : currentPageInstance.getServiceUrl(fileApi.getFileUrl({
      actionUrl: "/storage",
      operateType: "preview",
      realFileName: file.realFileName,
      storeFileName: file.storeFileName
    }));
    downloadFile(url,file.name)
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }, [])


  const beforeUpload = (file) => {
    // 检查文件数量限制
    if (maxCount && showFileList.length >= maxCount) {
      message.error(`最多只能上传 ${maxCount} 个文件`);
      return Upload.LIST_IGNORE
    }

    if (fileSize) {
      if (file.size / 1024 / 1024 > fileSize) {
        message.error(`文件大小限制：${fileSize}MB`);
        return Upload.LIST_IGNORE
      }
    }
    if (fileType) {
      const name = file.name
      const exc = name.split('.').pop()
      if (!exc || !fileType.includes(exc.toLowerCase())) {
        message.error(`文件類型限制：${fileType.join('、')}`);
        return Upload.LIST_IGNORE
      }
    }
  }


  const iconRender = useCallback((file) => {
    if (isImage(file)) {
      return <></>
    }
    const fileName=file.originFileObj?file.originFileObj.name:file.url||file.name
    const extension = fileName.split('.').pop()?.toLowerCase();
    
  switch (extension) {
    case 'pdf':
      return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    case 'doc':
    case 'docx':
      return <FileWordOutlined style={{ color: '#1890ff'}} />;
    case 'xls':
    case 'xlsx':
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    default:
      return  <FileUnknownOutlined style={{ color: '#999' }} />
  }
  }, [])
  const itemRender = useCallback((originNode, file, fileList, actions) => {
    const isImg = isImage(file)
    return <div className={styles.uploadListItem}>
      {isImg ? (
        <div className={styles.uploadListItemImage}>
          <img title={file.name} src={file.url || file.thumbUrl} />
          <div className={styles.uploadListItemAction}>
            <div>
              <EyeOutlined title='預覽' onClick={() => {
                actions.preview()
              }}></EyeOutlined>
            </div>
            <div>
              <DeleteOutlined title='刪除' onClick={() => {
                actions.remove()
              }}></DeleteOutlined>
            </div>
          </div>
        </div>
      ) : (<div className={styles.uploadListItemFile}>
        <div>{iconRender(file)}</div>
        <div className={styles.uploadListItemAction}>
          <div>
            <DownloadOutlined title='下載' onClick={() => {
              actions.download()
            }}></DownloadOutlined>
          </div>
          <div>
            <DeleteOutlined title='刪除' onClick={() => {
              actions.remove()
            }}></DeleteOutlined>
          </div>
        </div>
      </div>)}

    </div>
  }, [])
  const renderUploadBtn = () => {
    return (isUndef(maxCount) || showFileList.length < maxCount) && (
      <Tooltip title={fileSize || fileType ? <div>
        {fileSize && <p>{`文件大小限制：${fileSize}MB`}</p>}
        {fileType && <p>{`文件類型限制：${fileType.join('、')}`}</p>}
      </div> : undefined}>
        <div className={styles.uploadBtn}>
          <Space direction='vertical' size={0}>
            <UploadOutlined></UploadOutlined>{props.buttonText || '上傳'}
          </Space>
        </div>
      </Tooltip>
    )
  }
  const renderPreviewGroup=()=>{
      const items=Array.isArray(fileList)?fileList.map(d=>d.url||d.thumbUrl).filter(Boolean):[]
        return  <div style={{ display: 'none' }}>
        <Image.PreviewGroup items={items} preview={{ current:previewImageindex,visible:previewImageindex!=-1,onChange:(current)=>{
            setPreviewImageindex(current)
        }, onVisibleChange: vis =>{
            if(!vis){
               setPreviewImageindex(-1)
            }
        }}}>
        </Image.PreviewGroup>
      </div>
    }
  return (
    <>
      <Upload
        action={uploadAction}
        data={genStoreFileName}
        listType='picture-card'
        fileList={showFileList}
        isImageUrl={isImage}
        itemRender={itemRender}
        onChange={handleChange}
        onDownload={handleDownLoad}
        onPreview={handlePreview}
        beforeUpload={beforeUpload}
        disabled={disabled}
        className={styles.uploadSmall}
        maxCount={maxCount}
        name="userfile"
        {...(Array.isArray(fileType) && fileType.length ? {
          accept: fileType.map(v => `.${v}`).join(',')
        } : {})}
         {...rest}
      >
        {renderUploadBtn()}
      </Upload>
   {renderPreviewGroup()}
    </>

  );
};
export default UploadFile;