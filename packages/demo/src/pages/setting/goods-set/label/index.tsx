/**
 * 商品设置-商品标签
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Card, Space, Button, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { getLabelConfig, updateLabelConfig } from '@/services/setting';
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
const LabelSetting: React.FC<any> = () => {
  let [fields, setFields] = useState([]);
  let [form] = Form.useForm();
  useEffect(() => {
    getLabelConfig().then((labels: any) => {
      if (labels.length <= 0) {
        labels = [{id:'',label:''}];
      }
      form.setFieldsValue({
        labels:labels,
      });
    });
  }, []);
  const onSubmitLabel = useCallback((values) => {
    let labels = values.labels
    updateLabelConfig(labels).then(() => {
      message.success('保存成功');
    });
  }, []);
  return (
    <Card>
      <Form form={form} {...formProps} onFinish={onSubmitLabel}>
        <Form.Item label="商品标签">
          <Form.List name="labels" initialValue={fields}>
            {(fields, { add, remove }) => {
              return (
                <>
                  {fields.map((field, index, fields) => (
                    <div key={field.key}>
                      <Space key={field.key} align="baseline">
                      <Form.Item
                          name={[field.name, 'id']}
                          fieldKey={[field.fieldKey, 'id']}
                          hidden
                        ><Input></Input></Form.Item>
                        <Form.Item
                          name={[field.name, 'label']}
                          rules={[
                            {
                              required: true,
                              message: '标签不能为空',
                            },
                            {
                              validator(rule, value) {
                                if (
                                  fields.some((f) => {
                                    let fieldValue = form.getFieldValue([
                                      'labels',
                                      f.name,
                                      'label',
                                    ]);
                                    return (
                                      f.fieldKey != field.fieldKey &&
                                      fieldValue == value
                                    );
                                  })
                                ) {
                                  return Promise.reject(
                                    '该标签已存在,请输入其它值',
                                  );
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                          fieldKey={[field.fieldKey, 'label']}
                        >
                          <Input maxLength={4} style={{ width: 330 }} />
                        </Form.Item>
                        {fields.length > 1 ? (
                          <MinusCircleOutlined
                            onClick={() => remove(field.name)}
                          />
                        ) : null}
                      </Space>
                    </div>
                  ))}
                  {fields.length >= 10 ? null : (
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add({label:"",id:""})}
                        block
                        icon={<PlusOutlined />}
                      >
                        添加
                      </Button>
                    </Form.Item>
                  )}
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
export default LabelSetting;
