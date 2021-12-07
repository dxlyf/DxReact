/**
 * 作品设置-分享设置
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Card, Space, Button, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { getShareConfig, updateShareConfig } from '@/services/setting';
const formProps: Record<string, any> = {
  wrapperCol: {
    xxl: { span: 10 },
    xl: { span: 10 },
    lg: { span: 10 },
    md: { span: 10 },
  },
  labelCol: {
    xxl: { span: 3 },
    xl: { span: 2 },
    lg: { span: 4 },
    md: { span: 6 },
  },
  layout: 'horizontal',
};
const ShareSetting: React.FC<any> = () => {
  let [fields, setFields] = useState([]);
  let [form] = Form.useForm();
  useEffect(() => {
    getShareConfig().then((labels: any) => {
      if (labels.length <= 0) {
        labels = [''];
      }
      form.setFieldsValue({
        labels: labels.map((label) => ({ name: label })),
      });
    });
  }, []);
  const onSubmitLabel = useCallback((values) => {
    let labels = values.labels.map((d) => d.name);
    updateShareConfig(labels).then(() => {
      message.success('保存成功');
    });
  }, []);
  return (
    <Card>
      <Form form={form} {...formProps} onFinish={onSubmitLabel}>
        <Form.Item label="分享文案">
          <Form.List name="labels" initialValue={fields}>
            {(fields, { add, remove }) => {
              return (
                <>
                  {fields.map((field, index, fields) => (
                    <div key={field.key}>
                      <Space key={field.key} align="baseline">
                        <Form.Item
                          name={[field.name, 'name']}
                          rules={[
                            {
                              required: true,
                              message: '文案内容不能为空',
                            },
                          ]}
                          fieldKey={[field.fieldKey, 'name']}
                        >
                          <Input maxLength={30} style={{ width: 330 }} />
                        </Form.Item>
                        {fields.length > 1 ? (
                          <MinusCircleOutlined
                            onClick={() => remove(field.name)}
                          />
                        ) : null}
                      </Space>
                    </div>
                  ))}      
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        添加
                      </Button>
                    </Form.Item>
                </>
              );
            }}
          </Form.List>
        </Form.Item>
        <Form.Item label={<span></span>} colon={false}>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default ShareSetting;
