import React, { useState, useEffect } from 'react';
import { Button, Select, Upload, Modal } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getQiniuToken } from '@/services/material';
import * as qiniu from 'qiniu-js';
import { v4 as uuid } from 'uuid';
import fileExtension from 'file-extension';
import { useImmer } from 'use-immer';
import { getBase64 } from './utils';

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

const QiniuFileUpload = (props) => {
  const [fileList, setFileList] = useState<any>([]);

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
  }, []);

  const handleChange = ({ fileList }) => {
    // console.log(
    //   '🚀 ~ file: FileUpload.tsx ~ line 54 ~ handleChange ~ fileList',
    //   fileList,
    // );
    const newFileList = fileList.map((file) => {
      if (file.response) {
        file.url = `https://rf.blissmall.net/${file.response}`;
        file.name = file.response;
      }
      return file;
    });

    props.onChange({ fileList });
    setFileList([...newFileList]);

    // setState((draft) => {
    //   draft.fileList = fileList;
    // });
  };

  return (
    <>
      <Upload
        customRequest={customRequest}
        fileList={fileList}
        onChange={handleChange}
        multiple={props.multiple}
        maxCount={props.maxCount}
      >
        <Button icon={<UploadOutlined />}>上传文件</Button>
      </Upload>
    </>
  );
};

export default QiniuFileUpload;
