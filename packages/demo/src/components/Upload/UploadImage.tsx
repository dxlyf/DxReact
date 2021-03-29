/**
 * 上传图片
 * @author fanyonglong
 */
import React, { useCallback, useState, useRef,useMemo } from 'react';
import { Upload, Modal, Typography, UploadProps, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useControllableValue } from 'ahooks';
import classNames from 'classnames';
import styles from './index.less';

const { Text } = Typography;
type UploadImageProp = {
  uploadBtnText?: string;
  descption?: any;
  draggleSort?: boolean;
  onChange?: (fileList: any) => void;
} & UploadProps;

function getBase64(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const type = 'DragableUploadList';

const DragableUploadListItem: React.FC<any> = ({
  originNode,
  moveRow,
  file,
  fileList,
}) => {
  const ref = useRef<any>();
  const index = fileList.indexOf(file);
  const [{ isOver }, drop] = useDrop({
    accept: type,
    collect: (monitor) => {
      return {
        isOver: monitor.isOver(),
        //dropClassName: dragIndex < index ? styles.overDown : styles.overDown.overUp,
      };
    },
    hover: (dragItem: any, monitor: any) => {
      let dragIndex = dragItem.index;
      let hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveRow(dragIndex, hoverIndex);
      dragItem.index = hoverIndex;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drop(drag(ref));
  const errorNode = (
    <Tooltip title="Upload Error">{originNode.props.children}</Tooltip>
  );
  const cls = classNames(styles.imageDragItem, {
    [styles.dragging]: isDragging,
  });
  return (
    <div ref={ref} className={cls} style={{ cursor: 'move' }}>
      {file.status === 'error' ? errorNode : originNode}
    </div>
  );
};
export const UploadImage: React.FC<UploadImageProp> = (props) => {
  let {
    uploadBtnText = '添加',
    maxCount=Infinity,
    onChange,
    defaultFileList: propDefaultFileList,
    fileList: propFileList,
    draggleSort = true,
    descption,
    ...restProps
  } = props;

  let [fileList, setFileList] = useControllableValue<any>(props, {
    defaultValue: [],
    defaultValuePropName: 'defaultFileList',
    valuePropName: 'fileList',
  });
  const [previewModal, setPreviewModal] = useState<any>({
    visible: false,
    title: '',
    url: null,
  });
  const onPreviewHandle = useCallback(async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewModal({
      visible: true,
      title: file.name || file.url.substring(file.url.lastIndexOf('/') + 1),
      url: file.url || file.preview,
    });
  }, []);
  const onCancelHandle = useCallback((file) => {
    setPreviewModal({
      visible: false,
      title: '',
      url: null,
    });
  }, []);
  const onChangeHandle = useCallback(
    ({ file, fileList, event }) => {
      let newFileList = [...fileList];
      setFileList(newFileList);
      onChange && onChange(newFileList);
    },
    [onChange],
  );
  const renderPreview = useCallback(() => {
    if (!previewModal.visible) {
      return null;
    }
    let url = previewModal.url;
    return <img alt="example" style={{ width: '100%' }} src={url} />;
  }, [previewModal]);

  const uploadButton =maxCount> fileList.length ? (
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>{uploadBtnText}</div>
      </div>
    ) : null;
  const moveRow = useCallback(
    (dragIndex, hoverIndex) => {
      const newFileList = [...fileList];
      const dragItem = newFileList[dragIndex];
      newFileList.splice(dragIndex, 1);
      newFileList.splice(hoverIndex, 0, dragItem);
      setFileList(newFileList);
    },
    [fileList],
  );

  const itemRender = useCallback(
    (originNode, file, currFileList) => {
      return draggleSort ? (
        <DragableUploadListItem
          originNode={originNode}
          file={file}
          fileList={currFileList}
          moveRow={moveRow}
        />
      ) : (
        originNode
      );
    },
    [moveRow, draggleSort],
  );
  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <Upload
          {...restProps}
          onChange={onChangeHandle}
          itemRender={itemRender}
          maxCount={maxCount}
          onPreview={onPreviewHandle}
          fileList={fileList}
          listType="picture-card"
        >
          {uploadButton}
        </Upload>
        <div>{descption && <Text type="secondary">{descption}</Text>}</div>
        <Modal
          visible={previewModal.visible}
          title={previewModal.title}
          footer={null}
          onCancel={onCancelHandle}
        >
          {renderPreview()}
        </Modal>
      </div>
    </DndProvider>
  );
};

export const useUplaodImage:(options?:any)=>any=(options:any={})=>{
  let {limitCount=1,initialValue=[]}=options
  let rules=useMemo(()=>[{
      required: true,
      type: "array",
      message: `请至少上传${limitCount}张图片！`
  }, {
      type: "array",
      validator: (rule:any, fileList:any[]) => {
          let files=[],errors=[],uploading=[]
          fileList.forEach(file => {
              if (file.response && file.status === 'error') {
                  errors.push(file)
                  return
              }
              if (file.response && file.status === 'uploading') {
                  uploading.push(file)
                  return
              }
              files.push(file)
          })
          if(errors.length>0){
              return Promise.reject('请先删除上传失败的图片！')
          } else if(uploading.length>0){
              return Promise.reject('图片还在上传中！')
          }else if(files.length<=0){
              return Promise.resolve(`请至少上传${limitCount}张图片!`)
          }
          return Promise.resolve()
      }
  }],[limitCount])
  const transform=useCallback((fileList,callback)=>{
      return fileList.map((file:any)=>{
          if(file.response){
              return {
                  uid:file.uid,
                  name:file.name,
                  url:file.reponse.data.path
              }
          }
          return file
      }).map(callback)
  },[])
  let formItemProps={
      valuePropName:"fileList",
      initialValue:initialValue,
      rules:rules
  }
  return [{formItemProps:formItemProps},{transform}]
}
