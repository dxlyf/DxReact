import React, { useState, useEffect } from 'react';
import { Button, Select, Upload, Modal } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { getQiniuToken } from '@/services/material';
import * as qiniu from 'qiniu-js';
import { v4 as uuid } from 'uuid';
import fileExtension from 'file-extension';
import { useImmer } from 'use-immer';
import { getBase64 } from '../utils';
import styles from './PictureUpload.module.less';

const customRequest = async (config) => {
  const token: any = await getQiniuToken();

  const key = `${uuid()}.${fileExtension(config.file.name)}`;

  let observable = qiniu.upload(config.file, key, token);
  observable.subscribe({
    next: (res) => {
      // 主要用来展示进度
      const total: any = res.total;
      config.onProgress({
        percent: parseInt(total.percent),
      });
    },
    error: (err) => {
      // 失败报错信息
      config.onError(err);
    },
    complete: (res) => {
      // 接收成功后返回的信息
      config.onSuccess(res.key);
    },
  });
};

const PictureUpload = (props) => {
  const [fileList, setFileList] = useState<any>([]);

  const [state, setState]: any = useImmer({
    previewVisible: false,
    previewImage: '',
    previewTitle: '',
  });

  useEffect(() => {
    if (props.fileList) {
      let newFileList = props.fileList.map((item: any) => {
        return {
          uid: uuid(),
          status: 'done',
          url: item.url,
          name: item.url,
        };
      });
      setFileList(newFileList);
    }
  }, [props.fileList]);

  const handleCancel = () => {
    setState((draft) => {
      draft.previewVisible = false;
    });
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setState((draft) => {
      draft.previewImage = file.url || file.preview;
      draft.previewVisible = true;
      draft.previewTitle =
        file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
    });
  };

  const handleChange = ({ fileList }) => {
    const newFileList = fileList.map((file) => {
      if (file.response) {
        file.url = `https://rf..net/${file.response}`;
        file.name = `${file.response}`;
        file.thumbUrl = file.thumbUrl;
      }
      return file;
    });

    props.onChange({ fileList });
    setFileList([...newFileList]);

    // setState((draft) => {
    //   draft.fileList = fileList;
    // });
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );
  return (
    <>
      <Upload
        {...props}
        customRequest={customRequest}
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        multiple={props.multiple}
        className={styles.upload}
      >
        {fileList.length >= props.maxFiles ? null : uploadButton}
      </Upload>
      <Modal
        visible={state.previewVisible}
        title={state.previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="example" style={{ width: '100%' }} src={state.previewImage} />
      </Modal>
    </>
  );
};

export default PictureUpload;
