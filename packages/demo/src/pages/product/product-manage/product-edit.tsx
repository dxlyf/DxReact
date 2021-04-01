import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  InputNumber,
  Tag,
  message,
  Descriptions,
} from 'antd';
import { UploadImage, UploadVideo, useUplaodImage } from '@/components/Upload';
import classNames from 'classnames';
import DSYunProductListModal from './components/DSYunProductList';
import { connect, ConnectRC, Loading } from 'umi';
import { get } from 'lodash';
import { transformFilesToUrls } from '@/utils/util';
import Editor from '@/components/Editor';
import type {
  ProductModelState,
  ProductEntityStateType,
  ProductEntity,
} from './models/product';
import ProductGroupSelect from './components/ProductGroupSelect';
import DIYModelSelect from './components/DIYModelSelect';
import SKUTable from './components/SKUTable';
import styles from './index.less';

const regexp_number = /^([1-9]+\d*(\.\d+)?|0\.\d+|\d)$/;
type StepHandle = (...args: any[]) => Promise<boolean | void>;
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
const formProps2: Record<string, any> = {
  wrapperCol: {
    xxl: { span: 21 },
    xl: { span: 22 },
    lg: { span: 20 },
    md: { span: 18 },
  },
  labelCol: {
    xxl: { span: 3 },
    xl: { span: 2 },
    lg: { span: 4 },
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
type ProductEditProps = {
  product: ProductModelState;
};

const ProductEdit: ConnectRC<ProductEditProps> = ({
  product,
  dispatch,
  match,
  submitLoading,
}: any) => {
  let { detail, shopList } = product;
  let productEditId = match?.params.id;
  const [formDetail] = Form.useForm();
  const [formDetail2] = Form.useForm();
  const [] = useState(() => {});
  const [currentStep, setCurrentStep] = useState(0);
  const [submitData, setSubmitData] = useState({});
  const [visibleDSYunModal, setVisibleDSYunModal] = useState(false);
  const [
    { formItemProps: imageFormItemPorps },
    { transform: transformImage },
  ] = useUplaodImage();
  const [goodDetailType, setGoodDetailType] = useState<string>('0');
  const isEditMode = detail.id !== ''; // 是否编辑模式
  const skutableRef = useRef<any>();

  // 获取修改的数据
  const getEditSubmitFormData = useCallback(
    (formData, skuData) => {
      let submitData: any = {
        shopId: formData.shopId,
        categoryId: detail.categoryId,
        categoryName: formData.categoryName,
        categoryType: detail.categoryType,
        type: detail.type,
        productNo: formData.productNo,
        name: formData.name,
        productName: formData.productName,
        productDesc: formData.productDesc.trim(),
        imageUrl: transformFilesToUrls(formData.imageUrl).join(','),
        videoUrl: transformFilesToUrls(formData.videoUrl).join(''),
        propertyStr: detail.propertyStr,
        linePrice:
          formData.linePrice !== undefined && Number(formData.linePrice) > 0
            ? formData.linePrice
            : undefined,
        productGroupNameStr: formData.productGroupNameStr.join(','),
        diyModelId: formData.diyModelId,
        shopProductItemList: detail.shopProductItemList.map((spec: any) => {
          let specFormItem = skuData.skus[spec.id];
          let specData: any = {
            productItemNo: spec.productItemNo,
            imageUrl: transformFilesToUrls(specFormItem.imageUrl).join(''),
            recommendedPrice: specFormItem.recommendedPrice,
            price: specFormItem.price,
            stockNum: specFormItem.stockNum,
            isEnable: specFormItem.isEnable,
            diyModelId: specFormItem.diyModelId,
            shopProductPropertyList: spec.shopProductPropertyList.map(
              (p: any) => {
                return {
                  propertyId: p.propertyId,
                  propertyName: p.propertyName,
                  propertyValueId: p.propertyValueId,
                  propertyValue: p.propertyValue,
                };
              },
            ),
          };
          if (isEditMode) {
            specData.id = spec.id;
          }
          return specData;
        }),
        shopProductDetail: {
          appContent: '',
          pcContent: '',
        },
      };
      if (isEditMode) {
        submitData.id = detail.id;
        submitData.shopProductDetail.id = detail.shopProductDetail.id;
      }
      return submitData;
    },
    [detail, transformImage, isEditMode],
  );

  const onFormFinish = useCallback(
    (name: string, { values, forms }) => {
      if (name == 'step1') {
        skutableRef.current.validateFields().then((skuTable: any) => {
          // console.log('skuTable',skuTable)
          let newSubmitData = getEditSubmitFormData(values, skuTable);
          setSubmitData(newSubmitData);
          setCurrentStep((currentStep: number) => currentStep + 1);
        });
      } else if (name == 'step2') {
        let finalSubmitData: any = {
          ...submitData,
        };
        finalSubmitData.shopProductDetail.appContent = values.appContent;
        finalSubmitData.shopProductDetail.pcContent = values.pcContent;
        if (isEditMode) {
          dispatch({
            type: 'product/updateProduct',
            payload: finalSubmitData,
          }).then(() => {
            message.success('修改商品成功！');
          });
        } else {
          dispatch({
            type: 'product/addProduct',
            payload: finalSubmitData,
          }).then(() => {
            message.success('添加商品成功！');
          });
        }
      }
    },
    [skutableRef, detail, isEditMode, submitData, getEditSubmitFormData],
  );
  const bindDSYunProductDetail = useCallback(
    (detail: ProductEntityStateType) => {
      formDetail.setFieldsValue({
        productNo: detail.productNo,
        categoryName: detail.categoryName,
        categoryTypeName: detail.categoryTypeName,
        name: detail.name,
        imageUrl: detail.imageUrl,
      });
    },
    [],
  );
  const bindProductDetail = useCallback((detail: ProductEntityStateType) => {
    formDetail.setFieldsValue({
      shopId: detail.shopId,
      productNo: detail.productNo,
      categoryName: detail.categoryName,
      categoryTypeName: detail.categoryTypeName,
      name: detail.name,
      productName: detail.productName,
      productDesc: detail.productDesc,
      imageUrl: detail.imageUrl,
      videoUrl: detail.videoUrl,
      diyModelId: detail.diyModelId,
      productGroupNameStr: detail.productGroupNameStr,
      linePrice: detail.linePrice,
    });
    formDetail2.setFieldsValue({
      appContent: detail.shopProductDetail.appContent,
      pcContent: detail.shopProductDetail.pcContent,
    });
  }, []);
  const onSelectDSYunProduct = useCallback(
    (record: any) => {
      dispatch({
        type: 'product/bindDsyunProductToDetail',
        payload: record.id,
      }).then((detail: any) => {
        bindDSYunProductDetail(detail);
      });
    },
    [bindDSYunProductDetail],
  );
  const renderPropertyList = useCallback(() => {
    return (
      <div style={{ marginTop: 20 }}>
        {detail.propertyList.map((d: any, index: any) => {
          return (
            <div key={d.id}>
              <Form.Item
                style={{ marginBottom: 5 }}
                label={<div style={{ width: 80 }}>规格名称</div>}
              >
                {d.name}
              </Form.Item>
              <Form.Item
                style={{ marginBottom: 5 }}
                label={<div style={{ width: 80 }}>规格值</div>}
              >
                {d.propertyValues.map((p: any) => {
                  return <Tag key={p.id}>{p.value}</Tag>;
                })}
              </Form.Item>
            </div>
          );
        })}
      </div>
    );
  }, [detail.propertyList]);

  useEffect(() => {
    dispatch({
      type: 'product/getShopList',
    });
    if (productEditId !== undefined) {
      dispatch({
        type: 'product/getProductDetail',
        payload: productEditId,
      }).then((detail: any) => {
        bindProductDetail(detail);
      });
    }
    return () => {
      dispatch({
        type: 'product/resetDetail',
      });
    };
  }, []);

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
          <Form
            {...formProps}
            className={classNames({
              [styles.hidden]: currentStep !== 0,
            })}
            name="step1"
            form={formDetail}
          >
            {
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
                      <Select>
                        {shopList.map((d: any) => (
                          <Select.Option value={d.id} key={d.id}>
                            {d.name}
                          </Select.Option>
                        ))}
                      </Select>
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
                    <Form.Item
                      label="商品编码"
                      name="productNo"
                      rules={[{ required: true, message: '商品编码不能为空!' }]}
                    >
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
                    <Form.Item
                      label="商品图片"
                      name="imageUrl"
                      {...formProps2}
                      {...imageFormItemPorps}
                    >
                      <UploadImage
                        descption={productImageDesc}
                        maxCount={15}
                      ></UploadImage>
                    </Form.Item>
                    <Form.Item
                      label="商品视频"
                      name="videoUrl"
                      {...formProps2}
                      initialValue={[]}
                      valuePropName="fileList"
                    >
                      <UploadVideo
                        descption={productVideoDesc}
                        maxCount={1}
                      ></UploadVideo>
                    </Form.Item>

                    <Form.Item label="DIY商品模型">
                      <Input.Group>
                        <Form.Item name="diyModelId">
                          <DIYModelSelect></DIYModelSelect>
                        </Form.Item>
                      </Input.Group>
                    </Form.Item>
                    <Form.Item label="商品分组" name="productGroupNameStr">
                      <ProductGroupSelect></ProductGroupSelect>
                    </Form.Item>
                  </Card>
                  <Card
                    title="库存价格"
                    bordered={false}
                    className={styles.cardTitle}
                  >
                    <Form.Item label="商品规格">
                      {renderPropertyList()}
                    </Form.Item>
                    <Form.Item label="规格明细" {...formProps2}>
                      <SKUTable
                        ref={skutableRef}
                        propertyList={detail.propertyList}
                        shopProductItemList={detail.shopProductItemList}
                        dispatch={dispatch}
                      ></SKUTable>
                    </Form.Item>
                    <Form.Item
                      label="划线价(元)"
                      name="linePrice"
                      rules={[
                        {
                          validator(rule, value) {
                            if (
                              value !== '' &&
                              value !== null &&
                              value !== undefined &&
                              !regexp_number.test(value)
                            ) {
                              return Promise.reject('请输入数字');
                            } else if (
                              regexp_number.test(value) &&
                              Number(value) <= 0
                            ) {
                              return Promise.reject('不能小于0');
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input
                        prefix={<span>￥</span>}
                        style={{ width: 120 }}
                      ></Input>
                    </Form.Item>
                  </Card>
                  <Form.Item label={<span></span>} colon={false}>
                    <Button htmlType="submit" type="primary">
                      下一步
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            }
          </Form>
          <Form
            {...formProps2}
            className={classNames({
              [styles.hidden]: currentStep !== 1,
            })}
            name="step2"
            form={formDetail2}
          >
            {
              <Row className={styles.formContent}>
                <Col span={24}>
                  <Form.Item label="商品详情">
                    <Tabs
                      activeKey={goodDetailType}
                      type="card"
                      onChange={(value) => {
                        setGoodDetailType(value);
                      }}
                    >
                      <Tabs.TabPane key="0" tab="移动端" forceRender>
                        <Form.Item name="appContent">
                          <Editor></Editor>
                        </Form.Item>
                      </Tabs.TabPane>
                      <Tabs.TabPane key="1" tab="电脑端" forceRender>
                        <Form.Item name="pcContent">
                          <Editor></Editor>
                        </Form.Item>
                      </Tabs.TabPane>
                    </Tabs>
                  </Form.Item>
                  <Form.Item label={<span></span>} colon={false}>
                    <Space>
                      <Button
                        type="primary"
                        onClick={() => {
                          setCurrentStep(currentStep - 1);
                        }}
                      >
                        上一步
                      </Button>
                      <Button
                        htmlType="submit"
                        type="primary"
                        loading={submitLoading}
                      >
                        保存
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            }
          </Form>
        </Form.Provider>
      </Card>
      <DSYunProductListModal
        visible={visibleDSYunModal}
        onCancel={setVisibleDSYunModal}
        onOk={onSelectDSYunProduct}
      ></DSYunProductListModal>
    </>
  );
};
export default connect(
  ({ product, loading }: { product: ProductModelState; loading: Loading }) => ({
    product,
    submitLoading: loading.models.product,
  }),
)(ProductEdit);
