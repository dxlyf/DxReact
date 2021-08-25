/**
 * 商品管理-商品发布
 * @author fanyonglong
 */
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
import DSYunProductListModal from './components/DSYunProductList';
import { connect, ConnectRC, Loading, history } from 'umi';
import { transformFilesToUrls } from '@/utils/util';
import GoodsLabelSelect from './components/GoodsLabelSelect'
import type {
  ProductModelState,
  ProductEntityStateType
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
  const [] = useState(() => { });
  const [DSYunModal, setDSYunModal] = useState({
    visible: false,
    dataItem: {},
  });
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
        topProductId:detail.topProductId,
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
        isCake: formData.isCake,
        labelId:formData.labelId,
        videoUrl: transformFilesToUrls(formData.videoUrl).join(''),
        propertyStr: detail.propertyStr,
        productGroupNameStr: Array.isArray(formData.productGroupNameStr)
          ? formData.productGroupNameStr.join(',')
          : '',
        diyModelId: formData.diyModelId,
        shopProductItemList: detail.shopProductItemList.map((spec: any) => {
          let specFormItem = skuData.skus[spec.id];
          let specData: any = {
            topProductItemId:spec.topProductItemId,
            productItemNo: spec.productItemNo,
            imageUrl: transformFilesToUrls(specFormItem.imageUrl).join(''),
            recommendedPrice: Number(specFormItem.recommendedPrice) * 100,
            price: Number(specFormItem.price) * 100,
            stockNum: specFormItem.stockNum,
            isEnable: specFormItem.isEnable,
            diyModelId: specFormItem.diyModelId,
            sandwichModelId: specFormItem.sandwichModelId,
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
          if (isEditMode && spec._isNew !== true) {
            specData.id = spec.id;
          }
          return specData;
        })
      };
      if (isEditMode) {
        submitData.id = detail.id;
      }
      return submitData;
    },
    [detail, transformImage, isEditMode],
  );

  const onFormFinish = useCallback(
    (values) => {
      skutableRef.current.validateFields().then((skuTable: any) => {
        // console.log('skuTable',skuTable)
        let newSubmitData = getEditSubmitFormData(values, skuTable);
        let finalSubmitData: any = {
          ...newSubmitData,
        };
        //   finalSubmitData.shopProductDetail.appContent = values.appContent;
        //  finalSubmitData.shopProductDetail.pcContent = values.pcContent;
        if (isEditMode) {
          dispatch({
            type: 'product/updateProduct',
            payload: finalSubmitData,
          }).then(() => {
            message.success('修改商品成功！');
            history.push('/product/product-manage/list');
          });
        } else {
          dispatch({
            type: 'product/addProduct',
            payload: finalSubmitData,
          }).then(() => {
            message.success('添加商品成功！');
            history.push('/product/product-manage/list');
          });
        }
      });

    },
    [skutableRef, detail, isEditMode, getEditSubmitFormData],
  );
  const bindDSYunProductDetail = useCallback(
    (detail: ProductEntityStateType) => {
      formDetail.setFieldsValue({
        productNo: detail.productNo,
        categoryName: detail.categoryName,
        categoryTypeName: detail.categoryTypeName,
        name: detail.name,
        imageUrl: detail.imageUrl,
        videoUrl: detail.videoUrl,
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
      productName:detail.productName,
      productDesc:detail.productDesc,
      imageUrl: detail.imageUrl,
      isCake: detail.isCake,
      labelId:detail.labelId,
      videoUrl: detail.videoUrl,
      diyModelId: detail.diyModelId,
      productGroupNameStr: detail.productGroupNameStr,
      
    });

  }, []);
  const onSelectDSYunProduct = useCallback(
    (record: any) => {
      dispatch({
        type: 'product/bindDsyunProductToDetail',
        payload: {
          id: record.id,
          isEditMode: isEditMode,
        },
      }).then((detail: any) => {
        if (!isEditMode) {
          bindDSYunProductDetail(detail);
        }
      });
    },
    [bindDSYunProductDetail, isEditMode],
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
              setDSYunModal({
                visible: true,
                dataItem: {
                  productNo:isEditMode?detail.productNo:'',
                },
              });
            }}
          >
            选择商品
          </Button>
        }
      >

        <Form
          {...formProps}
          name="step1"
          form={formDetail}
          onFinish={onFormFinish}
        >
          {
            <Row className={styles.formContent}>
              <Col span={24}>
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
                  <Form.Item
                    label="商品分类"
                    initialValue={detail.categoryName}
                    name="categoryName"
                  >
                    <Input disabled></Input>
                  </Form.Item>
                  <Form.Item
                    label="商品名称"
                    initialValue={detail.name}
                    name="name"
                  >
                    <Input disabled></Input>
                  </Form.Item>
                  <Form.Item
                      label="商品名"
                      name="productName"
                      initialValue={detail.productName}
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
                    <Form.Item
                      label="商品卖点"
                      name="productDesc"
                      initialValue={detail.productDesc}
                    >
                      <Input maxLength={50}></Input>
                    </Form.Item>
                  <Form.Item
                    label="是否是蛋糕"
                    name="isCake"
                    initialValue={detail.isCake}
                  >
                    <Select>
                      <Select.Option value={1} key={1}>
                        是
                        </Select.Option>
                      <Select.Option value={0} key={0}>
                        否
                        </Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="选择标签" name="labelId" initialValue={detail.labelId}>
                    <GoodsLabelSelect></GoodsLabelSelect>
                  </Form.Item>
                  <Form.Item
                    label="商品图片"
                    name="imageUrl"
                    {...formProps2}
                    initialValue={[]}
                    valuePropName="fileList"
                    required={false}
                  >
                    <UploadImage
                      draggleSort={false}
                      disabled={true}
                      maxCount={15}
                    ></UploadImage>
                  </Form.Item>
                  <Form.Item
                    label="商品视频"
                    name="videoUrl"
                    initialValue={[]}
                    valuePropName="fileList"
                  >
                    <UploadVideo
                      disabled={true}
                      maxCount={1}
                    ></UploadVideo>
                  </Form.Item>
                  <Form.Item
                    label="DIY商品模型"
                    initialValue={detail.diyModelId}
                  >
                    <Input.Group>
                      <Form.Item name="diyModelId">
                        <DIYModelSelect></DIYModelSelect>
                      </Form.Item>
                    </Input.Group>
                  </Form.Item>
                  <Form.Item
                    label="商品分组"
                    name="productGroupNameStr"
                    initialValue={detail.productGroupNameStr}
                  >
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
                  <Form.Item label="规格明细" shouldUpdate {...formProps2}>
                    {({ getFieldValue }) => {
                      return (
                        <SKUTable
                          isCake={getFieldValue('isCake')}
                          ref={skutableRef}
                          propertyList={detail.propertyList}
                          shopProductItemList={detail.shopProductItemList}
                          dispatch={dispatch}
                        />
                      );
                    }}
                  </Form.Item>
  
                </Card>
                <Form.Item label={<span></span>} colon={false}>
                  <Button
                    htmlType="submit"
                    type="primary"
                    onClick={(e) => {
                      if (detail.productNo === '') {
                        message.error('请先选择商品');
                        e.preventDefault();
                      }
                    }}
                  >
                    保存
                    </Button>
                </Form.Item>
              </Col>
            </Row>
          }
        </Form>


      </Card>
      <DSYunProductListModal
        dataItem={DSYunModal.dataItem}
        visible={DSYunModal.visible}
        onCancel={() => {
          setDSYunModal({
            dataItem: {},
            visible: false,
          });
        }}
        onOk={onSelectDSYunProduct}
      ></DSYunProductListModal>
    </>
  );
};
export default connect(
  ({ product, loading }: { product: ProductModelState; loading: Loading }) => ({
    product,
    submitLoading: !!loading.models.product,
  }),
)(ProductEdit);
