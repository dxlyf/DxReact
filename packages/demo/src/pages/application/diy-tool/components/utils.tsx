import { useEffect, useRef } from 'react';
import { Form, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

export const WrapTipText = ({ label, text, children }) => {
  return (
    <Form.Item label={label}>
      <Space>
        {children}
        <span style={{ color: '#999' }}>
          <InfoCircleOutlined style={{ paddingRight: 5 }} />
          {text}
        </span>
      </Space>
    </Form.Item>
  );
};

export const normFile = (e: any) => {
  // console.log('Upload event:', e);
  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
};

export function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export const useResetFormOnCloseModal = ({
  form,
  visible,
}: {
  form: FormInstance;
  visible: boolean;
}) => {
  const prevVisibleRef = useRef<boolean>();
  useEffect(() => {
    prevVisibleRef.current = visible;
  }, [visible]);
  const prevVisible = prevVisibleRef.current;

  useEffect(() => {
    if (!visible && prevVisible) {
      form.resetFields();
    }
  }, [visible]);
};

export function handleDict(HDict) {
  Object.keys(HDict).forEach((key) => {
    // list
    HDict[key].list = Object.keys(HDict[key].raw).map(
      (rawKey) => HDict[key].raw[rawKey],
    );
    // valObj
    const valObj = {};
    Object.values(HDict[key].raw).forEach(({ value, label }) => {
      valObj[value] = label;
    });
    HDict[key].valObj = Object.keys(valObj).length !== 0 ? valObj : null;
  });
  return HDict;
}
