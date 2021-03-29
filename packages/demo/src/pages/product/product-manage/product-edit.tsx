import React, { useCallback, useState, useReducer } from 'react';
import {
  Card,
  Button,
  Tabs,
  Steps,
  Input,
  Form,
  Row,
  Col,
  Upload,
  Typography,
  Space,
  Select,
  InputNumber
} from 'antd';
import { UploadImage, UploadVideo, useUplaodImage } from '@/components/Upload';
import classNames from 'classnames';
import styles from './index.less';
import DSYunProductListModal from './components/DSYunProductList';
import {connect,ConnectRC} from 'umi'
import {get} from 'lodash'
import {PRODUCT} from '@/common/constants'
import type {ProductModelState,ProductEntity} from './models/product'


type StepHandle = (...args: any[]) => Promise<boolean | void>;
const formProps: Record<string, any> = {
  wrapperCol: {
    lg: { span: 10 },
    md: { span: 10 },
  },
  labelCol: {
    lg: { span: 6 },
    md: { span: 6 },
  },
  layout: 'horizontal',
};

const productImageDesc = (
  <span>
    建议尺寸800*800像素，建议大小不超过600KB，你可以拖拽图片调整顺序，
    <Typography.Text type="danger">默认第一张为商品主图</Typography.Text>
    ，最多上传15张
  </span>
);
const productVideoDesc = (
  <span>
    添加主图视频可提升成交转化，有利于获取更多新流量；建议视频突出商品核心卖点，时长
    9-30 秒，宽高比 16:9
  </span>
);
type ProductEditProps={
  product:ProductModelState
}
const ProductEdit:ConnectRC<ProductEditProps> = ({product,dispatch}) => {
  let {detail}=product
  const [formDetail]=Form.useForm()
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleDSYunModal, setVisibleDSYunModal] = useState(false);
  const [{ formItemProps: imageFormItemPorps }] = useUplaodImage()
  const onFormFinish = useCallback((name: string, { values, forms }) => {
    if (name == 'step1') {
      console.log('values', values);
    }
  }, []);
  const bindProductDetail=useCallback((detail:ProductEntity)=>{
      formDetail.setFieldsValue({
        id:detail.id,
        productNo:detail.productNo,
        categoryName:detail.categoryName,
        categoryTypeName:get(PRODUCT.CATEGORY_TYPES[detail.categoryType],'text'),
        name:detail.name,
        productName:detail.productName,
        productDesc:detail.productDesc,
        diyModelId:detail.diyModelId,
        productGroupNameStr:detail.productGroupNameStr
      })
  },[])
  const onSelectDSYunProduct=useCallback((record:any)=>{
      formDetail.resetFields()
      dispatch({
        type:"product/bindDsyunProductToDetail",
        payload:record.id
      }).then((detail:any)=>{
          bindProductDetail(detail)
      })
  },[])
  
  return (
    <>
      <Card
        title={
          <Button
            type="primary"
            onClick={() => {
              setVisibleDSYunModal(true);
            }}
          >
            选择商品
          </Button>
        }
      >
        <Steps style={{ width: 400, margin: '0 auto' }} current={currentStep}>
          <Steps.Step title="基本信息" key={0}></Steps.Step>
          <Steps.Step title="商品详情" key={1}></Steps.Step>
        </Steps>
        <Form.Provider onFormFinish={onFormFinish}>
          {currentStep == 0 && (
            <Form {...formProps} name="step1" form={formDetail}>
              <Row className={styles.formContent}>
                <Col span={24}>
                  <Card
                    title="商品归属"
                    bordered={false}
                    className={styles.cardTitle}
                  >
                    <Form.Item
                      label="商品所属店铺"
                      name="shopId"
                      rules={[
                        { required: true, message: '请选择商品所属店铺！' },
                      ]}
                    >
                      <Input></Input>
                    </Form.Item>
                  </Card>
                  <Card
                    title="基础信息"
                    bordered={false}
                    className={styles.cardTitle}
                  >
                    <Form.Item label="商品ID" name="id">
                      <Input placeholder="系统自动生成" disabled></Input>
                    </Form.Item>
                    <Form.Item label="商品类型" name="categoryTypeName">
                      <Input disabled></Input>
                    </Form.Item>
                    <Form.Item label="商品编码" name="productNo">
                      <Input disabled></Input>
                    </Form.Item>
                    <Form.Item label="商品分类" name="categoryName">
                      <Input disabled></Input>
                    </Form.Item>
                    <Form.Item label="商品名称" name="name">
                      <Input disabled></Input>
                    </Form.Item>
                    <Form.Item
                      label="商品名"
                      name="productName"
                      rules={[
                        {
                          required: true,
                          message: '请输入商品名称！',
                          whitespace: true,
                        },
                      ]}
                    >
                      <Input maxLength={50}></Input>
                    </Form.Item>
                    <Form.Item label="商品卖点" name="productDesc">
                      <Input maxLength={50}></Input>
                    </Form.Item>
                    <Form.Item label="商品图片" name="imageUrl" {...imageFormItemPorps}>
                      <UploadImage descption={productImageDesc}></UploadImage>
                    </Form.Item>
                    <Form.Item label="商品视频" name="videoUrl">
                      <UploadVideo descption={productVideoDesc}></UploadVideo>
                    </Form.Item>

                    <Form.Item label="DIY商品模型">
                      <Input.Group>
                        <Form.Item name="diyModelId" noStyle>
                          <Input addonAfter={<a>选择3D模型</a>}></Input>
                        </Form.Item>
                      </Input.Group>
                    </Form.Item>
                    <Form.Item label="商品分组" name="productGroupNameStr">
                      <Input></Input>
                    </Form.Item>
                  </Card>
                  <Card
                    title="库存价格"
                    bordered={false}
                    className={styles.cardTitle}
                  >
                    <Form.Item label="商品规格"></Form.Item>
                    <Form.Item label="规格明细"></Form.Item>
                    <Form.Item label="划线价(元)" name="linePrice">
                      <Input></Input>
                    </Form.Item>
                  </Card>
                  <Form.Item label={<span></span>} colon={false}>
                    <Button htmlType="submit" type="primary">
                      下一步
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          )}
          {currentStep == 1 && <Form>fg</Form>}
        </Form.Provider>
      </Card>
      <DSYunProductListModal
        visible={visibleDSYunModal}
        onCancel={setVisibleDSYunModal} onOk={onSelectDSYunProduct}
      ></DSYunProductListModal>
    </>
  );
};
export default connect(({product}:{product:ProductModelState})=>({product}))(ProductEdit);
