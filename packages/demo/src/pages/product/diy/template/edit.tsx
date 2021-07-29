/**
 * 模板详情
 * @author fanyonglong
 */
import React, { useCallback, useState, useEffect } from 'react';
import { Form, Card, Space, Button, Input, message, Row, Col } from 'antd';
import * as diyService from '@/services/diy';

const formLayout = {
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
};
const TemplateDetail: React.FC<any> = (props) => {
  let id = props.match?.params.id;
  let [loading, setLoading] = useState(false);
  let [detail, setDetail] = useState({
    productList: [],
  });
  let [form] = Form.useForm();
  const onSubmitHandle = useCallback(
    (values: any) => {
      let submitdata = {
        id: id,
        name: values.name,
        templateRemark: values.templateRemark,
      };
      setLoading(true);
      diyService
        .updateTempalte(submitdata)
        .then(() => {
          setLoading(false);
          message.success('保存成功');
          props.history.push('/product/diy/template');
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [id],
  );
  useEffect(() => {
    diyService
      .getTemplateDetail({
        id: id,
      })
      .then((d: any) => {
        setDetail({
          productList: d.productList,
        });
        form.setFieldsValue({
          name: d.name,
          templateRemark: d.templateRemark,
        });
      });
  }, []);
  return (
    <Card title="模板详情">
      <Form {...formLayout} form={form} onFinish={onSubmitHandle}>
        <Form.Item
          label="模板名称"
          name="name"
          rules={[
            {
              required: true,
              message: '模板名称不能为空！',
            },
          ]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label="模板简介" name="templateRemark">
          <Input.TextArea rows={10} maxLength={200}></Input.TextArea>
        </Form.Item>
        <Form.Item label="商品明细">
          {detail.productList.map((item, index) => (
            <Row style={{ width: '80%' }} justify="space-between" key={index}>
              <Col>{item.productName}</Col>
              <Col>x{item.quantity}</Col>
            </Row>
          ))}
        </Form.Item>
        <Form.Item colon={false} label={<span></span>}>
          <Space>
            <Button
              onClick={() => {
                props.history.push('/product/diy/template');
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default TemplateDetail;
