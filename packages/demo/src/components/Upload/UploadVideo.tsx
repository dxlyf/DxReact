/**
 * 上传视频
 * @author fanyonglong
 */
import React, { useCallback, useState, useRef } from 'react';
import { Upload, Modal, Typography, UploadProps, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useControllableValue } from 'ahooks';
import { uploadRequest, buindTodayUplaodDir } from './request';

const { Text } = Typography;
type UploadVideoeProps = {
  uploadBtnText?: string;
  descption?: any;
  uploadDir?: string;
  onChange?: (fileList: any) => void;
} & UploadProps;

export const UploadVideo: React.FC<UploadVideoeProps> = (props) => {
  let {
    uploadBtnText = '添加',
    maxCount = Infinity,
    onChange,
    descption,
    data,
    children,
    uploadDir = '',
    ...restProps
  } = props;

  let [fileList, setFileList] = useControllableValue<any>(props, {
    defaultValue: [],
    defaultValuePropName: 'defaultFileList',
    valuePropName: 'fileList',
  });
  const onChangeHandle = useCallback(
    ({ file, fileList, event }) => {
      let newFileList = [...fileList];
      setFileList(newFileList);
      onChange && onChange(newFileList);
    },
    [onChange],
  );

  const uploadButton =
    maxCount > fileList.length ? (
      children ? (
        children
      ) : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>{uploadBtnText}</div>
        </div>
      )
    ) : null;

  return (
    <div>
      <Upload
        customRequest={uploadRequest}
        {...restProps}
        data={{
          customVars: data,
          uploadDir: buindTodayUplaodDir({
            beforeDir: 'diy/images',
            afterDir: uploadDir,
          }),
        }}
        onChange={onChangeHandle}
        maxCount={maxCount}
        fileList={fileList}
        listType="picture-card"
      >
        {uploadButton}
      </Upload>
      <div>{descption && <Text type="secondary">{descption}</Text>}</div>
    </div>
  );
};
